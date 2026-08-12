"use client";

import React, { useState } from "react";
import { Edit2, Trash2, FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import { Template } from "./types";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/lib/permissions";

interface TemplateGridProps {
  templates: Template[];
  loading: boolean;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
}

export default function TemplateGrid({
  templates,
  loading,
  onEdit,
  onDelete,
}: TemplateGridProps) {
  const { role } = useUserRole();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (!canPerformAction(role, "templates", "delete")) return;
    onDelete(id);
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleView = (fileUrl: string) => {
    const isDoc = fileUrl.match(/\.(docx|doc)(\?.*)?$/i);
    if (isDoc) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=false`;
      window.open(viewerUrl, "_blank");
    } else {
      window.open(fileUrl, "_blank");
    }
  };

  const handleDownload = async (id: string, fileUrl: string, fileName: string) => {
    try {
      setDownloadingId(id);

      const response = await fetch(fileUrl);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "template-document";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
      window.open(fileUrl, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900">
        Loading document templates...
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
        <FileText className="h-8 w-8 text-slate-400 mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No templates found
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Upload document templates (.docx, .pdf) to reuse across your client projects.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((tpl) => (
        <div
          key={tpl.id}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {tpl.category}
              </span>

              {/* EDIT / DELETE ACTION BUTTONS FOR ADMIN/SUPERADMIN ONLY */}
              <div className="flex items-center space-x-1">
                <PermissionGuard module="templates" action="update">
                  <button
                    title="Edit Template Details"
                    suppressHydrationWarning
                    onClick={() => onEdit(tpl)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </PermissionGuard>

                <PermissionGuard module="templates" action="delete">
                  <button
                    title="Delete Template"
                    suppressHydrationWarning
                    onClick={() => handleDelete(tpl.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </PermissionGuard>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="truncate">{tpl.title}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {tpl.description || "No description provided."}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                  {tpl.file_name}
                </span>
              </div>
              {tpl.file_size && (
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                  {formatFileSize(tpl.file_size)}
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {tpl.created_at ? new Date(tpl.created_at).toLocaleDateString() : ""}
            </span>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleView(tpl.file_url)}
                title="View Document"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View</span>
              </button>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => handleDownload(tpl.id, tpl.file_url, tpl.file_name)}
                disabled={downloadingId === tpl.id}
                title="Download Document"
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
              >
                {downloadingId === tpl.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}