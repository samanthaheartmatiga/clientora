"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, HardDrive, ChevronDown, Check, FolderKanban } from "lucide-react";
import { FileCategory, ProjectOption } from "./types";

interface FileFilterControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: FileCategory;
  setSelectedCategory: (cat: FileCategory) => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  projectOptions: ProjectOption[];
  totalSizeBytes: number;
  totalItems: number;
}

export default function FileFilterControls({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedProjectId,
  setSelectedProjectId,
  projectOptions,
  totalSizeBytes,
  totalItems,
}: FileFilterControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const categories: FileCategory[] = ["All", "Documents", "Images", "Archives"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeProjectLabel =
    selectedProjectId === "All"
      ? "All Projects"
      : projectOptions.find((p) => p.id === selectedProjectId)?.title || "All Projects";

  return (
    <div className="relative z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      {/* Search Bar + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
        {/* Search Input */}
        <div className="relative w-full sm:w-56 md:w-64 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
          {/* Project Dropdown */}
          <div className="relative shrink-0 z-50" ref={dropdownRef}>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <FolderKanban className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="max-w-27.5 truncate">{activeProjectLabel}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    setSelectedProjectId("All");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition cursor-pointer ${
                    selectedProjectId === "All"
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span>All Projects</span>
                  {selectedProjectId === "All" && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <div className="max-h-48 overflow-y-auto no-scrollbar scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {projectOptions.length === 0 ? (
                    <p className="px-3 py-2 text-[11px] text-slate-400 italic">No projects found</p>
                  ) : (
                    projectOptions.map((p) => {
                      const isSelected = selectedProjectId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <span className="truncate">{p.title}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

          {/* Category Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5 min-w-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                suppressHydrationWarning
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Storage Stats Footer */}
      <div className="flex items-center justify-between lg:justify-end space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center space-x-1.5">
          <HardDrive className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>Storage Used:</span>
        </div>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {formatBytes(totalSizeBytes)} ({totalItems} items)
        </span>
      </div>
    </div>
  );
}