"use client";

import React, { useState } from "react";
import {
  X,
  Loader2,
  Building2,
  Mail,
  CheckCircle2,
  Clock,
  Archive,
  AlertCircle,
} from "lucide-react";
import { Client } from "./types";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/lib/permissions";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClient: Client | null;
  onSubmit: (data: {
    company_name: string;
    contact_email: string;
    status: "Active" | "Lead" | "Archived";
  }) => Promise<void>;
}

export default function ClientModal({
  isOpen,
  onClose,
  editingClient,
  onSubmit,
}: ClientModalProps) {
  const { role, loading } = useUserRole();

  const [companyName, setCompanyName] = useState<string>(
    editingClient?.company_name || ""
  );
  const [contactEmail, setContactEmail] = useState<string>(
    editingClient?.contact_email || ""
  );
  const [status, setStatus] = useState<"Active" | "Lead" | "Archived">(
    editingClient?.status || "Active"
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Determine required action based on mode
  const requiredAction = editingClient ? "update" : "create";
  const hasAccess = canPerformAction(role, "clients", requiredAction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess || !companyName || !contactEmail) return;

    setIsSubmitting(true);
    await onSubmit({
      company_name: companyName,
      contact_email: contactEmail,
      status,
    });
    setIsSubmitting(false);
  };

  const statusOptions = [
    {
      id: "Active" as const,
      label: "Active",
      icon: CheckCircle2,
      activeStyle:
        "bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10",
      hoverStyle:
        "hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-600 dark:text-slate-400",
    },
    {
      id: "Lead" as const,
      label: "Lead",
      icon: Clock,
      activeStyle:
        "bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10",
      hoverStyle:
        "hover:bg-amber-500/10 hover:border-amber-500/30 text-slate-600 dark:text-slate-400",
    },
    {
      id: "Archived" as const,
      label: "Archived",
      icon: Archive,
      activeStyle:
        "bg-slate-500/20 border-slate-500/50 text-slate-700 dark:text-slate-300 shadow-sm shadow-slate-500/10",
      hoverStyle:
        "hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl dark:shadow-indigo-950/40 relative transition-colors duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-inner">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {editingClient ? "Edit Client Details" : "Add New Client"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {editingClient
                  ? "Update relationship status and contact details."
                  : "Enter details to create a new client entry."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Permission Error Banner */}
        {!loading && !hasAccess && (
          <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>
              Permission Denied: Your role ({role}) cannot {editingClient ? "edit" : "create"} clients.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Company Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                required
                disabled={!hasAccess}
                placeholder="e.g. Black Clover"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Contact Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                disabled={!hasAccess}
                placeholder="e.g. blaver@gmail.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Segmented Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!hasAccess}
                    onClick={() => setStatus(opt.id)}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? opt.activeStyle
                        : `border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 ${opt.hoverStyle}`
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{opt.label}</span>
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
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasAccess || loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{editingClient ? "Save Changes" : "Create Client"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}