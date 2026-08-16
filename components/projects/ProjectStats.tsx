"use client";

import React from "react";
import { FolderKanban, Compass, Clock, FileSearch, CheckCircle2 } from "lucide-react";
import { Project } from "./types";

interface ProjectStatsProps {
  projects: Project[];
}

export default function ProjectStats({ projects }: ProjectStatsProps) {
  const total = projects.length;
  const planning = projects.filter((p) => p.status === "Planning").length;
  const inProgress = projects.filter((p) => p.status === "In Progress").length;
  const review = projects.filter((p) => p.status === "Review").length;
  const completed = projects.filter((p) => p.status === "Completed").length;

  const stats = [
    {
      label: "Total Projects",
      value: total,
      icon: FolderKanban,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Planning",
      value: planning,
      icon: Compass,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Review",
      value: review,
      icon: FileSearch,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm dark:shadow-xl flex items-center justify-between transition-colors duration-200"
          >
            <div className="space-y-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {stat.label}
              </p>
              <p className={`text-xl font-bold tracking-tight ${stat.color}`}>
                {stat.value}
              </p>
            </div>
            <div
              className={`h-10 w-10 rounded-xl ${stat.bg} border flex items-center justify-center shrink-0 ml-2`}
            >
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}