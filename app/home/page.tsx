"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction, ROLES } from "@/lib/permissions";

import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import AnalyticsSummaryBar, {
  AnalyticsProjectItem,
  AnalyticsInvoiceItem,
} from "@/components/dashboard/AnalyticsSummaryBar";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import RecentProjectsTable, {
  ProjectSummary,
} from "@/components/dashboard/RecentProjectsTable";
import RecentInvoicesTable, {
  InvoiceSummary,
} from "@/components/dashboard/RecentInvoicesTable";
import UpcomingMeetingsWidget, {
  MeetingSummary,
} from "@/components/dashboard/UpcomingMeetingsWidget";

interface RawClientRelation {
  company_name: string | null;
}

interface RawProjectRow {
  id: string;
  title: string;
  status: "Planning" | "In Progress" | "Review" | "Completed";
  due_date: string;
  budget: number;
  created_at?: string;
  clients: RawClientRelation | RawClientRelation[] | null;
}

interface RawInvoiceRow {
  id: string;
  invoice_number: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  due_date: string;
  created_at?: string;
  clients: RawClientRelation | RawClientRelation[] | null;
}

interface RawMeetingRow {
  id: string;
  title: string;
  meeting_type: "Online" | "In-Person";
  meeting_date: string;
  start_time: string;
  meeting_link: string | null;
  location: string | null;
  status: string;
  created_at?: string;
  clients: RawClientRelation | RawClientRelation[] | null;
}

interface RawAuditLogRow {
  action: string;
  created_at: string;
}

function getCompanyName(clients: RawClientRelation | RawClientRelation[] | null): string {
  if (!clients) return "General Client";
  if (Array.isArray(clients)) {
    return clients[0]?.company_name || "General Client";
  }
  return clients.company_name || "General Client";
}

export default function HomePage() {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg, isLoading: orgLoading } = useWorkspace();
  const currentOrgId = currentOrg?.id;
  const { role, loading: roleLoading } = useUserRole();

  const [userName, setUserName] = useState<string>("Workspace User");
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClientsCount: 0,
    activeProjects: 0,
    totalProjects: 0,
    upcomingMeetings: 0,
    totalMeetings: 0,
    totalPaidRevenue: 0,
    totalInvoicedAmount: 0,
  });

  const [allProjects, setAllProjects] = useState<AnalyticsProjectItem[]>([]);
  const [allInvoices, setAllInvoices] = useState<AnalyticsInvoiceItem[]>([]);
  const [recentProjects, setRecentProjects] = useState<ProjectSummary[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceSummary[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!currentOrgId) {
      setIsLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else if (user.email) {
          setUserName(user.email.split("@")[0]);
        }
      }

      // Fetch all dashboard data scoped to current organization
      const [clientsRes, projectsRes, invoicesRes, meetingsRes, auditLogsRes] =
        await Promise.all([
          supabase
            .from("clients")
            .select("id", { count: "exact" })
            .eq("organization_id", currentOrgId),
          supabase
            .from("projects")
            .select("*, clients(company_name)")
            .eq("organization_id", currentOrgId),
          supabase
            .from("invoices")
            .select("*, clients(company_name)")
            .eq("organization_id", currentOrgId),
          supabase
            .from("meetings")
            .select("*, clients(company_name)")
            .eq("organization_id", currentOrgId)
            .order("meeting_date", { ascending: true })
            .order("start_time", { ascending: true }),
          supabase
            .from("audit_logs")
            .select("action, created_at")
            .eq("organization_id", currentOrgId)
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

      const clientCount = clientsRes.count || 0;
      const rawProjects = (projectsRes.data || []) as unknown as RawProjectRow[];
      const rawInvoices = (invoicesRes.data || []) as unknown as RawInvoiceRow[];
      const rawMeetings = (meetingsRes.data || []) as unknown as RawMeetingRow[];
      const auditLogs = (auditLogsRes.data || []) as unknown as RawAuditLogRow[];

      // Metrics calculation
      const totalProjs = rawProjects.length;
      const activeProjs = rawProjects.filter(
        (p) => p.status === "In Progress" || p.status === "Planning"
      ).length;

      const activeClientNames = new Set(
        rawProjects
          .filter((p) => p.status === "In Progress" || p.status === "Planning")
          .map((p) => getCompanyName(p.clients))
      );

      const totalMeets = rawMeetings.length;
      const scheduledMeets = rawMeetings.filter((m) => m.status === "Scheduled");

      const totalPaidRev = rawInvoices
        .filter((inv) => inv.status === "Paid")
        .reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);

      const totalInvoiced = rawInvoices.reduce(
        (acc, inv) => acc + (Number(inv.amount) || 0),
        0
      );

      setStats({
        totalClients: clientCount,
        activeClientsCount: activeClientNames.size,
        activeProjects: activeProjs,
        totalProjects: totalProjs,
        upcomingMeetings: scheduledMeets.length,
        totalMeetings: totalMeets,
        totalPaidRevenue: totalPaidRev,
        totalInvoicedAmount: totalInvoiced,
      });

      const formattedAllProjects: AnalyticsProjectItem[] = rawProjects.map((p) => ({
        id: p.id,
        title: p.title,
        company_name: getCompanyName(p.clients),
        status: p.status,
        due_date: p.due_date,
        budget: p.budget,
        created_at: p.created_at,
      }));
      setAllProjects(formattedAllProjects);

      const formattedAllInvoices: AnalyticsInvoiceItem[] = rawInvoices.map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        company_name: getCompanyName(inv.clients),
        amount: inv.amount,
        status: inv.status,
        due_date: inv.due_date,
        created_at: inv.created_at,
      }));
      setAllInvoices(formattedAllInvoices);

      // Audit Log Activity Sorting for Projects
      const projectActionTimeMap = new Map<string, number>();
      const invoiceActionTimeMap = new Map<string, number>();

      for (const log of auditLogs) {
        const logTime = new Date(log.created_at).getTime();

        for (const proj of rawProjects) {
          if (!projectActionTimeMap.has(proj.id) && log.action.includes(proj.title)) {
            projectActionTimeMap.set(proj.id, logTime);
          }
        }

        for (const inv of rawInvoices) {
          if (!invoiceActionTimeMap.has(inv.id) && log.action.includes(inv.invoice_number)) {
            invoiceActionTimeMap.set(inv.id, logTime);
          }
        }
      }

      const sortedProjects = [...rawProjects].sort((a, b) => {
        const timeA = projectActionTimeMap.get(a.id) ?? new Date(a.created_at || 0).getTime();
        const timeB = projectActionTimeMap.get(b.id) ?? new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });

      setRecentProjects(
        sortedProjects.slice(0, 5).map((p) => ({
          id: p.id,
          title: p.title,
          company_name: getCompanyName(p.clients),
          status: p.status,
          due_date: p.due_date,
          budget: p.budget,
        }))
      );

      const sortedInvoices = [...rawInvoices].sort((a, b) => {
        const timeA = invoiceActionTimeMap.get(a.id) ?? new Date(a.created_at || 0).getTime();
        const timeB = invoiceActionTimeMap.get(b.id) ?? new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });

      setRecentInvoices(
        sortedInvoices.slice(0, 5).map((inv) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          company_name: getCompanyName(inv.clients),
          amount: inv.amount,
          status: inv.status,
          due_date: inv.due_date,
        }))
      );

      // DateTime Sorting for Upcoming Meetings
      const scheduledOnly = rawMeetings.filter((m) => m.status === "Scheduled");

      const sortedMeetings = [...scheduledOnly].sort((a, b) => {
        const dateTimeA = new Date(`${a.meeting_date}T${a.start_time || "00:00:00"}`).getTime();
        const dateTimeB = new Date(`${b.meeting_date}T${b.start_time || "00:00:00"}`).getTime();
        return dateTimeA - dateTimeB;
      });

      setUpcomingMeetings(
        sortedMeetings.slice(0, 5).map((m) => ({
          id: m.id,
          title: m.title,
          company_name: getCompanyName(m.clients),
          meeting_type: m.meeting_type,
          meeting_date: m.meeting_date,
          start_time: m.start_time,
          meeting_link: m.meeting_link,
          location: m.location,
        }))
      );
    } catch (err) {
      console.error("Error loading home dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, currentOrgId]);

  useEffect(() => {
    let ignore = false;

    async function init() {
      if (!ignore) {
        await fetchDashboardData();
      }
    }
    void init();

    if (!currentOrgId) return;

    const dashboardChannel = supabase
      .channel(`dashboard-realtime-${currentOrgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audit_logs",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (!ignore) void fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (!ignore) void fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (!ignore) void fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (!ignore) void fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetings",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (!ignore) void fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(dashboardChannel);
    };
  }, [fetchDashboardData, supabase, currentOrgId]);

  const roleConfig = ROLES[role] || ROLES.viewer;
  const canReadFinancials = canPerformAction(role, "invoices", "read");

  if (isLoading || roleLoading || orgLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs font-semibold">Loading workspace metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Welcome Greeting Banner */}
      <WelcomeBanner
        userName={userName}
        roleLabel={roleConfig.label}
        roleBadgeStyle={roleConfig.badgeStyle}
      />

      {/* 2. Top Metric Cards */}
      <MetricsOverview
        activeProjects={stats.activeProjects}
        totalProjects={stats.totalProjects}
        upcomingMeetings={stats.upcomingMeetings}
        totalMeetings={stats.totalMeetings}
        totalClients={stats.totalClients}
        activeClientsCount={stats.activeClientsCount}
        totalPaidRevenue={stats.totalPaidRevenue}
        totalInvoicedAmount={stats.totalInvoicedAmount}
        canReadFinancials={canReadFinancials}
      />

      {/* 3. Analytics Insights & XLSX Export */}
      <AnalyticsSummaryBar
        totalClients={stats.totalClients}
        projects={allProjects}
        invoices={allInvoices}
        canReadFinancials={canReadFinancials}
      />

      {/* 4. Graphical Visual Analytics */}
      <DashboardCharts
        projects={allProjects}
        invoices={allInvoices}
        canReadFinancials={canReadFinancials}
      />

      {/* 5. Operational Tables & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentProjectsTable projects={recentProjects} />
          <RecentInvoicesTable invoices={recentInvoices} />
        </div>

        <UpcomingMeetingsWidget
          meetings={upcomingMeetings}
          roleLabel={roleConfig.label}
        />
      </div>
    </div>
  );
}