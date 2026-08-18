"use client";

import React, { useState } from "react";
import {
  Folder,
  Eye,
  Download,
  Trash2,
  Loader2,
  FileText,
  FileCode,
  FileImage,
  FileSpreadsheet,
  Archive,
  FolderKanban,
  AlertTriangle,
  X,
} from "lucide-react";
import { FileItem } from "./types";
import { PermissionGuard } from "@/components/common/PermissionGuard";

interface FileListProps {
  files: FileItem[];
  loading: boolean;
  onDelete: (fileIdentifier: string) => void | Promise<void>;
  onUploadClick: () => void;
}

export default function FileList({
  files,
  loading,
  onDelete,
  onUploadClick,
}: FileListProps) {
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(fileToDelete.name || fileToDelete.id);
      setFileToDelete(null);
    } catch (err) {
      console.error("Failed to delete file:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "svg", "webp"].includes(ext)) {
      return <FileImage className="h-4 w-4" />;
    }
    if (["zip", "rar", "7z", "tar"].includes(ext)) {
      return <Archive className="h-4 w-4" />;
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return <FileSpreadsheet className="h-4 w-4" />;
    }
    if (["ts", "tsx", "js", "jsx", "html", "json"].includes(ext)) {
      return <FileCode className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleDownload = async (publicUrl: string, displayName: string) => {
    try {
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = displayName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Direct download failed, falling back to tab open:", err);
      window.open(publicUrl, "_blank");
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            <span>Loading storage files...</span>
          </div>
        ) : files.length === 0 ? (
          <div
            onClick={onUploadClick}
            className="p-12 text-center transition border-2 border-dashed border-transparent rounded-2xl cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 hover:border-indigo-500/30"
          >
            <Folder className="h-10 w-10 text-slate-400 group-hover:text-indigo-500 transition mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No files found in this view
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Click anywhere here or hit the Upload File button above to upload project deliverables.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {files.map((file) => (
              <div
                key={file.id || file.name}
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    {getFileIcon(file.name || file.displayName)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {file.displayName}
                      </p>
                      {file.project_title ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                          <FolderKanban className="h-3 w-3" />
                          <span>{file.project_title}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                          General
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {formatBytes(file.size)} • Uploaded on{" "}
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 sm:space-x-2 shrink-0 ml-4">
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="View / Preview File"
                  >
                    <Eye className="h-4 w-4" />
                  </a>

                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => handleDownload(file.publicUrl, file.displayName)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Download File"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <PermissionGuard module="files" action="delete">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setFileToDelete(file)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Delete File"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </PermissionGuard>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Delete File
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-300">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                &quot;{fileToDelete.displayName}&quot;
              </span>
              ?
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setFileToDelete(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete File</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}