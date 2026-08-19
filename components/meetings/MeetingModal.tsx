"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Loader2,
  Video,
  MapPin,
  Globe,
  Mail,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Meeting, ClientOption, ProjectOption } from "./types";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/lib/permissions";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMeeting: Meeting | null;
  clientOptions: ClientOption[];
  projectOptions: ProjectOption[];
  onSubmit: (data: {
    client_id: string;
    project_id?: string | null;
    title: string;
    meeting_type: "Online" | "In-Person";
    meeting_date: string;
    start_time: string;
    duration_minutes: number;
    meeting_link?: string | null;
    location?: string | null;
    status: Meeting["status"];
    notes?: string | null;
    notifyClient?: boolean;
  }) => Promise<void>;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const QUICK_MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function parseTime24h(timeStr: string) {
  if (!timeStr) return { hour12: 10, minute: 0, period: "AM" as const };
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? ("PM" as const) : ("AM" as const);
  const hour12 = h % 12 || 12;
  return { hour12, minute: isNaN(m) ? 0 : m, period };
}

function toTime24h(hour12: number, minute: number, period: "AM" | "PM") {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatTime12h(timeStr: string) {
  if (!timeStr) return "10:00 AM";
  const { hour12, minute, period } = parseTime24h(timeStr);
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

export default function MeetingModal({
  isOpen,
  onClose,
  editingMeeting,
  clientOptions,
  projectOptions,
  onSubmit,
}: MeetingModalProps) {
  const { role, loading } = useUserRole();

  const [clientId, setClientId] = useState<string>(
    editingMeeting?.client_id || ""
  );
  const [projectId, setProjectId] = useState<string>(
    editingMeeting?.project_id || ""
  );
  const [title, setTitle] = useState<string>(editingMeeting?.title || "");
  const [meetingType, setMeetingType] = useState<"Online" | "In-Person">(
    editingMeeting?.meeting_type || "Online"
  );

  // Initialize with today's local date in YYYY-MM-DD
  const [meetingDate, setMeetingDate] = useState<string>(() => {
    if (editingMeeting?.meeting_date) return editingMeeting.meeting_date;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const [startTime, setStartTime] = useState<string>(
    editingMeeting?.start_time || "10:00"
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    editingMeeting?.duration_minutes || 30
  );
  const [meetingLink, setMeetingLink] = useState<string>(
    editingMeeting?.meeting_link || ""
  );
  const [location, setLocation] = useState<string>(
    editingMeeting?.location || ""
  );
  const [status, setStatus] = useState<Meeting["status"]>(
    editingMeeting?.status || "Scheduled"
  );
  const [notes, setNotes] = useState<string>(editingMeeting?.notes || "");
  const [notifyClient, setNotifyClient] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Custom Picker States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const { hour12: selectedHour, minute: selectedMinute, period: selectedPeriod } = useMemo(
    () => parseTime24h(startTime),
    [startTime]
  );

  const initialDateObj = useMemo(() => {
    if (!meetingDate) return new Date();
    const [y, m, d] = meetingDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [meetingDate]);

  const [calYear, setCalYear] = useState(initialDateObj.getFullYear());
  const [calMonth, setCalMonth] = useState(initialDateObj.getMonth());

  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setIsTimePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const effectiveClientId = clientId || clientOptions[0]?.id || "";

  if (!isOpen) return null;

  const requiredAction = editingMeeting ? "update" : "create";
  const hasAccess = canPerformAction(role, "meetings", requiredAction);

  const filteredProjects = projectOptions.filter(
    (p) => !effectiveClientId || p.client_id === effectiveClientId
  );

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(calMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    setMeetingDate(`${calYear}-${mStr}-${dStr}`);
    setIsDatePickerOpen(false);
    setErrorMsg("");
  };

  const updateTimeValue = (h: number, m: number, p: "AM" | "PM") => {
    setStartTime(toTime24h(h, m, p));
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!hasAccess || !title.trim() || !effectiveClientId || !meetingDate || !startTime) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    // Precise local date and time parsing
    const [year, month, day] = meetingDate.split("-").map(Number);
    const [hours, minutes] = startTime.split(":").map(Number);
    const scheduledDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    const currentNow = new Date();

    // Block scheduling in the past (only for new meetings or scheduled status)
    if (status === "Scheduled" && scheduledDateTime.getTime() < currentNow.getTime()) {
      setErrorMsg("Cannot schedule a meeting in the past. Please select an upcoming date and time.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        client_id: effectiveClientId,
        project_id: projectId || null,
        title: title.trim(),
        meeting_type: meetingType,
        meeting_date: meetingDate,
        start_time: startTime,
        duration_minutes: Math.max(5, Number(durationMinutes) || 30),
        meeting_link: meetingType === "Online" ? meetingLink || null : null,
        location: meetingType === "In-Person" ? location || null : null,
        status,
        notes: notes.trim() || null,
        notifyClient,
      });
    } catch (err) {
      console.error("Error saving meeting:", err);
      setErrorMsg("Failed to save meeting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl dark:shadow-indigo-950/50 relative transition-all duration-200 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4.5 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {editingMeeting ? "Edit Meeting" : "Schedule New Meeting"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Set call details, assign client context, and specify location or links.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Permissions Alert */}
        {!loading && !hasAccess && (
          <div className="mt-4 flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-3 text-xs text-rose-600 dark:text-rose-400 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>
              Permission Denied: Your role ({role}) cannot {editingMeeting ? "edit" : "schedule"} meetings.
            </span>
          </div>
        )}

        {/* Validation / Past Date Error Alert */}
        {errorMsg && (
          <div className="mt-4 flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 rounded-2xl p-3.5 text-xs text-rose-600 dark:text-rose-400 shrink-0 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4.5 overflow-y-auto pt-4.5 pr-1.5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Meeting Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Meeting Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl">
              <button
                type="button"
                disabled={!hasAccess}
                onClick={() => setMeetingType("Online")}
                className={`flex items-center justify-center space-x-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  meetingType === "Online"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Online Call</span>
              </button>

              <button
                type="button"
                disabled={!hasAccess}
                onClick={() => setMeetingType("In-Person")}
                className={`flex items-center justify-center space-x-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  meetingType === "In-Person"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Face-to-Face</span>
              </button>
            </div>
          </div>

          {/* Meeting Title */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Meeting Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!hasAccess}
              placeholder="e.g. Website Scope Kick-off Call"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrorMsg("");
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Client & Project Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Client Company <span className="text-rose-500">*</span>
              </label>
              <select
                required
                disabled={!hasAccess}
                value={effectiveClientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setProjectId("");
                  setErrorMsg("");
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled className="dark:bg-slate-900">
                  Select Client
                </option>
                {clientOptions.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-900">
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Linked Project <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                disabled={!hasAccess}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="dark:bg-slate-900">None / General Call</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900">
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Custom Exact Time & Duration Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Compact Custom Date Picker */}
            <div className="space-y-1.5 text-left relative" ref={datePickerRef}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                disabled={!hasAccess}
                onClick={() => {
                  setIsDatePickerOpen((prev) => !prev);
                  setIsTimePickerOpen(false);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between hover:border-indigo-500 transition cursor-pointer disabled:opacity-50"
              >
                <span className="truncate">{meetingDate || "Select Date"}</span>
                <CalendarIcon className="h-4 w-4 text-indigo-500 shrink-0 ml-1" />
              </button>

              {isDatePickerOpen && (
                <div className="absolute left-0 bottom-full mb-2 z-50 w-56 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-0.5 text-center mt-1.5">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <span key={d} className="text-[9px] font-semibold text-slate-400">
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-5" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const mStr = String(calMonth + 1).padStart(2, "0");
                      const dStr = String(day).padStart(2, "0");
                      const dateFormatted = `${calYear}-${mStr}-${dStr}`;
                      const isSelected = dateFormatted === meetingDate;

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleSelectDay(day)}
                          className={`h-5 w-5 mx-auto rounded-md text-[11px] font-medium flex items-center justify-center transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-600/30"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Compact Custom Exact Time Picker */}
            <div className="space-y-1.5 text-left relative" ref={timePickerRef}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                disabled={!hasAccess}
                onClick={() => {
                  setIsTimePickerOpen((prev) => !prev);
                  setIsDatePickerOpen(false);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between hover:border-indigo-500 transition cursor-pointer disabled:opacity-50"
              >
                <span>{formatTime12h(startTime)}</span>
                <ClockIcon className="h-4 w-4 text-indigo-500 shrink-0 ml-1" />
              </button>

              {isTimePickerOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto bottom-full mb-2 z-50 w-56 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 space-y-2">
                  {/* Digital Display & AM/PM Switcher */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/70 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center space-x-1 pl-1">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={selectedHour}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(12, Number(e.target.value) || 1));
                          updateTimeValue(val, selectedMinute, selectedPeriod);
                        }}
                        className="w-8 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                      />
                      <span className="font-bold text-slate-400 text-xs">:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={String(selectedMinute).padStart(2, "0")}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                          updateTimeValue(selectedHour, val, selectedPeriod);
                        }}
                        className="w-8 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                      />
                    </div>

                    <div className="flex items-center space-x-0.5 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateTimeValue(selectedHour, selectedMinute, "AM")}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                          selectedPeriod === "AM"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTimeValue(selectedHour, selectedMinute, "PM")}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                          selectedPeriod === "PM"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>

                  {/* Hour Quick Selection */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Hour
                    </span>
                    <div className="grid grid-cols-6 gap-0.5">
                      {HOURS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => updateTimeValue(h, selectedMinute, selectedPeriod)}
                          className={`h-5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                            selectedHour === h
                              ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minute Quick Selection */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Minute
                    </span>
                    <div className="grid grid-cols-6 gap-0.5">
                      {QUICK_MINUTES.map((m) => {
                        const mNum = Number(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => updateTimeValue(selectedHour, mNum, selectedPeriod)}
                            className={`h-5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                              selectedMinute === mNum
                                ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            :{m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTimePickerOpen(false)}
                    className="w-full py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    Set Time
                  </button>
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Duration <span className="text-[10px] text-slate-400 font-normal">(Mins)</span>
              </label>
              <input
                type="number"
                min="5"
                step="5"
                disabled={!hasAccess}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Video Link or Location */}
          {meetingType === "Online" ? (
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Video Call URL
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Google Meet / Zoom / Teams</span>
              </div>
              <input
                type="text"
                disabled={!hasAccess}
                placeholder="https://meet.google.com/abc-defg-hij"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          ) : (
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Physical Location / Office Address
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <input
                type="text"
                disabled={!hasAccess}
                placeholder="e.g. Starbucks BGC, Building 2 Conference Room..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* Status */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Meeting Status
            </label>
            <select
              disabled={!hasAccess}
              value={status}
              onChange={(e) => setStatus(e.target.value as Meeting["status"])}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="Scheduled" className="dark:bg-slate-900">Scheduled</option>
              <option value="Completed" className="dark:bg-slate-900">Completed</option>
              <option value="Canceled" className="dark:bg-slate-900">Canceled</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Agenda & Notes <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              disabled={!hasAccess}
              placeholder="Call agenda, talking points, or post-meeting action items..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Client Notification Checkbox */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={!hasAccess}
                checked={notifyClient}
                onChange={(e) => setNotifyClient(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 dark:bg-slate-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center space-x-1.5">
                <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>Send email confirmation invite to client</span>
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 pb-1 flex items-center justify-end space-x-2.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasAccess || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingMeeting ? "Save Changes" : "Schedule Meeting"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}