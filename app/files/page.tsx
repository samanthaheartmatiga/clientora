"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Upload } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { logWorkspaceActivity } from "@/lib/audit";

import { FileItem, FileCategory, ProjectOption } from "@/components/files/types";
import FileGuideBanner from "@/components/files/FileGuideBanner";
import FileFilterControls from "@/components/files/FileFilterControls";
import FileList from "@/components/files/FileList";
import UploadModal from "@/components/files/UploadModal";

interface DbProjectFileRecord {
  file_path: string;
  project_id: string;
  projects:
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
    const { data, error } = await supabase
      .from("projects")
      .select("id, title")
      .order("title", { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error.message);
      return;
    }

    if (data) setProjectOptions(data as ProjectOption[]);
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);

      const { data: storageData, error: storageError } = await supabase.storage
        .from("files")
        .list("", {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (storageError) {
        console.error("Error fetching storage files:", storageError.message);
        return;
      }

      if (storageData) {
        const validFiles = storageData.filter(
          (item) =>
            item.name !== ".emptyFolderPlaceholder" &&
            !item.name.startsWith(".")
        );

        const { data: dbRecords, error: dbError } = await supabase
          .from("project_files")
          .select("file_path, project_id, projects(id, title)");

        if (dbError) {
          console.error("Error fetching project_files records:", dbError.message);
        }

        const projectMap = new Map<string, { id: string; title: string }>();
        if (dbRecords) {
          const records = dbRecords as unknown as DbProjectFileRecord[];
          for (const rec of records) {
            const projObj = Array.isArray(rec.projects)
              ? rec.projects[0]
              : rec.projects;

            if (rec.file_path && rec.project_id) {
              projectMap.set(rec.file_path, {
                id: rec.project_id,
                title: projObj?.title || "Project",
              });
            }
          }
        }

        const formattedFiles: FileItem[] = validFiles.map((item) => {
          const { data: urlData } = supabase.storage
            .from("files")
            .getPublicUrl(item.name);

          const projInfo = projectMap.get(item.name);

          return {
            id: item.id || item.name,
            name: item.name,
            displayName: cleanFileNameDisplay(item.name),
            size: item.metadata?.size || 0,
            created_at: item.created_at || new Date().toISOString(),
            publicUrl: urlData.publicUrl,
            project_id: projInfo?.id || null,
            project_title: projInfo?.title || null,
          };
        });

        setFiles(formattedFiles);
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await fetchProjects();
      await fetchFiles();
    }
    init();

    const realtimeChannel = supabase
      .channel("realtime-project-files")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_files" },
        () => {
          fetchFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [fetchProjects, fetchFiles]);

  const handleModalUpload = async (file: File, uploadProjectId: string) => {
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
      await logWorkspaceActivity(`Uploaded File: ${file.name}${projSuffix}`);

      await fetchFiles();
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    const targetFile = files.find((f) => f.name === fileName);
    try {
      setFiles((prev) => prev.filter((f) => f.name !== fileName));

      await supabase.storage.from("files").remove([fileName]);
      await supabase.from("project_files").delete().eq("file_path", fileName);

      await logWorkspaceActivity(
        `Deleted File: ${targetFile?.displayName || fileName}`
      );

      await fetchFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
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
            Store and manage client deliverables, assets, and project documentation.
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