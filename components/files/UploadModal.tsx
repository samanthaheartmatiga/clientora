"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Loader2,
  FolderKanban,
  FileText,
  ChevronDown,
  Check,
  AlertCircle,
} from "lucide-react";
import { ProjectOption } from "./types";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectOptions: ProjectOption[];
  onUpload: (file: File, projectId: string) => Promise<void>;
  uploading: boolean;
}

export default function UploadModal({
  isOpen,
  onClose,
  projectOptions,
  onUpload,
  uploading,
}: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    try {
      setErrorMessage("");
      await onUpload(selectedFile, projectId);
      setSelectedFile(null);
      setProjectId("");
      onClose();
    } catch (err) {
      console.error("Modal upload failed:", err);
      setErrorMessage("Failed to upload file. Please try again.");
    }
  };

  const activeProjectLabel =
    projectId === ""
      ? "No Project Tag (General File)"
      : projectOptions.find((p) => p.id === projectId)?.title ||
        "No Project Tag (General File)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl relative overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 rounded-t-3xl">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Upload className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Upload New File
            </h3>
          </div>
          <button
            type="button"
            suppressHydrationWarning
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="flex items-center space-x-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Native HTML Label for 100% Reliable File Picker on Mobile Web */}
          <label
            htmlFor="file-upload-input"
            className="block border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/20 group"
          >
            <input
              id="file-upload-input"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <FileText className="h-5 w-5 shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {selectedFile.name}
                </span>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tap to select file to upload
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  PDF, images, documents, or archive files
                </p>
              </div>
            )}
          </label>

          {/* Custom Project Selector Popover */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center space-x-1">
              <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />
              <span>Assign to Project (Optional)</span>
            </label>

            <div className="relative">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                <span className="truncate">{activeProjectLabel}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    isProjectDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isProjectDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-1 overflow-hidden">
                  <div className="max-h-48 overflow-y-auto no-scrollbar">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => {
                        setProjectId("");
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition cursor-pointer ${
                        projectId === ""
                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span>No Project Tag (General File)</span>
                      {projectId === "" && (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    {projectOptions.map((p) => {
                      const isSelected = projectId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            setProjectId(p.id);
                            setIsProjectDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <span className="truncate">{p.title}</span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              suppressHydrationWarning
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              suppressHydrationWarning
              disabled={!selectedFile || uploading}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload File</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}