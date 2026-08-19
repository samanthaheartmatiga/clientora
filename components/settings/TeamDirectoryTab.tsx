"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
  UserPlus,
  Mail,
  Trash2,
  Copy,
  X,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle2,
  Search,
  Globe,
  Send,
} from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { logWorkspaceActivity } from "@/lib/audit";
import DeleteWorkspaceModal from "@/components/settings/DeleteWorkspaceModal";

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
    description: "Full workspace authority, member management, and billing control",
    badgeStyle:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  admin: {
    label: "Admin / Operations",
    level: 3,
    description: "Operations lead handling day-to-day workspace execution & team invites",
    badgeStyle:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  member: {
    label: "Project Member",
    level: 2,
    description: "Execution-level team member handling assigned projects and deliverables",
    badgeStyle:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  viewer: {
    label: "Viewer (Read-Only)",
    level: 1,
    description: "Read-only access across workspace dashboards and client reports",
    badgeStyle:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

export function hasPermission(userRole: AppRole, minRequiredRole: AppRole): boolean {
  return (ROLES[userRole]?.level ?? 1) >= (ROLES[minRequiredRole]?.level ?? 1);
}

interface WorkspaceMemberItem {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  full_name: string | null;
  email: string | null;
}

interface PendingInvite {
  id: string;
  email: string | null;
  role: string;
  token: string;
  invite_type?: "email" | "share_link";
  expires_at: string;
  created_at: string;
}

interface RawMemberRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface ProfileMapRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default function TeamDirectoryTab() {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg } = useWorkspace();
  const currentOrgId = currentOrg?.id;
  const { role: currentUserRole } = useUserRole();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [membersList, setMembersList] = useState<WorkspaceMemberItem[]>([]);
  const [, setInvitations] = useState<PendingInvite[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"all" | AppRole>("all");

  // Role modification dropdown states
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Remove Member Modal states
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Delete Workspace Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Invite Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteTab, setInviteTab] = useState<"email" | "link">("email");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isUserAdminOrSuperadmin =
    hasPermission(currentUserRole as AppRole, "superadmin") ||
    hasPermission(currentUserRole as AppRole, "admin");

  const isSuperAdmin = currentUserRole === "superadmin";

  const loadTeamAndMembers = useCallback(async (isInitial = false) => {
    if (!currentOrgId) {
      setMembersList([]);
      setInvitations([]);
      if (isInitial) setIsInitialLoading(false);
      return;
    }

    try {
      if (isInitial) setIsInitialLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: memberRows, error: memberErr } = await supabase
        .from("organization_members")
        .select("id, user_id, role, created_at")
        .eq("organization_id", currentOrgId)
        .order("created_at", { ascending: true });

      if (memberErr) {
        console.error("Error fetching workspace members:", memberErr.message);
      }

      const rows = (memberRows || []) as RawMemberRow[];
      const userIds = rows.map((m) => m.user_id);

      const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profileRows) {
          (profileRows as ProfileMapRow[]).forEach((p) => {
            profileMap.set(p.id, {
              full_name: p.full_name,
              email: p.email,
            });
          });
        }
      }

      const formattedMembers: WorkspaceMemberItem[] = rows.map((m) => {
        const prof = profileMap.get(m.user_id);
        return {
          id: m.id,
          user_id: m.user_id,
          role: (m.role as AppRole) || "member",
          created_at: m.created_at,
          full_name: prof?.full_name || null,
          email: prof?.email || null,
        };
      });

      setMembersList(formattedMembers);

      // Fetch pending email invitations (kept in logic)
      const { data: inviteRows, error: inviteErr } = await supabase
        .from("invitations")
        .select("id, email, role, token, expires_at, created_at")
        .eq("organization_id", currentOrgId)
        .eq("status", "pending")
        .not("email", "is", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (inviteErr) {
        console.error("Error fetching invites:", inviteErr.message);
      } else if (inviteRows) {
        setInvitations(inviteRows as PendingInvite[]);
      }
    } catch (err) {
      console.error("Failed to load team directory:", err);
    } finally {
      if (isInitial) setIsInitialLoading(false);
    }
  }, [supabase, currentOrgId]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (isMounted) await loadTeamAndMembers(true);
    }
    void init();

    if (!currentOrgId) return;

    const channel = supabase
      .channel(`realtime-team-tab-${currentOrgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organization_members",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (isMounted) void loadTeamAndMembers(false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invitations",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (isMounted) void loadTeamAndMembers(false);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [loadTeamAndMembers, supabase, currentOrgId]);

  const filteredMembers = useMemo(() => {
    return membersList
      .filter((m) => {
        const matchesRole =
          selectedRoleFilter === "all" ? true : m.role === selectedRoleFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          (m.full_name && m.full_name.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q));
        return matchesRole && matchesQuery;
      })
      .sort((a, b) => {
        if (a.user_id === currentUserId) return -1;
        if (b.user_id === currentUserId) return 1;
        return 0;
      });
  }, [membersList, searchQuery, selectedRoleFilter, currentUserId]);

  const handleRoleChange = async (targetMember: WorkspaceMemberItem, newRole: AppRole) => {
    if (!currentOrgId || !hasPermission(currentUserRole as AppRole, "admin")) {
      setUpdateError("You do not have permission to modify user roles.");
      return;
    }

    setOpenDropdownId(null);
    setUpdateError("");
    setActionSuccess(null);

    if (currentUserRole === "admin" && targetMember.role === "superadmin") {
      setUpdateError("Access Denied: Admins cannot alter the role of a Super Admin.");
      return;
    }

    if (currentUserRole === "admin" && newRole === "superadmin") {
      setUpdateError("Access Denied: Admins cannot assign the Super Admin role.");
      return;
    }

    const superAdminCount = membersList.filter((u) => u.role === "superadmin").length;
    if (targetMember.role === "superadmin" && newRole !== "superadmin" && superAdminCount <= 1) {
      setUpdateError("Cannot demote the sole Super Admin. Promote another member to Super Admin first.");
      return;
    }

    setUpdatingUserId(targetMember.user_id);

    try {
      const { error: orgMemberError } = await supabase
        .from("organization_members")
        .update({ role: newRole })
        .eq("organization_id", currentOrgId)
        .eq("user_id", targetMember.user_id);

      if (orgMemberError) throw orgMemberError;

      await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", targetMember.user_id);

      setMembersList((prev) =>
        prev.map((u) => (u.user_id === targetMember.user_id ? { ...u, role: newRole } : u))
      );

      setActionSuccess(`Updated role for ${targetMember.full_name || targetMember.email} to ${newRole}`);
      await logWorkspaceActivity(
        `Changed role for ${targetMember.full_name || targetMember.email} to ${newRole}`,
        currentOrgId
      );
    } catch (err: unknown) {
      console.error("Error updating role:", err);
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to update role.";
      setUpdateError(msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !currentOrgId) return;

    setIsRemoving(true);
    setUpdateError("");
    setActionSuccess(null);

    try {
      const { data, error } = await supabase.rpc("remove_organization_member", {
        target_org_id: currentOrgId,
        target_user_id: memberToRemove.user_id,
      });

      if (error) throw error;

      if (!data?.success) {
        setUpdateError(data?.message || "Failed to remove member from workspace.");
        setIsRemoving(false);
        return;
      }

      await logWorkspaceActivity(
        `Removed member ${memberToRemove.full_name || memberToRemove.email} from workspace`,
        currentOrgId
      );

      setActionSuccess("Member removed from workspace successfully.");
      setMemberToRemove(null);
      await loadTeamAndMembers(false);
    } catch (err: unknown) {
      console.error("Failed to remove member:", err);
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Error executing member removal.";
      setUpdateError(msg);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleGenerateInvite = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentOrgId) return;

    const isEmailMode = inviteTab === "email";
    const cleanEmail = isEmailMode ? inviteEmail.trim().toLowerCase() : null;

    if (isEmailMode && !cleanEmail) {
      setInviteError("Please enter a valid recipient email address.");
      return;
    }

    setIsSubmittingInvite(true);
    setInviteError(null);

    try {
      if (cleanEmail) {
        const existingMember = membersList.find(
          (m) => m.email?.toLowerCase() === cleanEmail
        );
        if (existingMember) {
          throw new Error("This user is already an active member of this workspace.");
        }

        await supabase
          .from("invitations")
          .delete()
          .eq("organization_id", currentOrgId)
          .eq("email", cleanEmail);
      }

      const generatedToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);

      const { error: insertErr } = await supabase.from("invitations").insert([
        {
          organization_id: currentOrgId,
          email: cleanEmail,
          role: inviteRole,
          token: generatedToken,
          status: "pending",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      if (insertErr) throw insertErr;

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const inviteUrl = `${origin}/join?token=${generatedToken}`;

      if (isEmailMode && cleanEmail) {
        try {
          const emailRes = await fetch("/api/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: cleanEmail,
              inviteUrl,
              workspaceName: currentOrg?.name,
              role: ROLES[inviteRole]?.label || inviteRole,
            }),
          });

          const emailData = await emailRes.json();
          if (!emailRes.ok) {
            setInviteError(`Invite created, but failed to send email: ${emailData?.error || "Unknown error"}`);
            setIsSubmittingInvite(false);
            return;
          }
        } catch (emailErr) {
          console.error("Failed to trigger invite email:", emailErr);
          setInviteError("Network error while sending email.");
          setIsSubmittingInvite(false);
          return;
        }
      }

      setGeneratedLink(inviteUrl);
      await logWorkspaceActivity(
        `Created Workspace Invite (${isEmailMode ? `Email: ${cleanEmail}` : "Share Link"}) [Role: ${inviteRole}]`,
        currentOrgId
      );

      await loadTeamAndMembers(false);
    } catch (err: unknown) {
      console.error("Failed to generate invite:", err);
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to generate invite.";
      setInviteError(msg);
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isInitialLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs">Loading team directory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Team Directory & Workspace Access
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Manage teammates, roles, and workspace access for{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {currentOrg?.name || "current workspace"}
            </span>.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start lg:self-auto">
          {isUserAdminOrSuperadmin && (
            <button
              type="button"
              onClick={() => {
                setGeneratedLink(null);
                setInviteEmail("");
                setInviteRole("member");
                setInviteTab("email");
                setInviteError(null);
                setIsInviteModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span>Invite Member</span>
            </button>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center space-x-1 border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-semibold px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl transition cursor-pointer"
              title="Delete workspace"
            >
              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span>Delete Workspace</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {updateError && (
        <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{updateError}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search member by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-9 pr-3.5 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedRoleFilter("all")}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
              selectedRoleFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-75 font-normal">
              ({membersList.length})
            </span>
          </button>

          {(["superadmin", "admin", "member", "viewer"] as AppRole[]).map((rKey) => {
            const count = membersList.filter((m) => m.role === rKey).length;
            const isSelected = selectedRoleFilter === rKey;
            return (
              <button
                key={rKey}
                onClick={() => setSelectedRoleFilter(rKey)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{ROLES[rKey].label}</span>
                <span className="text-[10px] opacity-75 font-normal">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Members Table */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-t-2xl flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            Active Workspace Members ({filteredMembers.length})
          </span>
          {(searchQuery || selectedRoleFilter !== "all") && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 truncate ml-2">
              Filtered from {membersList.length}
            </span>
          )}
        </div>

        {filteredMembers.length > 0 ? (
          filteredMembers.map((member, index) => {
            const initials = (member.full_name || member.email || "U")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            const isSelf = member.user_id === currentUserId;
            const roleConf = ROLES[member.role] || ROLES.viewer;
            const isTargetSuperAdmin = member.role === "superadmin";
            const canEditThisUser =
              isUserAdminOrSuperadmin &&
              !(currentUserRole === "admin" && isTargetSuperAdmin);

            const popUpward = index >= Math.max(1, filteredMembers.length - 2);

            return (
              <div
                key={member.id}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 transition ${
                  isSelf
                    ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-l-4 border-l-indigo-600 dark:border-l-indigo-500"
                    : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                } ${index === filteredMembers.length - 1 ? "rounded-b-2xl" : ""}`}
              >
                {/* Member Info */}
                <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 w-full sm:w-auto">
                  <div
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 ${
                      isSelf
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400"
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {member.full_name || "Name not provided"}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] sm:text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold shadow-xs">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 min-w-0">
                      <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                      <span className="truncate">{member.email || "No email address"}</span>
                    </p>
                  </div>
                </div>

                {/* Role Pill & Actions */}
                <div className="flex items-center space-x-1.5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start pt-1 sm:pt-0">
                  <div className="relative">
                    {canEditThisUser ? (
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdownId(openDropdownId === member.id ? null : member.id)
                          }
                          className={`flex items-center space-x-1.5 text-[11px] sm:text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border transition cursor-pointer whitespace-nowrap ${roleConf.badgeStyle}`}
                        >
                          {updatingUserId === member.user_id ? (
                            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                              <span>{roleConf.label}</span>
                              <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-60 ml-0.5 shrink-0" />
                            </>
                          )}
                        </button>

                        {openDropdownId === member.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div
                              className={`absolute right-0 w-52 sm:w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 sm:p-2 space-y-1 ${
                                popUpward ? "bottom-full mb-2" : "top-full mt-2"
                              }`}
                            >
                              {(Object.keys(ROLES) as AppRole[]).map((rKey) => {
                                if (currentUserRole === "admin" && rKey === "superadmin") {
                                  return null;
                                }

                                const conf = ROLES[rKey];
                                const isSelected = member.role === rKey;

                                return (
                                  <button
                                    key={rKey}
                                    type="button"
                                    onClick={() => handleRoleChange(member, rKey)}
                                    className={`w-full text-left p-1.5 sm:p-2 rounded-xl text-[11px] sm:text-xs transition cursor-pointer flex flex-col space-y-0.5 ${
                                      isSelected
                                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{conf.label}</span>
                                      {isSelected && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] opacity-75 font-normal line-clamp-1">
                                      {conf.description}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`flex items-center space-x-1.5 text-[11px] sm:text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border whitespace-nowrap ${roleConf.badgeStyle}`}
                      >
                        <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                        <span>{roleConf.label}</span>
                      </div>
                    )}
                  </div>

                  {canEditThisUser && !isSelf && (
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateError("");
                        setActionSuccess(null);
                        setMemberToRemove(member);
                      }}
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer shrink-0"
                      title="Remove member from workspace"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No matching members found.
          </div>
        )}
      </div>

      {/* Remove Member Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="space-y-1.5 text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Remove Member from Workspace?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                Are you sure you want to remove{" "}
                <strong className="text-slate-800 dark:text-slate-200 wrap-break-word">
                  {memberToRemove.full_name || memberToRemove.email || "this user"}
                </strong>{" "}
                from <strong>{currentOrg?.name}</strong>? They will immediately lose access to all projects, clients, and workspace documents.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="w-full py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={isRemoving}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Confirm Removal</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal */}
      <DeleteWorkspaceModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Invite to Workspace
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!generatedLink && (
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setInviteTab("email");
                    setInviteError(null);
                  }}
                  className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    inviteTab === "email"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Send to Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInviteTab("link");
                    setInviteError(null);
                  }}
                  className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    inviteTab === "link"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Public Share Link</span>
                </button>
              </div>
            )}

            {inviteError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {!generatedLink ? (
              <div className="space-y-4">
                {inviteTab === "email" ? (
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Recipient Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="teammate@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleGenerateInvite();
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400">
                      An invitation email with the join link will be sent to this address.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 rounded-xl text-left space-y-1">
                    <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Reusable Share Link</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Anyone with this link can join <strong>{currentOrg?.name}</strong> with the specified role below.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Workspace Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as AppRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="member">Member (Create & edit deliverables)</option>
                    <option value="admin">Admin (Manage team & settings)</option>
                    <option value="viewer">Viewer (Read-only access)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={(e) => void handleGenerateInvite(e)}
                  disabled={isSubmittingInvite || (inviteTab === "email" && !inviteEmail.trim())}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  {isSubmittingInvite ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{inviteTab === "email" ? "Sending email..." : "Generating link..."}</span>
                    </>
                  ) : inviteTab === "email" ? (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Email Invitation</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>Create Public Share Link</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>
                    {inviteTab === "email"
                      ? "Invitation email dispatched & link generated!"
                      : "Public workspace share link generated!"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Shareable Invitation URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-sm shadow-indigo-600/20"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {inviteTab === "email" ? (
                    <>
                      An invite email was sent to <strong>{inviteEmail}</strong>. You can also share the link above manually if needed.
                    </>
                  ) : (
                    <>
                      Anyone who visits this link will be added to <strong>{currentOrg?.name}</strong> with the <strong>{inviteRole}</strong> role.
                    </>
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}