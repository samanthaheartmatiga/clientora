"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  Shield,
  Video,
  MapPin,
  Sparkles,
} from "lucide-react";

export interface MeetingSummary {
  id: string;
  title: string;
  company_name: string;
  meeting_type: "Online" | "In-Person";
  meeting_date: string;
  start_time: string;
  meeting_link?: string | null;
  location?: string | null;
}

interface UpcomingMeetingsWidgetProps {
  meetings: MeetingSummary[];
  roleLabel?: string;
}

export default function UpcomingMeetingsWidget({
  meetings = [],
  roleLabel = "Active Member",
}: UpcomingMeetingsWidgetProps) {
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHour = hours % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <CalendarClock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Upcoming Calls
            </h2>
          </div>
          <Link
            href="/meetings"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Schedule
          </Link>
        </div>

        <div className="space-y-3">
          {meetings.length === 0 ? (
            <div className="p-6 text-center text-slate-400 space-y-1">
              <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500/60" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                No calls scheduled
              </p>
              <p className="text-[10px]">Your schedule is clear for today.</p>
            </div>
          ) : (
            meetings.map((m, index) => {
              const isNextUp = index === 0;

              if (isNextUp) {
                return (
                  <div
                    key={m.id}
                    className="relative overflow-hidden rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-500/40 bg-linear-to-br from-indigo-50/80 via-indigo-50/40 to-purple-50/50 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-900/90 p-4 shadow-sm space-y-3 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            <Sparkles className="h-3 w-3" />
                            Next Up
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {m.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {m.company_name}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                          m.meeting_type === "Online"
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        }`}
                      >
                        {m.meeting_type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>{m.meeting_date}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>{formatTime(m.start_time)}</span>
                        </span>
                      </div>

                      {m.meeting_type === "Online" && m.meeting_link && (
                        <a
                          href={
                            m.meeting_link.startsWith("http")
                              ? m.meeting_link
                              : `https://${m.meeting_link}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded-lg shadow-xs transition shrink-0"
                        >
                          <Video className="h-3 w-3" />
                          <span>Join Call</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}

                      {m.meeting_type === "In-Person" && m.location && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-36">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate">{m.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-2 hover:border-indigo-500/30 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {m.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">{m.company_name}</p>
                    </div>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                        m.meeting_type === "Online"
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                      }`}
                    >
                      {m.meeting_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-indigo-500 shrink-0" />
                        <span>{m.meeting_date}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-indigo-500 shrink-0" />
                        <span>{formatTime(m.start_time)}</span>
                      </span>
                    </div>

                    {m.meeting_type === "Online" && m.meeting_link && (
                      <a
                        href={
                          m.meeting_link.startsWith("http")
                            ? m.meeting_link
                            : `https://${m.meeting_link}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-semibold"
                      >
                        <span>Join</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 space-y-2">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
          <Shield className="h-4 w-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-bold">Access Scope Active</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          You are signed in under the <strong>{roleLabel}</strong> security scope. Your capabilities automatically adapt based on your assigned role in the Team Directory.
        </p>
      </div>
    </div>
  );
}