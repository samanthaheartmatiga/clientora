"use client";

import React, { useState } from "react";
import { X, Loader2, Video, MapPin, Globe, Mail } from "lucide-react";
import { Meeting, ClientOption, ProjectOption } from "./types";

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

export default function MeetingModal({
  isOpen,
  onClose,
  editingMeeting,
  clientOptions,
  projectOptions,
  onSubmit,
}: MeetingModalProps) {
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
  const [meetingDate, setMeetingDate] = useState<string>(
    editingMeeting?.meeting_date || new Date().toISOString().split("T")[0]
  );
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

  const effectiveClientId = clientId || clientOptions[0]?.id || "";

  if (!isOpen) return null;

  const filteredProjects = projectOptions.filter(
    (p) => !effectiveClientId || p.client_id === effectiveClientId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !effectiveClientId || !meetingDate || !startTime) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        client_id: effectiveClientId,
        project_id: projectId || null,
        title,
        meeting_type: meetingType,
        meeting_date: meetingDate,
        start_time: startTime,
        duration_minutes: Number(durationMinutes) || 30,
        meeting_link: meetingType === "Online" ? meetingLink || null : null,
        location: meetingType === "In-Person" ? location || null : null,
        status,
        notes,
        notifyClient,
      });
    } catch (err) {
      console.error("Error saving meeting:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl dark:shadow-indigo-950/40 relative transition-colors duration-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
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
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body with Invisible Scrollbar */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto pt-4 pr-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Meeting Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Meeting Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMeetingType("Online")}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  meetingType === "Online"
                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>Online Call</span>
              </button>

              <button
                type="button"
                onClick={() => setMeetingType("In-Person")}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  meetingType === "In-Person"
                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>Face-to-Face</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Meeting Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Website Scope Kick-off Call"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Client Company
              </label>
              <select
                required
                value={effectiveClientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setProjectId("");
                }}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
              >
                <option value="" disabled>
                  Select Client
                </option>
                {clientOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Linked Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
              >
                <option value="">None / General Call</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Duration (Mins)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Conditional Input Field Based on Meeting Type */}
          {meetingType === "Online" ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Video Call URL (Google Meet / Zoom / Teams)
                </label>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <input
                type="text"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Physical Location / Office Address
                </label>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Starbucks BGC, Building 2 Conference Room..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Meeting["status"])}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Agenda / Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Call agenda or post-meeting summary..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Client Email Notification Toggle */}
          <div className="pt-1">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyClient}
                onChange={(e) => setNotifyClient(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center space-x-1.5">
                <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>Send email confirmation invite to client</span>
              </span>
            </label>
          </div>

          {/* Actions Footer */}
          <div className="pt-3 pb-1 flex items-center justify-end space-x-2.5 border-t border-slate-200 dark:border-slate-800/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{editingMeeting ? "Save Changes" : "Schedule Meeting"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}