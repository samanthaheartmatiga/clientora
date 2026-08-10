"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
}

export default function MetricCard({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
}: MetricCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm">
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        {change && (
          <p className={`text-[11px] font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {isPositive ? "↑" : "↓"} {change} <span className="text-slate-500 font-normal">vs last month</span>
          </p>
        )}
      </div>
      <div className="h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}