"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { logWorkspaceActivity } from "@/lib/audit";
import {
  Meeting,
  ClientOption,
  ProjectOption,
} from "@/components/meetings/types";
import MeetingGuide from "@/components/meetings/MeetingGuide";
import MeetingControls from "@/components/meetings/MeetingControls";
import MeetingGrid from "@/components/meetings/MeetingGrid";
import MeetingModal from "@/components/meetings/MeetingModal";

interface DbMeetingRecord {
  id: string;
  client_id: string;
  project_id?: string | null;
  title: string;
  meeting_type?: Meeting["meeting_type"];
  meeting_date: string;
  start_time: string;
  duration_minutes: number;
  meeting_link?: string | null;
  location?: string | null;
  status: Meeting["status"];
  notes?: string | null;
  sequence?: number;
  created_at?: string;
  clients?: {
    company_name: string;
    contact_email?: string | null;
  } | null;
  projects?: {
    title: string;
  } | null;
}

function MeetingsContent() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  const refetchMeetings = useCallback(async () => {
    try {
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, company_name, contact_email")
        .order("company_name", { ascending: true });

      if (clientsData) {
        const formattedClients: ClientOption[] = clientsData.map((c) => ({
          id: c.id,
          company_name: c.company_name,
          email: c.contact_email || null,
        }));
        setClientOptions(formattedClients);
      }

      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, title, client_id")
        .order("title", { ascending: true });

      if (projectsData) setProjectOptions(projectsData as ProjectOption[]);

      const { data: rawMeetings, error } = await supabase
        .from("meetings")
        .select("*, clients(company_name, contact_email), projects(title)")
        .order("meeting_date", { ascending: true });

      if (error) {
        console.error("Error fetching meetings:", error.message);
      } else if (rawMeetings) {
        const formatted: Meeting[] = (
          rawMeetings as unknown as DbMeetingRecord[]
        ).map((m) => ({
          id: m.id,
          client_id: m.client_id,
          project_id: m.project_id,
          company_name: m.clients?.company_name || "Unassigned",
          project_title: m.projects?.title || undefined,
          title: m.title,
          meeting_type: m.meeting_type || "Online",
          meeting_date: m.meeting_date,
          start_time: m.start_time,
          duration_minutes: m.duration_minutes,
          meeting_link: m.meeting_link,
          location: m.location,
          status: m.status,
          notes: m.notes,
          sequence: m.sequence || 0,
          created_at: m.created_at,
        }));
        setMeetings(formatted);
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const { data: clientsData } = await supabase
          .from("clients")
          .select("id, company_name, contact_email")
          .order("company_name", { ascending: true });

        if (isMounted && clientsData) {
          const formattedClients: ClientOption[] = clientsData.map((c) => ({
            id: c.id,
            company_name: c.company_name,
            email: c.contact_email || null,
          }));
          setClientOptions(formattedClients);
        }

        const { data: projectsData } = await supabase
          .from("projects")
          .select("id, title, client_id")
          .order("title", { ascending: true });

        if (isMounted && projectsData)
          setProjectOptions(projectsData as ProjectOption[]);

        const { data: rawMeetings, error } = await supabase
          .from("meetings")
          .select("*, clients(company_name, contact_email), projects(title)")
          .order("meeting_date", { ascending: true });

        if (error) {
          console.error("Error fetching meetings:", error.message);
        } else if (isMounted && rawMeetings) {
          const formatted: Meeting[] = (
            rawMeetings as unknown as DbMeetingRecord[]
          ).map((m) => ({
            id: m.id,
            client_id: m.client_id,
            project_id: m.project_id,
            company_name: m.clients?.company_name || "Unassigned",
            project_title: m.projects?.title || undefined,
            title: m.title,
            meeting_type: m.meeting_type || "Online",
            meeting_date: m.meeting_date,
            start_time: m.start_time,
            duration_minutes: m.duration_minutes,
            meeting_link: m.meeting_link,
            location: m.location,
            status: m.status,
            notes: m.notes,
            sequence: m.sequence || 0,
            created_at: m.created_at,
          }));
          setMeetings(formatted);
        }
      } catch (err) {
        console.error("Connection error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    const channel = supabase
      .channel("realtime-meetings-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings" },
        () => {
          if (isMounted) loadData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.project_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingMeeting(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m: Meeting) => {
    setEditingMeeting(m);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: Meeting["status"]
  ) => {
    const targetMeeting = meetings.find((m) => m.id === id);

    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );

    const { error } = await supabase
      .from("meetings")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating meeting status:", error.message);
      await refetchMeetings();
    } else if (targetMeeting) {
      await logWorkspaceActivity(
        `Updated Meeting: ${targetMeeting.title} (Status: ${targetMeeting.status} → ${newStatus})`
      );
    }
  };

  const handleFormSubmit = async (formData: {
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
  }) => {
    const shouldNotify = formData.notifyClient;
    const payload = { ...formData };
    delete payload.notifyClient;

    let savedMeetingId = editingMeeting?.id;
    let sequence = 0;

    let error;
    if (editingMeeting) {
      sequence = ((editingMeeting as unknown as DbMeetingRecord).sequence || 0) + 1;
      const res = await supabase
        .from("meetings")
        .update({ ...payload, sequence })
        .eq("id", editingMeeting.id)
        .select("id")
        .single();

      error = res.error;
      if (res.data) savedMeetingId = res.data.id;

      if (!error) {
        let actionDesc = `Updated Meeting: ${formData.title}`;
        if (
          editingMeeting.meeting_date !== formData.meeting_date ||
          editingMeeting.start_time !== formData.start_time
        ) {
          actionDesc = `Rescheduled Meeting: ${formData.title} to ${formData.meeting_date} at ${formData.start_time}`;
        } else if (editingMeeting.status !== formData.status) {
          actionDesc = `Updated Meeting: ${formData.title} (Status: ${editingMeeting.status} → ${formData.status})`;
        }
        await logWorkspaceActivity(actionDesc);
      }
    } else {
      const res = await supabase
        .from("meetings")
        .insert([{ ...payload, sequence: 0 }])
        .select("id")
        .single();

      error = res.error;
      if (res.data) savedMeetingId = res.data.id;

      if (!error) {
        await logWorkspaceActivity(
          `Scheduled Meeting: ${formData.title} (${formData.meeting_date} ${formData.start_time})`
        );
      }
    }

    if (error) {
      console.error("Supabase error saving meeting:", error.message);
      return;
    }

    let targetName = clientOptions.find((c) => c.id === payload.client_id)?.company_name;

    if (shouldNotify && savedMeetingId) {
      let targetEmail = clientOptions.find((c) => c.id === payload.client_id)?.email;

      if (!targetEmail) {
        const { data: dbClient } = await supabase
          .from("clients")
          .select("company_name, contact_email")
          .eq("id", payload.client_id)
          .single();

        if (dbClient) {
          targetEmail = dbClient.contact_email;
          targetName = dbClient.company_name;
        }
      }

      if (targetEmail) {
        try {
          await fetch("/api/send-meeting-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              meetingId: savedMeetingId,
              sequence,
              to: targetEmail,
              clientName: targetName || "Client",
              title: payload.title,
              meetingType: payload.meeting_type,
              meetingDate: payload.meeting_date,
              startTime: payload.start_time,
              durationMinutes: payload.duration_minutes,
              meetingLink: payload.meeting_link,
              location: payload.location,
              notes: payload.notes,
            }),
          });
        } catch (emailErr) {
          console.error("Error triggering client email API:", emailErr);
        }
      }
    }

    setIsModalOpen(false);
    await refetchMeetings();
  };

  const handleDeleteMeeting = async (id: string) => {
    const meetingToDelete = meetings.find((m) => m.id === id);

    if (meetingToDelete) {
      let targetEmail = clientOptions.find(
        (c) => c.id === meetingToDelete.client_id
      )?.email;
      let targetName = clientOptions.find(
        (c) => c.id === meetingToDelete.client_id
      )?.company_name;

      if (!targetEmail) {
        const { data: dbClient } = await supabase
          .from("clients")
          .select("company_name, contact_email")
          .eq("id", meetingToDelete.client_id)
          .single();

        if (dbClient) {
          targetEmail = dbClient.contact_email;
          targetName = dbClient.company_name;
        }
      }

      if (targetEmail) {
        try {
          await fetch("/api/send-meeting-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              meetingId: meetingToDelete.id,
              sequence: ((meetingToDelete as unknown as DbMeetingRecord).sequence || 0) + 1,
              isCancellation: true,
              to: targetEmail,
              clientName: targetName || "Client",
              title: meetingToDelete.title,
              meetingType: meetingToDelete.meeting_type,
              meetingDate: meetingToDelete.meeting_date,
              startTime: meetingToDelete.start_time,
              durationMinutes: meetingToDelete.duration_minutes,
              meetingLink: meetingToDelete.meeting_link,
              location: meetingToDelete.location,
              notes: meetingToDelete.notes,
            }),
          });
        } catch (err) {
          console.error("Error sending meeting cancellation email:", err);
        }
      }
    }

    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (!error) {
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      await logWorkspaceActivity(
        `Cancelled Meeting: ${meetingToDelete?.title || "Meeting"}`
      );
    } else {
      console.error("Error deleting meeting:", error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Client Meetings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize upcoming calls, attach video room links, and track meeting logs.
          </p>
        </div>
        <button
          suppressHydrationWarning
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      <MeetingGuide />

      <MeetingControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <MeetingGrid
        meetings={filteredMeetings}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteMeeting}
        onStatusChange={handleStatusChange}
      />

      <MeetingModal
        key={editingMeeting ? editingMeeting.id : isModalOpen ? "open" : "closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingMeeting={editingMeeting}
        clientOptions={clientOptions}
        projectOptions={projectOptions}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading meetings...</div>}>
      <MeetingsContent />
    </Suspense>
  );
}