"use client";

import React, { useState } from "react";
import { X, Loader2, Zap, Upload, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Template } from "./types";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/lib/permissions";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate: Template | null;
  onSubmit: (data: {
    title: string;
    category: Template["category"];
    description: string;
    file_url: string;
    file_name: string;
    file_size?: number | null;
  }) => Promise<void>;
}

export default function TemplateModal({
  isOpen,
  onClose,
  editingTemplate,
  onSubmit,
}: TemplateModalProps) {
  const { role, loading } = useUserRole();

  const [title, setTitle] = useState<string>(editingTemplate?.title || "");
  const [category, setCategory] = useState<Template["category"]>(
    editingTemplate?.category || "Proposal"
  );
  const [description, setDescription] = useState<string>(
    editingTemplate?.description || ""
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const requiredAction = editingTemplate ? "update" : "create";
  const hasAccess = canPerformAction(role, "templates", requiredAction);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasAccess) return;
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess || !title) return;

    try {
      setIsSubmitting(true);
      let fileUrl = editingTemplate?.file_url || "";
      let fileName = editingTemplate?.file_name || "";
      let fileSize = editingTemplate?.file_size || null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("templates")
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error("Storage upload error:", uploadError.message);
          setIsSubmitting(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("templates")
          .getPublicUrl(filePath);

        fileUrl = publicUrlData.publicUrl;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
      }

      if (!fileUrl) {
        alert("Please select a document file (.docx, .pdf, .doc) to upload.");
        setIsSubmitting(false);
        return;
      }

      await onSubmit({
        title,
        category,
        description,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
      });
    } catch (err) {
      console.error("Error saving template:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: Template["category"][] = [
    "Proposal",
    "Contract",
    "Invoice",
    "Email",
    "Scope",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl dark:shadow-indigo-950/40 relative transition-colors duration-200">
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {editingTemplate ? "Edit Template" : "Upload New Template"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload reusable Word (.docx), PDF, or contract files by category.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!loading && !hasAccess && (
          <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>
              Permission Denied: Your role ({role}) cannot {editingTemplate ? "edit" : "upload"} templates.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Template Title
            </label>
            <input
              type="text"
              required
              disabled={!hasAccess}
              placeholder="e.g. Master Web Development Services Contract"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              disabled={!hasAccess}
              value={category}
              onChange={(e) => setCategory(e.target.value as Template["category"])}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Summary / Description
            </label>
            <input
              type="text"
              disabled={!hasAccess}
              placeholder="Brief instructions on when and how to use this document..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Document File (.docx, .doc, .pdf)
            </label>
            <div className="relative border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                  {selectedFile
                    ? selectedFile.name
                    : editingTemplate?.file_name || "No file selected"}
                </span>
              </div>
              <label
                className={`bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 shrink-0 ${
                  !hasAccess ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{selectedFile || editingTemplate ? "Change File" : "Upload File"}</span>
                <input
                  type="file"
                  accept=".docx,.doc,.pdf,.txt"
                  disabled={!hasAccess}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2.5 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasAccess || loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{editingTemplate ? "Save Changes" : "Upload Template"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}