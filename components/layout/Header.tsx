"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Calendar,
  FileText,
  CheckCheck,
  Trash2,
  FolderKanban,
  Building2,
  ChevronDown,
  Check,
  Plus,
  X,
  Loader2,
  LogOut,
} from "lucide-react";
import { createClient } from "@/app/supabase/client";
import ThemeToggle from "./ThemeToggle";
import { useNotifications } from "@/context/NotificationContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLES, AppRole } from "@/lib/permissions";
import { logWorkspaceActivity } from "@/lib/audit";
import LeaveWorkspaceModal from "@/components/settings/LeaveWorkspaceTab";

interface HeaderProps {
  onMenuClick: () => void;
}

interface UserProfileHeader {
  fullName: string;
  email: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const { currentOrg, organizations, switchOrganization } = useWorkspace();
  const { role: userRole } = useUserRole();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState("");

  const {
    filteredNotifications,
    unreadCount,
    activeTab,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileHeader>({
    fullName: "",
    email: "",
  });

  // Dynamic role label derived directly from the active workspace
  const displayRoleLabel = useMemo(() => {
    if (ROLES[userRole as AppRole]) {
      return ROLES[userRole as AppRole].label;
    }
    return userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Member";
  }, [userRole]);

  // Fetch current user basic details dynamically
  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .maybeSingle();

          const name =
            dbProfile?.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "";

          if (isMounted) {
            setProfile({
              fullName: name,
              email: dbProfile?.email || user.email || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load header user profile:", err);
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const initials = useMemo(() => {
    if (!profile.fullName) return "U";
    const parts = profile.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [profile.fullName]);

  const handleNotificationClick = async (id: string, rawLink?: string) => {
    await markAsRead(id);
    setIsOpen(false);

    if (rawLink) {
      const targetPath = rawLink.startsWith("/") ? rawLink : `/${rawLink}`;
      router.push(targetPath);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  // Create Workspace Handler
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newWorkspaceName.trim();
    if (!trimmedName) return;

    setIsCreatingOrg(true);
    setCreateOrgError("");

    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) throw new Error("Authentication session not found.");

      const generatedSlug =
        trimmedName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") + `-${Date.now().toString(36)}`;

      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: trimmedName,
          slug: generatedSlug,
        })
        .select("id, name, slug")
        .single();

      if (orgError) {
        setCreateOrgError(orgError.message || "Failed to create organization.");
        setIsCreatingOrg(false);
        return;
      }

      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: "superadmin",
        });

      if (memberError) {
        setCreateOrgError(memberError.message || "Failed to assign workspace permissions.");
        setIsCreatingOrg(false);
        return;
      }

      await logWorkspaceActivity(`Created workspace: ${trimmedName}`);

      if (typeof window !== "undefined") {
        localStorage.setItem("active_org_id", newOrg.id);
        localStorage.setItem("current_workspace_id", newOrg.id);
      }

      if (switchOrganization) {
        await switchOrganization(newOrg.id);
      }

      setNewWorkspaceName("");
      setIsCreateModalOpen(false);
      setIsOrgDropdownOpen(false);

      window.location.reload();
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to create workspace.";
      setCreateOrgError(msg);
    } finally {
      setIsCreatingOrg(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md transition-colors duration-200">
        {/* Left Section: Mobile Menu & Dynamic Workspace Switcher */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onMenuClick}
            suppressHydrationWarning
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
            aria-label="Open Mobile Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Workspace Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOrgDropdownOpen((prev) => !prev)}
              suppressHydrationWarning
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left cursor-pointer"
            >
              <div className="h-7 w-7 rounded-lg bg-indigo-600/10 dark:bg-indigo-950 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none truncate max-w-36">
                  {currentOrg?.name || "Select Workspace"}
                </h2>
                {displayRoleLabel && (
                  <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                    {displayRoleLabel}
                  </p>
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5 sm:ml-1" />
            </button>

            {isOrgDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOrgDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Workspaces
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto py-1">
                    {organizations.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400 italic">
                        No active workspaces found
                      </div>
                    ) : (
                      organizations.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            switchOrganization(org.id);
                            setIsOrgDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                        >
                          <div className="truncate pr-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {org.name}
                            </p>
                            {org.role && (
                              <p className="text-[10px] text-slate-400 capitalize">{org.role}</p>
                            )}
                          </div>
                          {currentOrg?.id === org.id && (
                            <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Actions Section */}
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 px-1.5 space-y-1">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => {
                        setIsOrgDropdownOpen(false);
                        setIsCreateModalOpen(true);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Workspace</span>
                    </button>

                    {currentOrg && (
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => {
                          setIsOrgDropdownOpen(false);
                          setIsLeaveModalOpen(true);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Leave Workspace</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <ThemeToggle />

          {/* Notification Bell Container */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              suppressHydrationWarning
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
              )}
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute -right-12 sm:right-0 mt-3 w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm md:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-indigo-500/20">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={markAllAsRead}
                        className="text-[10px] sm:text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCheck className="h-3 w-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setActiveTab("all")}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition cursor-pointer ${
                        activeTab === "all"
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setActiveTab("invoices")}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition cursor-pointer ${
                        activeTab === "invoices"
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      Invoices
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setActiveTab("meetings")}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition cursor-pointer ${
                        activeTab === "meetings"
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      Meetings
                    </button>
                  </div>

                  <div className="max-h-64 sm:max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {filteredNotifications.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-400">
                        No {activeTab !== "all" ? activeTab : ""} notifications found
                      </div>
                    ) : (
                      filteredNotifications.map((notif) => {
                        const isUnread = !notif.read;
                        return (
                          <div
                            key={notif.id}
                            onClick={() =>
                              handleNotificationClick(
                                notif.id,
                                notif.link || undefined
                              )
                            }
                            className={`group p-2.5 sm:p-3 transition cursor-pointer flex items-start space-x-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              isUnread
                                ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                                : ""
                            }`}
                          >
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                              {notif.type === "invoice" ? (
                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              ) : notif.type === "project" ? (
                                <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              ) : (
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {notif.title}
                                </p>
                                <div className="flex items-center space-x-1 shrink-0 ml-1.5">
                                  {isUnread && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                                  )}
                                  <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={(e) => handleDelete(e, notif.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* Dynamic User Profile Card */}
          <div
            onClick={() => router.push("/settings")}
            className="flex items-center space-x-2.5 pl-1 cursor-pointer hover:opacity-80 transition"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 select-none shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              {profile.fullName && (
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-35">
                  {profile.fullName}
                </span>
              )}
              {displayRoleLabel && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-35 capitalize">
                  {displayRoleLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create Workspace
                </h3>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateOrgError("");
                }}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createOrgError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                {createOrgError}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Workspace Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter workspace name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateOrgError("");
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrg || !newWorkspaceName.trim()}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
                >
                  {isCreatingOrg ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create & Switch</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Workspace Modal */}
      <LeaveWorkspaceModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />
    </>
  );
}