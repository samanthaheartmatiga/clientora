"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Shield, ChevronDown, Check, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/app/supabase/client";

export type AppRole = "superadmin" | "admin" | "member" | "viewer";

export interface RoleConfig {
  label: string;
  level: number;
  description: string;
  badgeStyle: string;
}

export const ROLES: Record<AppRole, RoleConfig> = {
  superadmin: {
    label: "Super Admin",
    level: 4,
    description: "Full system access, workspace management, and billing control",
    badgeStyle:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  admin: {
    label: "Admin / Operations",
    level: 3,
    description: "Operations and team lead role focused on day-to-day workspace execution",
    badgeStyle:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  member: {
    label: "Project Member",
    level: 2,
    description: "Execution-level team member handling assigned projects and client tasks",
    badgeStyle:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  viewer: {
    label: "Viewer (Read-Only)",
    level: 1,
    description: "Read-only access across workspace dashboards and reports",
    badgeStyle:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

export function hasPermission(userRole: AppRole, minRequiredRole: AppRole): boolean {
  return (ROLES[userRole]?.level ?? 1) >= (ROLES[minRequiredRole]?.level ?? 1);
}

interface RegisteredUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole;
  created_at?: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at?: string;
}

export default function TeamDirectoryTab() {
  const supabase = useMemo(() => createClient(), []);

  const [currentUserRole, setCurrentUserRole] = useState<AppRole>("viewer");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<RegisteredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUsersAndRole() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          setCurrentUserId(user.id);

          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.role && isMounted) {
            setCurrentUserRole(profile.role as AppRole);
          }
        }

        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, created_at")
          .order("created_at", { ascending: true });

        if (!error && profiles && isMounted) {
          const typedProfiles = profiles as ProfileRow[];
          setUsersList(
            typedProfiles.map((p) => ({
              id: p.id,
              full_name: p.full_name,
              email: p.email,
              role: (p.role as AppRole) || "viewer",
              created_at: p.created_at,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUsersAndRole();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleRoleChange = async (targetUserId: string, newRole: AppRole) => {
    if (!hasPermission(currentUserRole, "admin")) {
      setUpdateError("You do not have permission to modify user roles.");
      return;
    }

    setOpenDropdownId(null);
    setUpdateError("");

    const targetUser = usersList.find((u) => u.id === targetUserId);

    if (currentUserRole === "admin" && targetUser?.role === "superadmin") {
      setUpdateError("Access Denied: Admin / Operations cannot alter the role of a Super Admin.");
      return;
    }

    if (currentUserRole === "admin" && newRole === "superadmin") {
      setUpdateError("Access Denied: Admin / Operations cannot assign the Super Admin role.");
      return;
    }

    const superAdminCount = usersList.filter((u) => u.role === "superadmin").length;
    if (targetUser?.role === "superadmin" && newRole !== "superadmin" && superAdminCount <= 1) {
      setUpdateError("Cannot demote the only Super Admin. Assign another Super Admin first.");
      return;
    }

    setUpdatingUserId(targetUserId);

    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", targetUserId)
      .select();

    if (error) {
      console.error("Error updating role:", error.message);
      setUpdateError(`Failed to update role: ${error.message}`);
    } else if (!data || data.length === 0) {
      setUpdateError("Role update blocked by database policies (RLS). Please verify your SQL policies.");
    } else {
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
    }

    setUpdatingUserId(null);
  };

  const isUserAdminOrSuperadmin =
    hasPermission(currentUserRole, "superadmin") ||
    hasPermission(currentUserRole, "admin");

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="text-xs">Loading registered users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Team Directory & Role Assignment
        </h2>
        <p className="text-[11px] text-slate-400">
          Superadmins and Admins can assign and update workspace access roles for all registered members.
        </p>
      </div>

      {updateError && (
        <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{updateError}</span>
        </div>
      )}

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
        {usersList.length > 0 ? (
          usersList.map((user) => {
            const initials = (user.full_name || user.email || "U")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            const isSelf = user.id === currentUserId;
            const roleConf = ROLES[user.role] || ROLES.viewer;

            const isTargetSuperAdmin = user.role === "superadmin";
            const canEditThisUser =
              isUserAdminOrSuperadmin &&
              !(currentUserRole === "admin" && isTargetSuperAdmin);

            return (
              <div
                key={user.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {user.full_name || "Name not provided"}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-semibold border border-indigo-200/60 dark:border-indigo-800/40">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {user.email || "No email address"}
                    </p>
                  </div>
                </div>

                <div className="relative shrink-0 self-start sm:self-auto">
                  {canEditThisUser ? (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDropdownId(openDropdownId === user.id ? null : user.id)
                        }
                        className={`flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer whitespace-nowrap ${roleConf.badgeStyle}`}
                      >
                        {updatingUserId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Shield className="h-3.5 w-3.5 shrink-0" />
                            <span>{roleConf.label}</span>
                            <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-1 shrink-0" />
                          </>
                        )}
                      </button>

                      {openDropdownId === user.id && (
                        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                          {(Object.keys(ROLES) as AppRole[]).map((rKey) => {
                            if (currentUserRole === "admin" && rKey === "superadmin") {
                              return null;
                            }

                            const conf = ROLES[rKey];
                            const isSelected = user.role === rKey;

                            return (
                              <button
                                key={rKey}
                                type="button"
                                onClick={() => handleRoleChange(user.id, rKey)}
                                className={`w-full text-left p-2 rounded-xl text-xs transition cursor-pointer flex flex-col space-y-0.5 ${
                                  isSelected
                                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{conf.label}</span>
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                </div>
                                <span className="text-[10px] opacity-75 font-normal">
                                  {conf.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border whitespace-nowrap ${roleConf.badgeStyle}`}
                    >
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      <span>{roleConf.label}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No registered users found.
          </div>
        )}
      </div>
    </div>
  );
}