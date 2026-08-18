"use client";

import React from "react";
import Link from "next/link";
import { Plus, Calendar, Upload } from "lucide-react";

interface WelcomeBannerProps {
  userName: string;
  roleLabel: string;
  roleBadgeStyle?: string;
  onNewProject?: () => void;
  onSyncMeeting?: () => void;
  onUploadAsset?: () => void;
}

export default function WelcomeBanner({
  userName,
  roleLabel,
  roleBadgeStyle = "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30",
  onNewProject,
  onSyncMeeting,
  onUploadAsset,
}: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100/80 bg-linear-to-r from-indigo-50/90 via-purple-50/40 to-slate-50 p-5 md:p-8 shadow-sm transition-colors duration-300 dark:border-indigo-900/40 dark:from-[#1e1b4b] dark:via-[#0f172a] dark:to-[#020617] dark:shadow-2xl">
      {/* Decorative ambient background glow (Light & Dark accents) */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/20" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-600/20" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6">
        {/* Left: Greeting & Role Information */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
              Workspace Dashboard
            </span>
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shadow-xs ${roleBadgeStyle}`}
            >
              {roleLabel}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Welcome back, {userName}!</span>
            <span className="animate-pulse">👋</span>
          </h1>

          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
            Here is your operational overview, project status, and scheduled client syncs.
          </p>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
          {/* 1. New Project */}
          {onNewProject ? (
            <button
              type="button"
              onClick={onNewProject}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1 sm:space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">New Project</span>
            </button>
          ) : (
            <Link
              href="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1 sm:space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">New Project</span>
            </Link>
          )}

          {/* 2. Meeting */}
          {onSyncMeeting ? (
            <button
              type="button"
              onClick={onSyncMeeting}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1 sm:space-x-1.5 bg-white/80 hover:bg-white text-slate-700 border border-slate-200/90 text-[11px] sm:text-xs font-medium px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-95 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300 shrink-0" />
              <span className="truncate">Meeting</span>
            </button>
          ) : (
            <Link
              href="/meetings"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1 sm:space-x-1.5 bg-white/80 hover:bg-white text-slate-700 border border-slate-200/90 text-[11px] sm:text-xs font-medium px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-95 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300 shrink-0" />
              <span className="truncate">Meeting</span>
            </Link>
          )}

          {/* 3. Upload */}
          {onUploadAsset ? (
            <button
              type="button"
              onClick={onUploadAsset}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1 sm:space-x-1.5 bg-white/80 hover:bg-white text-slate-700 border border-slate-200/90 text-[11px] sm:text-xs font-medium px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-95 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300 shrink-0" />
              <span className="truncate">Upload</span>
            </button>
          ) : (
            <Link
              href="/files"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1 sm:space-x-1.5 bg-white/80 hover:bg-white text-slate-700 border border-slate-200/90 text-[11px] sm:text-xs font-medium px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-95 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300 shrink-0" />
              <span className="truncate">Upload</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}