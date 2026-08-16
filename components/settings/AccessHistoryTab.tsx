"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
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
import { supabase } from "@/lib/supabaseClient";

export interface AuditLogItem {
  id: string;
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
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  action: string;
  device_info?: string | null;
  ip_address?: string | null;
  created_at: string;
}

const emptySubscribe = () => () => {};

export default function AccessHistoryTab() {
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
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, user_id, user_name, user_email, action, device_info, ip_address, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Audit log error:", error.message);
        return;
      }

      const rows = (data || []) as RawAuditLogRow[];
      const formatted: AuditLogItem[] = rows.map((log) => ({
        id: log.id,
        user_id: log.user_id,
        full_name: log.user_name || "Workspace Member",
        email: log.user_email || "member@clientora.com",
        action: log.action,
        device_info: log.device_info,
        ip_address: log.ip_address,
        created_at: log.created_at,
      }));

      setLogs(formatted);
    } catch (err) {
      console.error("Audit fetch exception:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      await fetchAccessLogs();
    }
    init();

    const channel = supabase
      .channel("realtime-audit-logs-history-tab")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_logs" },
        () => {
          if (isMounted) fetchAccessLogs();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchAccessLogs]);

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
        <span className="w-20 inline-flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
          <Trash2 className="h-2.5 w-2.5" />
          Deleted
        </span>
      );
    }
    if (type === "Updated") {
      return (
        <span className="w-20 inline-flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
          <Edit3 className="h-2.5 w-2.5" />
          Updated
        </span>
      );
    }
    if (type === "Created") {
      return (
        <span className="w-20 inline-flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <PlusCircle className="h-2.5 w-2.5" />
          Created
        </span>
      );
    }
    return (
      <span className="w-20 inline-flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
        <Activity className="h-2.5 w-2.5" />
        Activity
      </span>
    );
  };

  const getDeviceIcon = (deviceStr?: string | null) => {
    const lower = (deviceStr || "").toLowerCase();
    if (lower.includes("iphone") || lower.includes("ios") || lower.includes("android")) {
      return <Smartphone className="h-3.5 w-3.5" />;
    }
    if (lower.includes("mac") || lower.includes("windows") || lower.includes("chrome") || lower.includes("desktop")) {
      return <Laptop className="h-3.5 w-3.5" />;
    }
    return <Globe className="h-3.5 w-3.5" />;
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs font-semibold">Loading access logs...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Workspace Access & Audit Log</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Timestamped activity log showing team check-ins, record edits, and workspace changes.
          </p>
        </div>

        <button
          type="button"
          suppressHydrationWarning
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center space-x-1.5 self-start sm:self-auto bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["All", "Created", "Updated", "Deleted", "Activity"].map((filter) => (
            <button
              key={filter}
              type="button"
              suppressHydrationWarning
              onClick={() => setActionFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
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
          No activity logs recorded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {mostRecentLog && (
            <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-linear-to-r from-indigo-50/70 via-indigo-50/30 to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-900/90 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                  {getInitials(mostRecentLog.full_name)}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      Most Recent Active User
                    </span>
                    {getActionBadge(mostRecentLog.action)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {mostRecentLog.full_name}{" "}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      ({mostRecentLog.email})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Action:</span>{" "}
                    {mostRecentLog.action}
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:items-end text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span suppressHydrationWarning>{formatTimeAgo(mostRecentLog.created_at)}</span>
                </div>
                {(mostRecentLog.device_info || mostRecentLog.ip_address) && (
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    {mostRecentLog.device_info && <span>{mostRecentLog.device_info}</span>}
                    {mostRecentLog.device_info && mostRecentLog.ip_address && <span>•</span>}
                    {mostRecentLog.ip_address && <span>IP: {mostRecentLog.ip_address}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {listLogs.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/40 overflow-hidden">
              {listLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="pt-0.5 sm:pt-0">
                      {getActionBadge(log.action)}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.full_name}
                        </span>
                        <span className="text-slate-400 text-[11px]">•</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {log.email}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {log.action}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 shrink-0 self-end sm:self-auto">
                    {log.device_info && (
                      <div className="flex items-center space-x-1 text-[11px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        {getDeviceIcon(log.device_info)}
                        <span>{log.device_info}</span>
                      </div>
                    )}
                    <span suppressHydrationWarning className="text-[11px] font-medium text-slate-500 dark:text-slate-400 min-w-16 text-right">
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