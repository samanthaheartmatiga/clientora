"use client";

import React from "react";
import Link from "next/link";
import { FolderKanban, ArrowUpRight, Building2 } from "lucide-react";

export interface ProjectSummary {
  id: string;
  title: string;
  company_name?: string;
  status: "Planning" | "In Progress" | "Review" | "Completed";
  due_date: string;
  budget: number;
}

interface RecentProjectsTableProps {
  projects: ProjectSummary[];
}

export default function RecentProjectsTable({ projects }: RecentProjectsTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FolderKanban className="h-4 w-4 text-indigo-500" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Recent Project Activity
          </h2>
        </div>
        <Link
          href="/projects"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
        >
          <span>View All Projects</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-x-auto">
        {projects.length === 0 ? (
          <p className="p-4 text-center text-xs text-slate-400">
            No project records available yet.
          </p>
        ) : (
          projects.map((proj) => (
            <div
              key={proj.id}
              className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition px-1 rounded-xl"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {proj.title}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{proj.company_name}</span>
                </p>
              </div>

              <div className="flex items-center space-x-4 shrink-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                    proj.status === "Completed"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : proj.status === "In Progress"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  }`}
                >
                  {proj.status}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Due: {proj.due_date || "N/A"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}