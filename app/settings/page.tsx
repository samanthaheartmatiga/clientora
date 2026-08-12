"use client";

import React, { useState } from "react";
import { SettingsTabType } from "@/components/settings/types";
import SettingsTabs from "@/components/settings/SettingsTabs";
import ProfileTab from "@/components/settings/ProfileTab";
import TeamDirectoryTab from "@/components/settings/TeamDirectoryTab";
import AccessHistoryTab from "@/components/settings/AccessHistoryTab";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabType>("profile");

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your account profile, team roles, and view workspace access history.
        </p>
      </div>

      {/* Tab Navigation Controls */}
      <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm w-full">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "team" && <TeamDirectoryTab />}
        {activeTab === "history" && <AccessHistoryTab />}
      </div>
    </div>
  );
}