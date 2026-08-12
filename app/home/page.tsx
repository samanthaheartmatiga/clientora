import React from "react";
import LogoutButton from "@/components/settings/LogoutButton";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Clientora Workspace
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Welcome back to your dashboard.
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Website Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Projects</h3>
            <p className="text-xs text-slate-400">View active client deliverables and timeline.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Invoices</h3>
            <p className="text-xs text-slate-400">Manage billing and payment statuses.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Settings</h3>
            <p className="text-xs text-slate-400">Update personal details and organization info.</p>
          </div>
        </div>
      </div>
    </div>
  );
}