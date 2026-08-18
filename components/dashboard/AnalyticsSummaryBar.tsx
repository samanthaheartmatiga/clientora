"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  DollarSign,
  Minus,
} from "lucide-react";
import ExcelJS from "exceljs";

export interface AnalyticsProjectItem {
  id: string;
  title: string;
  company_name: string;
  status: "Planning" | "In Progress" | "Review" | "Completed";
  due_date: string;
  budget: number;
  created_at?: string;
}

export interface AnalyticsInvoiceItem {
  id: string;
  invoice_number: string;
  company_name: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  due_date: string;
  created_at?: string;
}

interface AnalyticsSummaryBarProps {
  totalClients: number;
  projects: AnalyticsProjectItem[];
  invoices: AnalyticsInvoiceItem[];
  canReadFinancials: boolean;
}

export default function AnalyticsSummaryBar({
  totalClients,
  projects,
  invoices,
  canReadFinancials,
}: AnalyticsSummaryBarProps) {
  const [selectedRange, setSelectedRange] = useState<"7D" | "30D" | "90D" | "YTD">("30D");

  const parseRecordDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;
    let priorPeriodStart: Date;
    let priorPeriodEnd: Date;

    if (selectedRange === "7D") {
      const windowMs = 7 * 24 * 60 * 60 * 1000;
      currentPeriodStart = new Date(endOfToday.getTime() - windowMs);
      currentPeriodEnd = endOfToday;
      priorPeriodStart = new Date(endOfToday.getTime() - windowMs * 2);
      priorPeriodEnd = currentPeriodStart;
    } else if (selectedRange === "30D") {
      const windowMs = 30 * 24 * 60 * 60 * 1000;
      currentPeriodStart = new Date(endOfToday.getTime() - windowMs);
      currentPeriodEnd = endOfToday;
      priorPeriodStart = new Date(endOfToday.getTime() - windowMs * 2);
      priorPeriodEnd = currentPeriodStart;
    } else if (selectedRange === "90D") {
      const windowMs = 90 * 24 * 60 * 60 * 1000;
      currentPeriodStart = new Date(endOfToday.getTime() - windowMs);
      currentPeriodEnd = endOfToday;
      priorPeriodStart = new Date(endOfToday.getTime() - windowMs * 2);
      priorPeriodEnd = currentPeriodStart;
    } else {
      currentPeriodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      currentPeriodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      priorPeriodStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      priorPeriodEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    }

    const currentInvoices = invoices.filter((inv) => {
      const d = parseRecordDate(inv.due_date) || parseRecordDate(inv.created_at);
      if (!d) return false;
      return d >= currentPeriodStart && d <= currentPeriodEnd;
    });

    const currentProjects = projects.filter((p) => {
      const d = parseRecordDate(p.due_date) || parseRecordDate(p.created_at);
      if (!d) return false;
      return d >= currentPeriodStart && d <= currentPeriodEnd;
    });

    const priorInvoices = invoices.filter((inv) => {
      const d = parseRecordDate(inv.due_date) || parseRecordDate(inv.created_at);
      if (!d) return false;
      return d >= priorPeriodStart && d < priorPeriodEnd;
    });

    const currentPaidRevenue = currentInvoices
      .filter((i) => i.status === "Paid")
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

    const priorPaidRevenue = priorInvoices
      .filter((i) => i.status === "Paid")
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

    const currentActiveProjects = currentProjects.filter(
      (p) => p.status === "In Progress" || p.status === "Planning"
    ).length;

    const totalProjectBudgets = currentProjects.reduce(
      (acc, p) => acc + (Number(p.budget) || 0),
      0
    );

    const windowClientSet = new Set([
      ...currentProjects.map((p) => p.company_name),
      ...currentInvoices.map((i) => i.company_name),
    ]);
    const windowClientCount = windowClientSet.size || (totalClients > 0 ? totalClients : 1);

    const arpu = Math.round(currentPaidRevenue / windowClientCount);
    const workloadDensity = (currentActiveProjects / windowClientCount).toFixed(1);
    const targetPace =
      totalProjectBudgets > 0
        ? Math.min(Math.round((currentPaidRevenue / totalProjectBudgets) * 100), 100)
        : currentPaidRevenue > 0
        ? 100
        : 0;

    let growthRate: number | null = null;
    if (priorPaidRevenue > 0) {
      growthRate = Math.round(((currentPaidRevenue - priorPaidRevenue) / priorPaidRevenue) * 100);
    } else if (currentPaidRevenue > 0 && priorPaidRevenue === 0) {
      growthRate = 100;
    }

    return {
      currentInvoices,
      currentProjects,
      currentPaidRevenue,
      currentActiveProjects,
      totalProjectBudgets,
      windowClientCount,
      arpu,
      workloadDensity,
      targetPace,
      growthRate,
    };
  }, [selectedRange, invoices, projects, totalClients]);

  const handleExportNativeExcel = async () => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const fileName = `Clientora_Analytics_Report_${selectedRange}_${dateStr}_${timeStr}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Analytics Report", {
      views: [{ showGridLines: true }],
    });

    worksheet.columns = [
      { width: 34 },
      { width: 26 },
      { width: 22 },
      { width: 22 },
      { width: 28 },
    ];

    const styleRow = (
      rowNumber: number,
      bgColor: string,
      textColor: string,
      isBold = false,
      fontSize = 11
    ) => {
      const row = worksheet.getRow(rowNumber);
      row.height = 26;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgColor },
        };
        cell.font = {
          name: "Segoe UI",
          size: fontSize,
          bold: isBold,
          color: { argb: textColor },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin", color: { argb: "D1D5DB" } },
          left: { style: "thin", color: { argb: "D1D5DB" } },
          bottom: { style: "thin", color: { argb: "D1D5DB" } },
          right: { style: "thin", color: { argb: "D1D5DB" } },
        };
      });
    };

    let cursor = 1;

    worksheet.mergeCells(`A${cursor}:E${cursor}`);
    worksheet.getRow(cursor).getCell(1).value = "CLIENTORA WORKSPACE ANALYTICS REPORT";
    worksheet.getRow(cursor).height = 36;
    styleRow(cursor, "FF312E81", "FFFFFFFF", true, 13);
    cursor++;

    worksheet.mergeCells(`D${cursor}:E${cursor}`);
    worksheet.getRow(cursor).values = [
      "Generated Date",
      `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      "Time Window Filter",
      selectedRange === "YTD" ? "YTD (2026 Full Scope)" : selectedRange,
    ];
    styleRow(cursor, "FFF8FAFC", "FF1E293B", false, 10);
    worksheet.getRow(cursor).getCell(1).font = { name: "Segoe UI", bold: true, color: { argb: "FF312E81" } };
    worksheet.getRow(cursor).getCell(3).font = { name: "Segoe UI", bold: true, color: { argb: "FF312E81" } };
    cursor++;

    worksheet.addRow([]);
    cursor++;

    worksheet.mergeCells(`A${cursor}:E${cursor}`);
    worksheet.getRow(cursor).getCell(1).value = "1. EXECUTIVE KEY PERFORMANCE RATIOS";
    styleRow(cursor, "FF4F46E5", "FFFFFFFF", true, 11);
    cursor++;

    worksheet.mergeCells(`D${cursor}:E${cursor}`);
    worksheet.getRow(cursor).values = ["Metric Name", "Calculated Value", "Period Filter", "Benchmark Context"];
    styleRow(cursor, "FFEEF2FF", "FF3730A3", true, 11);
    cursor++;

    const kpiRows = [
      ["Active Clients in Scope", filteredData.windowClientCount, selectedRange, "Clients Active in Window"],
      [
        "Period Collected Revenue",
        canReadFinancials ? `$${filteredData.currentPaidRevenue.toLocaleString()}` : "Restricted",
        selectedRange,
        "Paid Invoices in Window",
      ],
      [
        "Avg Revenue Per Client (ARPU)",
        canReadFinancials ? `$${filteredData.arpu.toLocaleString()}` : "Restricted",
        selectedRange,
        "Revenue / Window Clients",
      ],
      ["Active Projects Load", filteredData.currentActiveProjects, selectedRange, "Planning & In-Progress"],
      ["Workload Density", `${filteredData.workloadDensity} projs/client`, selectedRange, "Capacity Metric"],
      ["Target Pace", `${filteredData.targetPace}%`, selectedRange, "Budget Realization Rate"],
      [
        "Period-over-Period Growth",
        filteredData.growthRate !== null ? `${filteredData.growthRate}%` : "Baseline N/A",
        selectedRange,
        "Vs Prior Equal Period",
      ],
    ];

    kpiRows.forEach((r) => {
      worksheet.mergeCells(`D${cursor}:E${cursor}`);
      worksheet.getRow(cursor).values = r;
      styleRow(cursor, "FFFFFFFF", "FF0F172A", false, 11);
      cursor++;
    });

    worksheet.addRow([]);
    cursor++;

    worksheet.mergeCells(`A${cursor}:E${cursor}`);
    worksheet.getRow(cursor).getCell(1).value = `2. PROJECT DELIVERABLES REGISTER (${selectedRange} FILTERED)`;
    styleRow(cursor, "FF4F46E5", "FFFFFFFF", true, 11);
    cursor++;

    worksheet.getRow(cursor).values = [
      "Project Title",
      "Client Name",
      "Status",
      "Due Date",
      "Budget Allocation",
    ];
    styleRow(cursor, "FFEEF2FF", "FF3730A3", true, 11);
    cursor++;

    if (filteredData.currentProjects.length > 0) {
      filteredData.currentProjects.forEach((p) => {
        worksheet.getRow(cursor).values = [
          p.title,
          p.company_name,
          p.status,
          p.due_date || "N/A",
          `$${Number(p.budget || 0).toLocaleString()}`,
        ];
        styleRow(cursor, "FFFFFFFF", "FF0F172A", false, 11);
        cursor++;
      });
    } else {
      worksheet.mergeCells(`A${cursor}:E${cursor}`);
      worksheet.getRow(cursor).getCell(1).value = `No projects dated within the selected ${selectedRange} window.`;
      styleRow(cursor, "FFFFFFFF", "FF94A3B8", false, 11);
      cursor++;
    }

    worksheet.addRow([]);
    cursor++;

    worksheet.mergeCells(`A${cursor}:E${cursor}`);
    worksheet.getRow(cursor).getCell(1).value = `3. BILLING & INVOICING REGISTER (${selectedRange} FILTERED)`;
    styleRow(cursor, "FF4F46E5", "FFFFFFFF", true, 11);
    cursor++;

    worksheet.getRow(cursor).values = [
      "Invoice Number",
      "Client Name",
      "Payment Status",
      "Due Date",
      "Invoice Amount",
    ];
    styleRow(cursor, "FFEEF2FF", "FF3730A3", true, 11);
    cursor++;

    if (canReadFinancials) {
      if (filteredData.currentInvoices.length > 0) {
        filteredData.currentInvoices.forEach((inv) => {
          worksheet.getRow(cursor).values = [
            inv.invoice_number,
            inv.company_name,
            inv.status,
            inv.due_date || "N/A",
            `$${Number(inv.amount || 0).toLocaleString()}`,
          ];
          const isPaid = inv.status === "Paid";
          styleRow(
            cursor,
            isPaid ? "FFECFDF5" : "FFFFFBEB",
            isPaid ? "FF065F46" : "FF92400E",
            false,
            11
          );
          cursor++;
        });
      } else {
        worksheet.mergeCells(`A${cursor}:E${cursor}`);
        worksheet.getRow(cursor).getCell(1).value = `No invoices dated within the selected ${selectedRange} window.`;
        styleRow(cursor, "FFFFFFFF", "FF94A3B8", false, 11);
        cursor++;
      }
    } else {
      worksheet.mergeCells(`A${cursor}:E${cursor}`);
      worksheet.getRow(cursor).getCell(1).value =
        "Financial invoice records restricted for your access scope.";
      styleRow(cursor, "FFFFFFFF", "FF94A3B8", false, 11);
      cursor++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
      {/* 1. Live Derived Ratios */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs w-full md:w-auto">
        {canReadFinancials && (
          <div className="flex items-center space-x-1.5 sm:space-x-2 pr-3 sm:pr-4 border-r border-slate-200 dark:border-slate-800">
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400">ARPU:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              ${filteredData.arpu.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex items-center space-x-1.5 sm:space-x-2 pr-3 sm:pr-4 border-r border-slate-200 dark:border-slate-800">
          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400">Workload:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {filteredData.workloadDensity}{" "}
            <span className="font-normal text-[10px] text-slate-400">proj/client</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400">Target Pace:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {filteredData.targetPace}%
          </span>

          {filteredData.growthRate !== null ? (
            <span
              className={`text-[10px] font-semibold flex items-center ${
                filteredData.growthRate >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {filteredData.growthRate >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {filteredData.growthRate >= 0
                ? `+${filteredData.growthRate}%`
                : `${filteredData.growthRate}%`}{" "}
              PoP
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 flex items-center">
              <Minus className="h-3 w-3" /> Baseline
            </span>
          )}
        </div>
      </div>

      {/* 2. Live Slicers & Styled Native Excel Export Button (Tightened for mobile screens) */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 self-end md:self-auto w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
        <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs">
          {(["7D", "30D", "90D", "YTD"] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setSelectedRange(period)}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                selectedRange === period
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExportNativeExcel}
          className="inline-flex items-center space-x-1 sm:space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          title="Export Analytics Report to Excel"
        >
          <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
}