"use client";

import React from "react";
import { FolderKanban, Video, Users, CreditCard, TrendingUp } from "lucide-react";

interface MetricsOverviewProps {
  // Projects
  activeProjects: number;
  totalProjects: number;

  // Meetings
  upcomingMeetings: number;
  totalMeetings: number;

  // Clients
  totalClients: number;
  activeClientsCount: number;

  // Financials
  totalPaidRevenue: number;
  totalInvoicedAmount: number;
  canReadFinancials: boolean;
}

export default function MetricsOverview({
  activeProjects,
  totalProjects,
  upcomingMeetings,
  totalMeetings,
  totalClients,
  activeClientsCount,
  totalPaidRevenue,
  totalInvoicedAmount,
  canReadFinancials,
}: MetricsOverviewProps) {
  // 1. Dynamic Projects Progress (% of total projects currently active)
  const projectProgressPct =
    totalProjects > 0
      ? Math.min(Math.round((activeProjects / totalProjects) * 100), 100)
      : 0;

  // 2. Dynamic Meetings Progress (% of all meetings scheduled upcoming)
  const meetingProgressPct =
    totalMeetings > 0
      ? Math.min(Math.round((upcomingMeetings / totalMeetings) * 100), 100)
      : 0;

  // 3. Dynamic Client Engagement (% of clients with active ongoing projects)
  const clientEngagementPct =
    totalClients > 0
      ? Math.min(Math.round((activeClientsCount / totalClients) * 100), 100)
      : 0;

  // 4. Dynamic Collection Efficiency Rate (% of total invoiced money already collected)
  const collectionRatePct =
    totalInvoicedAmount > 0
      ? Math.min(Math.round((totalPaidRevenue / totalInvoicedAmount) * 100), 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. ACTIVE PROJECTS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Active Projects
          </span>
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center font-bold">
            <FolderKanban className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeProjects}
          </span>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5">
            <TrendingUp className="h-3 w-3" />
            <span>{totalProjects > 0 ? `${projectProgressPct}% Active` : "No Projects"}</span>
          </span>
        </div>

        {/* Dynamic DB Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${projectProgressPct}%` }}
          />
        </div>
      </div>

      {/* 2. SCHEDULED SYNCS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Scheduled Syncs
          </span>
          <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center font-bold">
            <Video className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {upcomingMeetings}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            {totalMeetings > 0 ? `${upcomingMeetings} of ${totalMeetings} Calls` : "Next 7 Days"}
          </span>
        </div>

        {/* Dynamic DB Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${meetingProgressPct}%` }}
          />
        </div>
      </div>

      {/* 3. TOTAL CLIENTS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Clients
          </span>
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center font-bold">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalClients}
          </span>
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
            {totalClients > 0 ? `${activeClientsCount} Engaged` : "Directory"}
          </span>
        </div>

        {/* Dynamic DB Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${clientEngagementPct}%` }}
          />
        </div>
      </div>

      {/* 4. TOTAL PAID REVENUE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Paid Revenue
          </span>
          <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center font-bold">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          {canReadFinancials ? (
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ${totalPaidRevenue.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400 italic">
              Restricted Role
            </span>
          )}
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {canReadFinancials && totalInvoicedAmount > 0
              ? `${collectionRatePct}% Collected`
              : "Collected"}
          </span>
        </div>

        {/* Dynamic DB Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${canReadFinancials ? collectionRatePct : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}