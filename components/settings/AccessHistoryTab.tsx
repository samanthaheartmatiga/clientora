"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore, useMemo } from "react";
import {
  Clock,
  Laptop,
  Smartphone,
  Globe,
  Loader2,
  RefreshCw,
  UserCheck,
  Trash2,
  Edit3,
  PlusCircle,
  Activity,
  Search,
} from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";

export interface AuditLogItem {
  id: string;
  organization_id?: string | null;
  user_id?: string | null;
  full_name: string;
  email: string;
  action: string;
  device_info?: string | null;
  ip_address?: string | null;
  created_at: string;
}

interface RawAuditLogRow {
  id: string;
  organization_id?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  action: string;
  device_info?: string | null;
  ip_address?: string | null;
  created_at: string;
}

interface ProfileMapItem {
  id: string;
  full_name: string | null;
  email: string | null;
}

const emptySubscribe = () => () => {};

export default function AccessHistoryTab() {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg } = useWorkspace();
  const currentOrgId = currentOrg?.id;

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const fetchAccessLogs = useCallback(async () => {
    if (!currentOrgId) {
      setLogs([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const [logsRes, profilesRes] = await Promise.all([
        supabase
          .from("audit_logs")
          .select("id, organization_id, user_id, user_name, user_email, action, device_info, ip_address, created_at")
          .eq("organization_id", currentOrgId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("profiles")
          .select("id, full_name, email"),
      ]);

      if (logsRes.error) {
        console.error("Audit log error:", logsRes.error.message);
        return;
      }

      const profileMap = new Map<string, { full_name: string; email: string }>();
      if (profilesRes.data) {
        (profilesRes.data as ProfileMapItem[]).forEach((p) => {
          profileMap.set(p.id, {
            full_name: p.full_name?.trim() || "",
            email: p.email?.trim() || "",
          });
        });
      }

      const rows = (logsRes.data || []) as RawAuditLogRow[];
      const formatted: AuditLogItem[] = rows.map((log) => {
        const liveProfile = log.user_id ? profileMap.get(log.user_id) : null;
        const resolvedName = liveProfile?.full_name || log.user_name || "Workspace Member";
        const resolvedEmail = liveProfile?.email || log.user_email || "member@clientora.com";

        return {
          id: log.id,
          organization_id: log.organization_id,
          user_id: log.user_id,
          full_name: resolvedName,
          email: resolvedEmail,
          action: log.action,
          device_info: log.device_info,
          ip_address: log.ip_address,
          created_at: log.created_at,
        };
      });

      setLogs(formatted);
    } catch (err) {
      console.error("Audit fetch exception:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase, currentOrgId]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      await fetchAccessLogs();
    }
    init();

    const channel = supabase
      .channel(`realtime-audit-logs-${currentOrgId || "default"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audit_logs",
          filter: currentOrgId ? `organization_id=eq.${currentOrgId}` : undefined,
        },
        () => {
          if (isMounted) fetchAccessLogs();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          if (isMounted) fetchAccessLogs();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchAccessLogs, supabase, currentOrgId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAccessLogs();
  };

  const formatTimeAgo = (dateStr: string): string => {
    if (!isClient) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";

    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSecs < 60) return `Just now (${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })})`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getInitials = (name: string): string => {
    if (!name || name.trim() === "") return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const getActionType = (action: string): "Deleted" | "Updated" | "Created" | "Activity" => {
    const lower = action.toLowerCase();
    if (lower.includes("delete") || lower.includes("removed") || lower.includes("cancel")) return "Deleted";
    if (lower.includes("update") || lower.includes("modified") || lower.includes("rescheduled")) return "Updated";
    if (lower.includes("create") || lower.includes("add") || lower.includes("upload") || lower.includes("schedule") || lower.includes("generate")) return "Created";
    return "Activity";
  };

  const getActionBadge = (action: string) => {
    const type = getActionType(action);
    if (type === "Deleted") {
      return (
        <span className="p-1 sm:px-2.5 sm:py-1 sm:w-20 inline-flex items-center justify-center gap-1 text-[10px] font-semibold rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
          <Trash2 className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
          <span className="hidden sm:inline">Deleted</span>
        </span>
      );
    }
    if (type === "Updated") {
      return (
        <span className="p-1 sm:px-2.5 sm:py-1 sm:w-20 inline-flex items-center justify-center gap-1 text-[10px] font-semibold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
          <Edit3 className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
          <span className="hidden sm:inline">Updated</span>
        </span>
      );
    }
    if (type === "Created") {
      return (
        <span className="p-1 sm:px-2.5 sm:py-1 sm:w-20 inline-flex items-center justify-center gap-1 text-[10px] font-semibold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <PlusCircle className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
          <span className="hidden sm:inline">Created</span>
        </span>
      );
    }
    return (
      <span className="p-1 sm:px-2.5 sm:py-1 sm:w-20 inline-flex items-center justify-center gap-1 text-[10px] font-semibold rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
        <Activity className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
        <span className="hidden sm:inline">Activity</span>
      </span>
    );
  };

  const getDeviceIcon = (deviceStr?: string | null) => {
    const lower = (deviceStr || "").toLowerCase();
    if (lower.includes("iphone") || lower.includes("ios") || lower.includes("android")) {
      return <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
    }
    if (lower.includes("mac") || lower.includes("windows") || lower.includes("chrome") || lower.includes("desktop")) {
      return <Laptop className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
    }
    return <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const type = getActionType(log.action);
    const matchesAction = actionFilter === "All" || type === actionFilter;

    return matchesSearch && matchesAction;
  });

  const showHighlightCard = actionFilter === "All" && searchTerm === "" && filteredLogs.length > 0;
  const mostRecentLog = showHighlightCard ? filteredLogs[0] : null;
  const listLogs = showHighlightCard ? filteredLogs.slice(1) : filteredLogs;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs font-semibold">Loading access logs...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-sm space-y-3.5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Tab Header - Inline on Mobile */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-5 space-y-2 sm:space-y-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate">
              Workspace Access & Audit Log
            </h2>
          </div>

          <button
            type="button"
            suppressHydrationWarning
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1 sm:space-x-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs font-medium px-2.5 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-normal">
          Timestamped activity log showing team check-ins, record edits, and workspace changes for{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {currentOrg?.name || "current workspace"}
          </span>.
        </p>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto w-full sm:w-auto pb-0.5 sm:pb-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
          {["All", "Created", "Updated", "Deleted", "Activity"].map((filter) => (
            <button
              key={filter}
              type="button"
              suppressHydrationWarning
              onClick={() => setActionFilter(filter)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition cursor-pointer shrink-0 ${
                actionFilter === filter
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 italic">
          No activity logs recorded in {currentOrg?.name || "this workspace"} yet.
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-4">
          {/* Most Recent Active Highlight Card */}
          {mostRecentLog && (
            <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-linear-to-r from-indigo-50/70 via-indigo-50/30 to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-900/90 p-3 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
              <div className="flex items-start sm:items-center space-x-2 sm:space-x-3.5 min-w-0">
                <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-xl bg-indigo-600 text-white font-bold text-[10px] sm:text-sm flex items-center justify-center shadow-sm shrink-0 mt-0.5 sm:mt-0">
                  {getInitials(mostRecentLog.full_name)}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between sm:justify-start gap-1.5 flex-wrap">
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      Most Recent
                    </span>
                    <div className="inline-flex shrink-0">
                      {getActionBadge(mostRecentLog.action)}
                    </div>
                  </div>
                  <h3 className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {mostRecentLog.full_name}{" "}
                    <span className="text-[9px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 truncate">
                      ({mostRecentLog.email})
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 wrap-break-word line-clamp-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Action:</span>{" "}
                    {mostRecentLog.action}
                  </p>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 pt-1 md:pt-0 border-t md:border-t-0 border-indigo-100/50 dark:border-indigo-900/30 gap-1 shrink-0">
                <div className="flex items-center space-x-1 font-medium text-indigo-600 dark:text-indigo-400">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span suppressHydrationWarning>{formatTimeAgo(mostRecentLog.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[9px] sm:text-[11px] text-slate-400 truncate">
                  {mostRecentLog.device_info && <span className="truncate max-w-20 sm:max-w-none">{mostRecentLog.device_info}</span>}
                  {mostRecentLog.ip_address && <span className="truncate">IP: {mostRecentLog.ip_address}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Activity Logs List */}
          {listLogs.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/40 overflow-hidden">
              {listLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3.5 min-w-0">
                    <div className="pt-0.5 sm:pt-0 shrink-0">
                      {getActionBadge(log.action)}
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {log.full_name}
                        </span>
                        <span className="text-slate-400 text-[9px]">•</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-[11px] truncate">
                          {log.email}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 wrap-break-word line-clamp-2 sm:line-clamp-none">
                        {log.action}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-2 sm:space-x-3 text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-200/40 dark:border-slate-800/40">
                    {log.device_info && (
                      <div className="flex items-center space-x-1 text-[8px] sm:text-[11px] bg-white dark:bg-slate-800 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        {getDeviceIcon(log.device_info)}
                        <span className="truncate max-w-22.5 sm:max-w-none">{log.device_info}</span>
                      </div>
                    )}
                    <span suppressHydrationWarning className="text-[9px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 min-w-12 sm:min-w-16 text-right">
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredLogs.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              No logs match your filter criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}