"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { logWorkspaceActivity } from "@/lib/audit";

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteWorkspaceModal({
  isOpen,
  onClose,
}: DeleteWorkspaceModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg, organizations, switchOrganization } = useWorkspace();

  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !currentOrg) return null;

  const handleDeleteWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmName !== currentOrg.name) {
      setErrorMsg("Workspace name does not match.");
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc("delete_organization", {
        target_org_id: currentOrg.id,
      });

      if (error) throw error;

      if (!data?.success) {
        setErrorMsg(data?.message || "Failed to delete workspace.");
        setIsDeleting(false);
        return;
      }

      await logWorkspaceActivity(`Deleted workspace "${currentOrg.name}"`);

      // Switch to next workspace or clear active cache
      const remaining = organizations.filter((o) => o.id !== currentOrg.id);
      if (remaining.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem("active_workspace_id", remaining[0].id);
          localStorage.setItem("current_organization_id", remaining[0].id);
        }
        if (switchOrganization) switchOrganization(remaining[0].id);
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("active_workspace_id");
          localStorage.removeItem("current_organization_id");
        }
      }

      onClose();
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete workspace.";
      setErrorMsg(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
        <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <Trash2 className="h-5 w-5" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Delete {currentOrg.name}?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This action is <strong>irreversible</strong>. All projects, invoices, client contacts, and team members in this workspace will be permanently deleted.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleDeleteWorkspace} className="space-y-3.5 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Type <span className="font-bold text-slate-900 dark:text-white">{currentOrg.name}</span> to confirm
            </label>
            <input
              type="text"
              required
              placeholder={currentOrg.name}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full mt-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting || confirmName !== currentOrg.name}
              className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}