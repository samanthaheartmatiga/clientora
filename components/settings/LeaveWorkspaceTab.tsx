"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { logWorkspaceActivity } from "@/lib/audit";

interface LeaveWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaveWorkspaceModal({
  isOpen,
  onClose,
}: LeaveWorkspaceModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg, organizations, switchOrganization } = useWorkspace();

  const [isLeaving, setIsLeaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLeaveWorkspace = async () => {
    if (!currentOrg?.id) return;

    setIsLeaving(true);
    setErrorMsg(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Authentication required.");

      const { data, error } = await supabase.rpc("remove_organization_member", {
        target_org_id: currentOrg.id,
        target_user_id: user.id,
      });

      if (error) throw error;

      if (!data?.success) {
        setErrorMsg(data?.message || "Failed to leave workspace.");
        setIsLeaving(false);
        return;
      }

      await logWorkspaceActivity(`Left workspace "${currentOrg.name}"`);

      const remaining = organizations.filter((o) => o.id !== currentOrg.id);
      if (remaining.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem("active_workspace_id", remaining[0].id);
          localStorage.setItem("current_organization_id", remaining[0].id);
        }
        if (switchOrganization) {
          await switchOrganization(remaining[0].id);
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("active_workspace_id");
          localStorage.removeItem("current_organization_id");
        }
      }

      onClose();
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
        <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Leave {currentOrg?.name}?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Are you sure you want to leave this workspace? You will lose access to all its projects, invoices, and resources until you are invited again.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end space-x-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLeaveWorkspace}
            disabled={isLeaving}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
          >
            {isLeaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Leaving...</span>
              </>
            ) : (
              <span>Confirm & Leave</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}