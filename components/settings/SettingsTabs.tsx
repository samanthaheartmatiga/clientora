"use client";

import React from "react";
import { User, Users, History } from "lucide-react";
import { SettingsTabType } from "./types";

interface SettingsTabsProps {
  activeTab: SettingsTabType;
  setActiveTab: (tab: SettingsTabType) => void;
}

export default function SettingsTabs({ activeTab, setActiveTab }: SettingsTabsProps) {
  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "team", label: "Team Directory & Roles", icon: Users },
    { id: "history", label: "Access & Activity History", icon: History },
  ] as const;

  return (
    <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SettingsTabType)}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              isActive
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}