"use client";

import React from "react";
import {
  Video,
  Calendar,
  Clock,
  Building2,
  FolderKanban,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  CalendarClock,
  MapPin,
  Globe,
  Plus,
} from "lucide-react";
import { Meeting } from "./types";

interface MeetingGridProps {
  meetings: Meeting[];
  loading: boolean;
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: Meeting["status"]) => void;
}

// Helper function to format 24-hour time strings (HH:mm:ss or HH:mm) to 12-hour AM/PM
function formatTo12Hour(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${hours}:${minutes} ${ampm}`;
}

export default function MeetingGrid({
  meetings,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
}: MeetingGridProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900">
        Loading scheduled meetings...
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
        <Video className="h-8 w-8 text-slate-400 mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No meetings found
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Schedule online calls or face-to-face client check-ins.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: Meeting["status"]) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
      case "Canceled":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            <span>Canceled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <CalendarClock className="h-3 w-3" />
            <span>Scheduled</span>
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {meetings.map((m) => (
        <div
          key={m.id}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2">
                {getStatusBadge(m.status)}
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {m.meeting_type === "In-Person" ? (
                    <>
                      <MapPin className="h-2.5 w-2.5 text-rose-500" />
                      <span>Face-to-Face</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-2.5 w-2.5 text-indigo-500" />
                      <span>Online</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  title="Edit Meeting"
                  suppressHydrationWarning
                  onClick={() => onEdit(m)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  title="Delete Meeting"
                  suppressHydrationWarning
                  onClick={() => onDelete(m.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                {m.meeting_type === "In-Person" ? (
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                ) : (
                  <Video className="h-4 w-4 text-indigo-500 shrink-0" />
                )}
                <span className="truncate">{m.title}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {m.notes || "No meeting agenda or notes provided."}
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center space-x-2">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {m.company_name}
                </span>
              </div>
              {m.project_title && (
                <div className="flex items-center space-x-2">
                  <FolderKanban className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{m.project_title}</span>
                </div>
              )}
              {m.meeting_type === "In-Person" && m.location && (
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{m.location}</span>
                </div>
              )}
              <div className="flex items-center space-x-4 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>{new Date(m.meeting_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>
                    {formatTo12Hour(m.start_time)} ({m.duration_minutes}m)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
            <select
              value={m.status}
              onChange={(e) =>
                onStatusChange(m.id, e.target.value as Meeting["status"])
              }
              className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>

            {m.meeting_type === "Online" ? (
              m.meeting_link ? (
                <a
                  href={
                    m.meeting_link.startsWith("http")
                      ? m.meeting_link
                      : `https://${m.meeting_link}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20 shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Join Call</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onEdit(m)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Link</span>
                </button>
              )
            ) : (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                In-Person Sync
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}