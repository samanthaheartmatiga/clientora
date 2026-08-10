"use client";

import React from "react";
import { Users, UserCheck, Clock, Archive } from "lucide-react";
import { Client } from "./types";

interface ClientStatsProps {
  clients: Client[];
}

export default function ClientStats({ clients }: ClientStatsProps) {
  const total = clients.length;
  const active = clients.filter((c) => c.status === "Active").length;
  const lead = clients.filter((c) => c.status === "Lead").length;
  const archived = clients.filter((c) => c.status === "Archived").length;

  const stats = [
    {
      label: "Total Clients",
      value: total,
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Active Accounts",
      value: active,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Leads Pipeline",
      value: lead,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Archived",
      value: archived,
      icon: Archive,
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm dark:shadow-xl flex items-center justify-between transition-colors duration-200"
          >
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <p className={`text-xl font-bold tracking-tight ${stat.color}`}>
                {stat.value}
              </p>
            </div>
            <div
              className={`h-10 w-10 rounded-xl ${stat.bg} border flex items-center justify-center shrink-0`}
            >
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}