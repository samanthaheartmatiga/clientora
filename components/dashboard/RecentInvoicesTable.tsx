"use client";

import React from "react";
import Link from "next/link";
import { CreditCard, ArrowUpRight } from "lucide-react";

export interface InvoiceSummary {
  id: string;
  invoice_number: string;
  company_name: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  due_date: string;
}

interface RecentInvoicesTableProps {
  invoices: InvoiceSummary[];
}

export default function RecentInvoicesTable({ invoices }: RecentInvoicesTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-emerald-500" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Recent Invoices
          </h2>
        </div>
        <Link
          href="/invoices"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
        >
          <span>Manage Invoices</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-x-auto">
        {invoices.length === 0 ? (
          <p className="p-4 text-center text-xs text-slate-400">
            No billing history recorded yet.
          </p>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition px-1 rounded-xl"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {inv.invoice_number}
                  </span>
                  <span className="text-[11px] text-slate-400">• {inv.company_name}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "N/A"}
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  ${inv.amount.toLocaleString()}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                    inv.status === "Paid"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : inv.status === "Pending"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}