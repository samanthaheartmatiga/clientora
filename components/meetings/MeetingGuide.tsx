"use client";

import React, { useState } from "react";
import { Video, X, Calendar, VideoIcon, Clock } from "lucide-react";

export default function MeetingGuide() {
  const [isVisible, setIsVisible] = useState<boolean>(true);

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
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
            What is the Meetings Module?
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
          The Meetings hub allows you to organize client consultations, project review sessions, and kick-off calls in one central calendar feed. Attach video conferencing links, track call durations, link sessions directly to client records, and leave post-meeting notes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 pt-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 w-full">
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Schedule Client Calls</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <VideoIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Sync Google Meet & Zoom Links</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Track Durations & Logs</span>
          </div>
        </div>
      </div>
    </div>
  );
}