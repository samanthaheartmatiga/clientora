"use client";

import React from "react";
import Link from "next/link";
import { FolderKanban, ArrowUpRight, Clock, Building2 } from "lucide-react";

export interface ProjectSummary {
  id: string;
  title: string;
  company_name: string;
  status: "Planning" | "In Progress" | "Review" | "Completed";
  due_date?: string;
  budget?: number;
}

export type ProjectActivityItem = ProjectSummary;

interface RecentProjectsTableProps {
  projects: ProjectSummary[];
}

const STATUS_BADGES: Record<ProjectSummary["status"], string> = {
  Planning:
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "In Progress":
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Review:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Completed:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export default function RecentProjectsTable({ projects }: RecentProjectsTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
      {/* Responsive Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
          <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <h2 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
            Recent Project Activity
          </h2>
        </div>

        <Link
          href="/projects"
          className="text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 shrink-0 whitespace-nowrap"
        >
          <span>
            View All<span className="hidden sm:inline"> Projects</span>
          </span>
          <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
        </Link>
      </div>

      {/* Project Activity List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {projects.length === 0 ? (
          <p className="p-4 text-center text-xs text-slate-400">
            No recent project activity found.
          </p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="py-2.5 sm:py-3 flex items-center justify-between gap-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition px-1 rounded-xl"
            >
              {/* Project Title, Client Name & Due Date */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {project.title}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700 shrink-0">•</span>
                  <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-slate-400 shrink-0 hidden sm:inline" />
                    {project.company_name}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-slate-400" />
                  <span>
                    Due:{" "}
                    {project.due_date
                      ? new Date(project.due_date).toLocaleDateString()
                      : "N/A"}
                  </span>
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${
                    STATUS_BADGES[project.status] || STATUS_BADGES.Planning
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}