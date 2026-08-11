"use client";

import React, { useState } from "react";
import { Folder, Upload, HardDrive, ShieldCheck, X } from "lucide-react";

export default function FileGuideBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 relative transition-all">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
        aria-label="Close guide"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-3">
        <div className="flex items-center space-x-3 pr-6">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
            <Folder className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
            What is the Files Repository?
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
          The Files Repository lets you upload, store, and organize client deliverables, contract PDFs, brand assets, and design files in one place. Keep documents synchronized with Supabase Storage for quick previewing and direct downloads.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 pt-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 w-full">
          <div className="flex items-center space-x-1.5">
            <Upload className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Upload Assets & Documents</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <HardDrive className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Categorize & Search Files</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Secure Storage Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}