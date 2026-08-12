"use client";

import React, { useState } from "react";
import {
  X,
  Loader2,
  FolderKanban,
  FileCode2,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Project, ClientOption } from "./types";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/lib/permissions";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject: Project | null;
  clientOptions: ClientOption[];
  onSubmit: (data: {
    client_id: string;
    title: string;
    status: Project["status"];
    budget: number;
    due_date: string;
  }) => Promise<void>;
}

export default function ProjectModal({
  isOpen,
  onClose,
  editingProject,
  clientOptions,
  onSubmit,
}: ProjectModalProps) {
  const { role, loading } = useUserRole();

  const [title, setTitle] = useState<string>(editingProject?.title || "");
  const [clientId, setClientId] = useState<string>(
    editingProject?.client_id || (clientOptions[0]?.id ?? "")
  );
  const [status, setStatus] = useState<Project["status"]>(
    editingProject?.status || "Planning"
  );
  const [budget, setBudget] = useState<string>(
    editingProject?.budget !== undefined && editingProject?.budget !== null
      ? String(editingProject.budget)
      : ""
  );
  const [dueDate, setDueDate] = useState<string>(
    editingProject?.due_date || new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const requiredAction = editingProject ? "update" : "create";
  const hasAccess = canPerformAction(role, "projects", requiredAction);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanedValue = value.replace(/^0+(?=\d)/, "");
    setBudget(cleanedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) return;

    const selectedClientId = clientId || clientOptions[0]?.id;
    if (!title || !selectedClientId) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title,
        client_id: selectedClientId,
        status,
        budget: budget === "" ? 0 : Number(budget),
        due_date: dueDate,
      });
    } catch (error) {
      console.error("Error submitting project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { id: "Planning" as const, label: "Planning", icon: FileCode2 },
    { id: "In Progress" as const, label: "In Progress", icon: Clock },
    { id: "Review" as const, label: "Review", icon: Search },
    { id: "Completed" as const, label: "Completed", icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl dark:shadow-indigo-950/40 relative transition-colors duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {editingProject ? "Edit Project" : "Add New Project"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Set project title, client association, and deadlines.
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

        {/* Permission Warning Banner */}
        {!loading && !hasAccess && (
          <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>
              Permission Denied: Your role ({role}) cannot {editingProject ? "edit" : "create"} projects.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              required
              disabled={!hasAccess}
              placeholder="e.g. Website Redesign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Client Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Client
            </label>
            <div className="relative">
              <select
                required
                disabled={!hasAccess}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  Select Client
                </option>
                {clientOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Budget ($)
              </label>
              <input
                type="number"
                min="0"
                disabled={!hasAccess}
                placeholder="0"
                value={budget}
                onChange={handleBudgetChange}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                required
                disabled={!hasAccess}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Status Segmented Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!hasAccess}
                    onClick={() => setStatus(opt.id)}
                    className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
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
              <span>{editingProject ? "Save Changes" : "Create Project"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}