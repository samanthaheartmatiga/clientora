"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabaseClient";

export interface NotificationItem {
  id: string;
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

// 12-Hour AM/PM Time Format Helper
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

const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const isCheckingRef = useRef(false);

  // Fetch notifications and filter out duplicate titles/messages in UI
  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      const uniqueList: NotificationItem[] = [];
      const seenKeys = new Set<string>();

      for (const item of data as NotificationItem[]) {
        const key = `${item.title}-${item.link || item.message}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueList.push(item);
        }
      }

      setNotifications(uniqueList);
    }
  }, []);

  // Centralized insert helper with strict database-level duplicate checking
  const addNotification = useCallback(
    async (notif: {
      title: string;
      message: string;
      type?: string;
      link?: string;
    }) => {
      try {
        let query = supabase.from("notifications").select("id").limit(1);

        if (notif.link) {
          query = query.eq("link", notif.link);
        } else {
          query = query.eq("title", notif.title).eq("message", notif.message);
        }

        const { data: existing } = await query;

        if (!existing || existing.length === 0) {
          await supabase.from("notifications").insert([
            {
              title: notif.title,
              message: notif.message,
              type: notif.type || "system",
              link: notif.link || null,
            },
          ]);
        }
      } catch (err) {
        console.error("Error inserting notification:", err);
      }
    },
    []
  );

  // 1. Check upcoming meetings — STRICT 1-HOUR BEFORE NOTIFICATION WITH 12-HR TIME
  const checkUpcomingMeetingReminders = useCallback(async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      const { data: upcomingMeetings } = await supabase
        .from("meetings")
        .select("id, title, meeting_date, start_time, meeting_link, status")
        .eq("meeting_date", todayStr)
        .eq("status", "Scheduled");

      if (!upcomingMeetings) return;

      for (const m of upcomingMeetings) {
        const [hours, minutes] = m.start_time.split(":").map(Number);
        const meetingDateTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes
        );

        const diffMs = meetingDateTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        // Trigger ONLY when meeting is between 0 and 60 minutes away
        if (diffMinutes > 0 && diffMinutes <= 60) {
          const formattedTime = formatTo12Hour(m.start_time);
          const reminderTitle = "Upcoming Meeting Reminder";
          const reminderMessage = `"${m.title}" starts in less than 1 hour (${formattedTime}).`;
          const targetLink = `/meetings?id=${m.id}`;

          await addNotification({
            title: reminderTitle,
            message: reminderMessage,
            type: "meeting_reminder",
            link: targetLink,
          });
        }
      }
    } catch (err) {
      console.error("Error checking meeting reminders:", err);
    }
  }, [addNotification]);

  // 2. Check overdue invoices
  const checkOverdueInvoices = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];

      const { data: pendingInvoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, due_date, status")
        .lt("due_date", todayStr)
        .neq("status", "Paid");

      if (!pendingInvoices) return;

      for (const inv of pendingInvoices) {
        const title = "Overdue Invoice Warning";
        const message = `Invoice #${inv.invoice_number} passed due on ${inv.due_date}. Please set status to Overdue manually.`;

        await addNotification({
          title,
          message,
          type: "invoice",
          link: `/invoices?id=${inv.id}`,
        });
      }
    } catch (err) {
      console.error("Error checking overdue invoices:", err);
    }
  }, [addNotification]);

  // 3. Check project deadlines (Strict 3-Day & 1-Day warnings)
  const checkProjectDeadlines = useCallback(async () => {
    try {
      const { data: activeProjects } = await supabase
        .from("projects")
        .select("id, title, due_date, status")
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
  }, [addNotification]);

  const runAllChecksSequentially = useCallback(async () => {
    if (isCheckingRef.current) return;
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
    fetchNotifications,
    checkUpcomingMeetingReminders,
    checkOverdueInvoices,
    checkProjectDeadlines,
  ]);

  useEffect(() => {
    runAllChecksSequentially();

    const interval = setInterval(() => {
      runAllChecksSequentially();
    }, 60 * 1000);

    const channel = supabase
      .channel("realtime-app-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings" },
        () => {
          checkUpcomingMeetingReminders().then(fetchNotifications);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => {
          checkOverdueInvoices().then(fetchNotifications);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          checkProjectDeadlines().then(fetchNotifications);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [
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
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);
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