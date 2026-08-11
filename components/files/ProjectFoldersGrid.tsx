"use client";

import React from "react";
import { Folder, FolderKanban, ChevronRight } from "lucide-react";
import { FileItem, ProjectOption } from "./types";

interface ProjectFoldersGridProps {
  projectOptions: ProjectOption[];
  files: FileItem[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}

export default function ProjectFoldersGrid({
  projectOptions,
  files,
  selectedProjectId,
  setSelectedProjectId,
}: ProjectFoldersGridProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <FolderKanban className="h-4 w-4 text-indigo-500" />
          <span>Project Folders</span>
        </h2>
        {selectedProjectId !== "All" && (
          <button
            onClick={() => setSelectedProjectId("All")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Show All Folders
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* "All Projects" Folder Card */}
        <div
          onClick={() => setSelectedProjectId("All")}
          className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            selectedProjectId === "All"
              ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Folder className="h-5 w-5 fill-indigo-500/20" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                All Files
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {files.length} items
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </div>

        {/* Dynamic Project Folders */}
        {projectOptions.map((proj) => {
          const projFiles = files.filter((f) => f.project_id === proj.id);
          const totalSize = projFiles.reduce((acc, f) => acc + f.size, 0);
          const isSelected = selectedProjectId === proj.id;

          return (
            <div
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                isSelected
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Folder className="h-5 w-5 fill-amber-500/20" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {proj.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {projFiles.length} items • {formatBytes(totalSize)}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}