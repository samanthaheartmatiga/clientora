"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";

export interface NotificationItem {
  id: string;
  organization_id?: string | null;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  read: boolean;
  created_at: string;
}

export type NotificationTab = "all" | "invoices" | "meetings";

interface NotificationContextType {
  notifications: NotificationItem[];
  filteredNotifications: NotificationItem[];
  unreadCount: number;
  activeTab: NotificationTab;
  setActiveTab: (tab: NotificationTab) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notif: {
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) => Promise<void>;
}

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

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg } = useWorkspace();
  const currentOrgId = currentOrg?.id;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const isCheckingRef = useRef(false);

  // 1. Fetch notifications safely (with fallback if column is missing)
  const fetchNotifications = useCallback(async () => {
    if (!currentOrgId) {
      setNotifications([]);
      return;
    }

    try {
      // Try tenant query first
      let res = await supabase
        .from("notifications")
        .select("*")
        .eq("organization_id", currentOrgId)
        .order("created_at", { ascending: false })
        .limit(30);

      // Fallback if organization_id column does not exist yet
      if (res.error && res.error.message.includes("organization_id")) {
        res = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);
      }

      if (res.data) {
        const uniqueList: NotificationItem[] = [];
        const seenKeys = new Set<string>();

        for (const item of res.data as NotificationItem[]) {
          const key = `${item.title}-${item.link || item.message}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueList.push(item);
          }
        }

        setNotifications(uniqueList);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [supabase, currentOrgId]);

  // 2. Insert helper with schema fallback
  const addNotification = useCallback(
    async (notif: {
      title: string;
      message: string;
      type?: string;
      link?: string;
    }) => {
      if (!currentOrgId) return;

      try {
        const payload: Record<string, unknown> = {
          title: notif.title,
          message: notif.message,
          type: notif.type || "system",
          link: notif.link || null,
        };

        // Try insert with organization_id
        const { error: insertErr } = await supabase.from("notifications").insert([
          {
            ...payload,
            organization_id: currentOrgId,
          },
        ]);

        // Fallback insert without organization_id if column missing
        if (insertErr && insertErr.message.includes("organization_id")) {
          await supabase.from("notifications").insert([payload]);
        }
      } catch (err) {
        console.error("Error inserting notification:", err);
      }
    },
    [supabase, currentOrgId]
  );

  // 3. Upcoming meetings
  const checkUpcomingMeetingReminders = useCallback(async () => {
    if (!currentOrgId) return;

    try {
      const now = new Date();
      const todayStr = getLocalDateString(now);

      const { data: upcomingMeetings } = await supabase
        .from("meetings")
        .select("id, title, meeting_date, start_time, meeting_link, status")
        .eq("organization_id", currentOrgId)
        .eq("meeting_date", todayStr)
        .eq("status", "Scheduled");

      if (!upcomingMeetings) return;

      for (const m of upcomingMeetings) {
        if (!m.start_time) continue;
        const [hours, minutes] = m.start_time.split(":").map(Number);
        const meetingDateTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes,
          0
        );

        const diffMs = meetingDateTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffMinutes > 0 && diffMinutes <= 60) {
          const formattedTime = formatTo12Hour(m.start_time);
          await addNotification({
            title: "Upcoming Meeting Reminder",
            message: `"${m.title}" starts in less than 1 hour (${formattedTime}).`,
            type: "meeting_reminder",
            link: `/meetings?id=${m.id}`,
          });
        }
      }
    } catch (err) {
      console.error("Error checking meeting reminders:", err);
    }
  }, [supabase, currentOrgId, addNotification]);

  // 4. Overdue invoices
  const checkOverdueInvoices = useCallback(async () => {
    if (!currentOrgId) return;

    try {
      const todayStr = getLocalDateString(new Date());

      const { data: pendingInvoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, due_date, status")
        .eq("organization_id", currentOrgId)
        .lt("due_date", todayStr)
        .neq("status", "Paid");

      if (!pendingInvoices) return;

      for (const inv of pendingInvoices) {
        await addNotification({
          title: "Overdue Invoice Warning",
          message: `Invoice #${inv.invoice_number} passed due on ${inv.due_date}. Please set status to Overdue manually.`,
          type: "invoice",
          link: `/invoices?id=${inv.id}`,
        });
      }
    } catch (err) {
      console.error("Error checking overdue invoices:", err);
    }
  }, [supabase, currentOrgId, addNotification]);

  // 5. Project deadlines
  const checkProjectDeadlines = useCallback(async () => {
    if (!currentOrgId) return;

    try {
      const { data: activeProjects } = await supabase
        .from("projects")
        .select("id, title, due_date, status")
        .eq("organization_id", currentOrgId)
        .neq("status", "Completed");

      if (!activeProjects) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const proj of activeProjects) {
        if (!proj.due_date) continue;

        const [y, m, d] = proj.due_date.split("-").map(Number);
        const targetDate = new Date(y, m - 1, d);
        targetDate.setHours(0, 0, 0, 0);

        const diffDays = Math.round(
          (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        let title = "";
        let message = "";

        if (diffDays === 3) {
          title = "Project Deadline Approaching";
          message = `"${proj.title}" is due in 3 days (${proj.due_date}).`;
        } else if (diffDays === 1) {
          title = "Urgent: Project Due Tomorrow";
          message = `"${proj.title}" is due tomorrow (${proj.due_date}).`;
        }

        if (title && message) {
          await addNotification({
            title,
            message,
            type: "project",
            link: `/projects?id=${proj.id}&days=${diffDays}`,
          });
        }
      }
    } catch (err) {
      console.error("Error checking project deadlines:", err);
    }
  }, [supabase, currentOrgId, addNotification]);

  const runAllChecksSequentially = useCallback(async () => {
    if (!currentOrgId || isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      await fetchNotifications();
      await checkUpcomingMeetingReminders();
      await checkOverdueInvoices();
      await checkProjectDeadlines();
      await fetchNotifications();
    } finally {
      isCheckingRef.current = false;
    }
  }, [
    currentOrgId,
    fetchNotifications,
    checkUpcomingMeetingReminders,
    checkOverdueInvoices,
    checkProjectDeadlines,
  ]);

  useEffect(() => {
    let ignore = false;

    const init = async () => {
      if (!currentOrgId) {
        if (!ignore) setNotifications([]);
        return;
      }
      await runAllChecksSequentially();
    };

    void init();

    if (!currentOrgId) return;

    const interval = setInterval(() => {
      void runAllChecksSequentially();
    }, 60 * 1000);

    const channel = supabase
      .channel(`realtime-notifications-${currentOrgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          if (!ignore) void fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings", filter: `organization_id=eq.${currentOrgId}` },
        () => {
          if (!ignore) void checkUpcomingMeetingReminders().then(fetchNotifications);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices", filter: `organization_id=eq.${currentOrgId}` },
        () => {
          if (!ignore) void checkOverdueInvoices().then(fetchNotifications);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects", filter: `organization_id=eq.${currentOrgId}` },
        () => {
          if (!ignore) void checkProjectDeadlines().then(fetchNotifications);
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [
    currentOrgId,
    supabase,
    runAllChecksSequentially,
    fetchNotifications,
    checkUpcomingMeetingReminders,
    checkOverdueInvoices,
    checkProjectDeadlines,
  ]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("read", false);
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "invoices") {
      return notif.type === "invoice";
    }
    if (activeTab === "meetings") {
      return (
        notif.type === "meeting_reminder" ||
        notif.type === "meeting_scheduled" ||
        notif.type === "meeting"
      );
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        filteredNotifications,
        unreadCount,
        activeTab,
        setActiveTab,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}