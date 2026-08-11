"use client";

import React from "react";
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
} from "lucide-react";
import { FileItem } from "./types";

interface FileListProps {
  files: FileItem[];
  loading: boolean;
  onDelete: (fileName: string) => void;
  onUploadClick: () => void;
}

export default function FileList({
  files,
  loading,
  onDelete,
  onUploadClick,
}: FileListProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
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

  // Forces direct file download instead of browser opening it inline
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span>Loading storage files...</span>
        </div>
      ) : files.length === 0 ? (
        <div
          onClick={onUploadClick}
          className="p-12 text-center cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition border-2 border-dashed border-transparent hover:border-indigo-500/30 rounded-2xl"
        >
          <Folder className="h-10 w-10 text-slate-400 group-hover:text-indigo-500 transition mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No files found in this view
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            Click anywhere here or hit the <strong>Upload File</strong> button above to upload project deliverables.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  {getFileIcon(file.name)}
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

              {/* Action Buttons: View, Download, Delete */}
              <div className="flex items-center space-x-1 sm:space-x-2 shrink-0 ml-4">
                {/* View Button */}
                <a
                  href={file.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="View / Preview File"
                >
                  <Eye className="h-4 w-4" />
                </a>

                {/* Direct Download Button */}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleDownload(file.publicUrl, file.displayName)}
                  className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Download File"
                >
                  <Download className="h-4 w-4" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => onDelete(file.name)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Delete File"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}