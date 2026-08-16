"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from "lucide-react";

export interface ChartProjectItem {
  id: string;
  title: string;
  company_name: string;
  status: "Planning" | "In Progress" | "Review" | "Completed";
  due_date?: string;
  budget: number;
  created_at?: string;
}

export interface ChartInvoiceItem {
  id: string;
  invoice_number: string;
  company_name: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  due_date?: string;
  created_at?: string;
}

interface DashboardChartsProps {
  projects: ChartProjectItem[];
  invoices: ChartInvoiceItem[];
  canReadFinancials: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Completed: "#10B981", // Emerald
  "In Progress": "#F59E0B", // Amber
  Planning: "#6366F1", // Indigo
  Review: "#8B5CF6", // Purple
};

export default function DashboardCharts({
  projects,
  invoices,
  canReadFinancials,
}: DashboardChartsProps) {
  const parseRecordDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // 1. DYNAMIC LINE CHART: Monthly Cumulative Revenue vs Target
  const { lineChartData, momGrowth } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const totalCommittedBudget = projects
      .filter((p) => {
        const d = parseRecordDate(p.due_date) || parseRecordDate(p.created_at);
        return d && d.getFullYear() === currentYear;
      })
      .reduce((acc, p) => acc + (Number(p.budget) || 0), 0);

    const monthlyTargetPace = totalCommittedBudget > 0 ? totalCommittedBudget / 12 : 5000;

    let cumulativeRevenue = 0;
    const chartData = [];
    const monthlyPaidTotals: number[] = [];

    for (let i = 0; i <= currentMonthIndex; i++) {
      const monthlyPaidInvoices = invoices.filter((inv) => {
        if (inv.status !== "Paid") return false;
        const d = parseRecordDate(inv.due_date) || parseRecordDate(inv.created_at);
        if (!d) return false;
        return d.getFullYear() === currentYear && d.getMonth() === i;
      });

      const monthRevenue = monthlyPaidInvoices.reduce(
        (acc, inv) => acc + (Number(inv.amount) || 0),
        0
      );

      monthlyPaidTotals.push(monthRevenue);
      cumulativeRevenue += monthRevenue;

      chartData.push({
        month: monthNames[i],
        revenue: cumulativeRevenue,
        target: Math.round(monthlyTargetPace * (i + 1)),
      });
    }

    let growth: number | null = null;
    if (monthlyPaidTotals.length >= 2) {
      const currentMonthVal = monthlyPaidTotals[monthlyPaidTotals.length - 1];
      const prevMonthVal = monthlyPaidTotals[monthlyPaidTotals.length - 2];
      if (prevMonthVal > 0) {
        growth = Math.round(((currentMonthVal - prevMonthVal) / prevMonthVal) * 100);
      } else if (currentMonthVal > 0) {
        growth = 100;
      }
    }

    return { lineChartData: chartData, momGrowth: growth };
  }, [invoices, projects]);

  // 2. DYNAMIC PIE CHART: Project Health Status Distribution
  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      Completed: 0,
      "In Progress": 0,
      Planning: 0,
      Review: 0,
    };

    projects.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || "#94A3B8",
      }))
      .filter((item) => item.value > 0);
  }, [projects]);

  // 3. DYNAMIC BAR CHART: Stage-by-Stage Financial Allocation
  const stageFinancialData = useMemo(() => {
    const stages: Array<"Planning" | "In Progress" | "Review" | "Completed"> = [
      "Planning",
      "In Progress",
      "Review",
      "Completed",
    ];

    return stages.map((stage) => {
      const stageProjects = projects.filter((p) => p.status === stage);
      const totalBudget = stageProjects.reduce(
        (acc, p) => acc + Number(p.budget || 0),
        0
      );

      const stageClientNames = new Set(stageProjects.map((p) => p.company_name));
      const collectedRevenue = invoices
        .filter((inv) => inv.status === "Paid" && stageClientNames.has(inv.company_name))
        .reduce((acc, inv) => acc + Number(inv.amount || 0), 0);

      return {
        stage,
        budget: totalBudget,
        collected: collectedRevenue,
      };
    });
  }, [projects, invoices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Operational & Financial Visuals</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Dynamic Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart2 className="h-4 w-4 text-indigo-500" />
                <span>Revenue & Growth Pipeline ($)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Monthly cumulative paid revenue vs estimated target
              </p>
            </div>

            {canReadFinancials && momGrowth !== null ? (
              <span
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center space-x-0.5 ${
                  momGrowth >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                }`}
              >
                {momGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>
                  {momGrowth >= 0 ? `+${momGrowth}%` : `${momGrowth}%`} vs Last Month
                </span>
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                Active Year
              </span>
            )}
          </div>

          {canReadFinancials ? (
            <div className="h-64 w-full pt-2 [&_*:focus]:outline-none [&_*:focus-visible]:outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  {/* Subtle Grid Lines matching background */}
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    className="stroke-slate-200/70 dark:stroke-slate-800/60"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(val: number) => {
                      if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
                      if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
                      return `$${val}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "12px",
                      border: "1px solid #1e293b",
                      color: "#fff",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                    formatter={((value: number, name: string) => {
                      const isPaid = name === "Paid Revenue" || name === "revenue";
                      return [
                        `$${Number(value || 0).toLocaleString()}`,
                        isPaid ? "Paid Revenue" : "Target Pace",
                      ];
                    }) as unknown as React.ComponentProps<typeof Tooltip>["formatter"]}
                  />
                  {/* Solid Paid Revenue Line */}
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Paid Revenue"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#6366f1" }}
                    activeDot={{ r: 6 }}
                  />
                  {/* Subtle Target Dashed Line with Opacity */}
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target Pace"
                    className="stroke-slate-400/60 dark:stroke-slate-700/60"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40 rounded-xl text-xs text-slate-400 italic">
              Financial performance visuals restricted for your role.
            </div>
          )}
        </div>

        {/* 2. Dynamic Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <PieIcon className="h-4 w-4 text-indigo-500" />
              <span>Project Health Breakdown</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Distribution across status stages</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center [&_*:focus]:outline-none [&_*:focus-visible]:outline-none">
            {projectStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: "none" }} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "12px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={((value: number) => [`${value} Projects`, "Count"]) as unknown as React.ComponentProps<typeof Tooltip>["formatter"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 italic">No project data available</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {projectStatusData.map((st) => (
              <div key={st.name} className="flex items-center space-x-2 text-[11px]">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: st.color }}
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                  {st.name}:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{st.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bar Chart: Stage-by-Stage Financial Allocation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <span>Capital Distribution & Cash by Stage ($)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Total committed budget vs collected cash across project lifecycles
            </p>
          </div>
        </div>

        <div className="h-60 w-full pt-2 [&_*:focus]:outline-none [&_*:focus-visible]:outline-none">
          {stageFinancialData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageFinancialData} barGap={8}>
                {/* Subtle Grid Lines matching background */}
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  className="stroke-slate-200/70 dark:stroke-slate-800/60"
                />
                <XAxis
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(val: number) => {
                    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
                    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
                    return `$${val}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={((value: number, name: string) => [
                    `$${Number(value || 0).toLocaleString()}`,
                    name,
                  ]) as unknown as React.ComponentProps<typeof Tooltip>["formatter"]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
                />
                <Bar
                  dataKey="budget"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  name="Committed Budget"
                />
                <Bar
                  dataKey="collected"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  name="Collected Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
              No stage financial data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}