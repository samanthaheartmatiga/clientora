"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FolderKanban,
  Building2,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  FileCode2,
  Loader2,
} from "lucide-react";
import { Project } from "./types";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/lib/permissions";

interface ProjectGridProps {
  projects: Project[];
  loading: boolean;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

export default function ProjectGrid({
  projects,
  loading,
  onEdit,
  onDelete,
}: ProjectGridProps) {
  const { role } = useUserRole();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setActiveMenuId(null);
      }
    };

    if (activeMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenuId]);

  const handleDelete = (id: string) => {
    if (!canPerformAction(role, "projects", "delete")) return;
    onDelete(id);
    setActiveMenuId(null);
  };

  const canEdit = canPerformAction(role, "projects", "update");
  const canDelete = canPerformAction(role, "projects", "delete");
  const hasActions = canEdit || canDelete;

  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "Planning":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <FileCode2 className="h-3 w-3" />
            <span>Planning</span>
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </span>
        );
      case "Review":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Search className="h-3 w-3" />
            <span>Review</span>
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
        <span className="text-xs">Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 text-xs shadow-sm">
        No projects found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 relative transition-colors duration-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <FolderKanban className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {project.title}
                </h3>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <Building2 className="h-3 w-3" />
                  <span>{project.company_name || "Unassigned Client"}</span>
                </div>
              </div>
            </div>

            {hasActions && (
              <button
                onClick={() =>
                  setActiveMenuId(activeMenuId === project.id ? null : project.id)
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            )}

            {hasActions && activeMenuId === project.id && (
              <div
                ref={menuRef}
                className="absolute right-4 top-12 z-50 w-28 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl p-0.5 text-left space-y-0.5"
              >
                <PermissionGuard module="projects" action="update">
                  <button
                    onClick={() => {
                      onEdit(project);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Edit</span>
                  </button>
                </PermissionGuard>

                <PermissionGuard module="projects" action="delete">
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="w-full flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 shrink-0" />
                    <span>Delete</span>
                  </button>
                </PermissionGuard>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Budget</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                ${project.budget ? project.budget.toLocaleString() : "0"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-right">
                Due Date
              </p>
              <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 text-[11px]">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>{project.due_date}</span>
              </div>
            </div>
          </div>

          {/* Status Tag */}
          <div className="pt-1 flex items-center justify-between">
            {getStatusBadge(project.status)}
          </div>
        </div>
      ))}
    </div>
  );
}