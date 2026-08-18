"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Upload } from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { logWorkspaceActivity } from "@/lib/audit";

import { FileItem, FileCategory, ProjectOption } from "@/components/files/types";
import FileGuideBanner from "@/components/files/FileGuideBanner";
import FileFilterControls from "@/components/files/FileFilterControls";
import FileList from "@/components/files/FileList";
import UploadModal from "@/components/files/UploadModal";

interface DbProjectFileRecord {
  id?: string;
  file_name?: string;
  file_path: string;
  file_size?: number;
  project_id?: string | null;
  organization_id?: string | null;
  created_at?: string;
  projects?:
    | {
        id?: string;
        title: string;
      }
    | {
        id?: string;
        title: string;
      }[]
    | null;
}

export default function FilesPage() {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg } = useWorkspace();
  const currentOrgId = currentOrg?.id;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>("All");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("All");

  const cleanFileNameDisplay = (rawName: string): string => {
    return rawName.replace(/^\d+_\s*/, "");
  };

  const fetchProjects = useCallback(async () => {
    if (!currentOrgId) {
      setProjectOptions([]);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, title")
      .eq("organization_id", currentOrgId)
      .order("title", { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error.message);
      return;
    }

    if (data) setProjectOptions(data as ProjectOption[]);
  }, [supabase, currentOrgId]);

  const fetchFiles = useCallback(async () => {
    if (!currentOrgId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: dbRecords, error: dbError } = await supabase
        .from("project_files")
        .select("id, file_name, file_path, file_size, project_id, organization_id, created_at, projects(id, title)")
        .eq("organization_id", currentOrgId)
        .order("created_at", { ascending: false });

      if (dbError) {
        console.error("Error fetching project_files records:", dbError.message);
      }

      const records = (dbRecords || []) as unknown as DbProjectFileRecord[];

      const formattedFiles: FileItem[] = records.map((rec) => {
        const { data: urlData } = supabase.storage
          .from("files")
          .getPublicUrl(rec.file_path);

        const projObj = Array.isArray(rec.projects)
          ? rec.projects[0]
          : rec.projects;

        return {
          id: rec.id || rec.file_path,
          name: rec.file_path, // Exact storage path used for deletion and downloads
          displayName: rec.file_name || cleanFileNameDisplay(rec.file_path),
          size: rec.file_size || 0,
          created_at: rec.created_at || new Date().toISOString(),
          publicUrl: urlData.publicUrl,
          project_id: rec.project_id || null,
          project_title: projObj?.title || null,
        };
      });

      setFiles(formattedFiles);
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentOrgId]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (isMounted) {
        await fetchProjects();
        await fetchFiles();
      }
    }
    void init();

    if (!currentOrgId) return;

    const realtimeChannel = supabase
      .channel(`realtime-project-files-${currentOrgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_files",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (isMounted) void fetchFiles();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(realtimeChannel);
    };
  }, [fetchProjects, fetchFiles, supabase, currentOrgId]);

  const handleModalUpload = async (file: File, uploadProjectId: string) => {
    if (!currentOrgId) return;
    setUploading(true);

    try {
      const cleanFileName = `${Date.now()}_${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;

      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(cleanFileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        return;
      }

      const { error: dbInsertError } = await supabase
        .from("project_files")
        .insert([
          {
            organization_id: currentOrgId,
            project_id: uploadProjectId || null,
            file_name: file.name,
            file_path: cleanFileName,
            file_size: file.size,
          },
        ]);

      if (dbInsertError) {
        console.error("Project link error:", dbInsertError.message);
      }

      const matchedProj = projectOptions.find((p) => p.id === uploadProjectId);
      const projSuffix = matchedProj ? ` (Project: ${matchedProj.title})` : "";
      await logWorkspaceActivity(`Uploaded File: ${file.name}${projSuffix}`, currentOrgId);

      await fetchFiles();
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileNameOrId: string) => {
    if (!currentOrgId) return;

    const targetFile = files.find(
      (f) => f.name === fileNameOrId || f.id === fileNameOrId
    );
    const storagePath = targetFile?.name || fileNameOrId;
    const recordId = targetFile?.id;

    try {
      // 1. Optimistically update local state immediately
      setFiles((prev) =>
        prev.filter((f) => f.name !== storagePath && f.id !== recordId)
      );

      // 2. Remove file from Supabase Storage
      if (storagePath) {
        const { error: storageErr } = await supabase.storage
          .from("files")
          .remove([storagePath]);

        if (storageErr) {
          console.error("Storage delete error:", storageErr.message);
        }
      }

      // 3. Delete database record by ID or file_path
      let dbQuery = supabase
        .from("project_files")
        .delete()
        .eq("organization_id", currentOrgId);

      if (recordId && recordId !== storagePath) {
        dbQuery = dbQuery.eq("id", recordId);
      } else {
        dbQuery = dbQuery.eq("file_path", storagePath);
      }

      const { error: dbDeleteErr } = await dbQuery;
      if (dbDeleteErr) {
        console.error("Database record delete error:", dbDeleteErr.message);
      }

      await logWorkspaceActivity(
        `Deleted File: ${targetFile?.displayName || storagePath}`,
        currentOrgId
      );

      await fetchFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
      await fetchFiles();
    }
  };

  const totalSizeBytes = files.reduce((acc, curr) => acc + curr.size, 0);

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.displayName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const ext = f.name.split(".").pop()?.toLowerCase() || "";

    if (!matchesSearch) return false;

    if (selectedProjectId !== "All" && f.project_id !== selectedProjectId) {
      return false;
    }

    if (selectedCategory === "Documents") {
      return ["pdf", "doc", "docx", "txt"].includes(ext);
    }
    if (selectedCategory === "Images") {
      return ["png", "jpg", "jpeg", "svg", "webp"].includes(ext);
    }
    if (selectedCategory === "Archives") {
      return ["zip", "rar", "7z", "tar"].includes(ext);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Files Repository
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Store and manage client deliverables, assets, and project documentation for{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {currentOrg?.name || "current workspace"}
            </span>.
          </p>
        </div>

        <button
          type="button"
          suppressHydrationWarning
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-3 sm:py-2.5 rounded-2xl sm:rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer shrink-0"
        >
          <Upload className="h-4 w-4" />
          <span>Upload File</span>
        </button>
      </div>

      <FileGuideBanner />

      <FileFilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        projectOptions={projectOptions}
        totalSizeBytes={totalSizeBytes}
        totalItems={files.length}
      />

      <FileList
        files={filteredFiles}
        loading={loading}
        onDelete={handleDeleteFile}
        onUploadClick={() => setIsModalOpen(true)}
      />

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectOptions={projectOptions}
        onUpload={handleModalUpload}
        uploading={uploading}
      />
    </div>
  );
}