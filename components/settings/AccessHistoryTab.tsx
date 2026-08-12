"use client";

import React, { useState } from "react";
import { Clock, Laptop } from "lucide-react";
import { ActivityLog } from "./types";

const initialLogs: ActivityLog[] = [
  {
    id: "1",
    user_name: "Samantha Matiga",
    user_email: "samantha@clientora.com",
    action: "Opened Workspace & Checked Invoices",
    timestamp: "Just now (Today at 7:36 PM)",
    ip_address: "192.168.1.45",
    device: "Chrome on macOS",
  },
  {
    id: "2",
    user_name: "Taylor Swift",
    user_email: "taylor@clientora.com",
    action: "Viewed Invoices & Client Schedule (Read-Only)",
    timestamp: "1 hour ago",
    ip_address: "172.56.21.09",
    device: "Safari on iOS",
  },
  {
    id: "3",
    user_name: "Alex Rivera",
    user_email: "alex@clientora.com",
    action: "Updated Project Board Milestone",
    timestamp: "2 hours ago",
    ip_address: "112.198.42.10",
    device: "Safari on iOS",
  },
];

export default function AccessHistoryTab() {
  const [logs] = useState<ActivityLog[]>(initialLogs);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Workspace Access & Audit Log
        </h2>
        <p className="text-[11px] text-slate-400">
          Timestamped activity log showing team check-ins, site logins, and recent workspace actions.
        </p>
      </div>

      {/* Most Recent Active Card */}
      {logs.length > 0 && (
        <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md shadow-indigo-600/20">
              {logs[0].user_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                  Most Recent Active User
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {logs[0].user_name} ({logs[0].user_email})
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Action: {logs[0].action}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            <div className="flex items-center sm:justify-end space-x-1 font-semibold text-slate-800 dark:text-slate-200">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>{logs[0].timestamp}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {logs[0].device} • IP: {logs[0].ip_address}
            </p>
          </div>
        </div>
      )}

      {/* Log History List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
          >
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {log.user_name}
                </p>
                <span className="text-[10px] text-slate-400">• {log.user_email}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {log.action}
              </p>
            </div>

            <div className="flex items-center justify-between md:justify-end space-x-4 text-[11px] text-slate-400 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1">
                <Laptop className="h-3.5 w-3.5 text-slate-400" />
                <span>{log.device}</span>
              </div>
              <span>•</span>
              <span>{log.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}