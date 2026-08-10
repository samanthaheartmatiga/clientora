"use client";

import React from "react";
import { DollarSign, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Invoice } from "./types";

interface InvoiceStatsProps {
  invoices: Invoice[];
}

export default function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const paidTotal = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const pendingTotal = invoices
    .filter((inv) => inv.status === "Pending")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const overdueTotal = invoices
    .filter((inv) => inv.status === "Overdue")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Total Revenue
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            ${totalInvoiced.toLocaleString()}
          </p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <DollarSign className="h-4 w-4" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Paid Collected
          </p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            ${paidTotal.toLocaleString()}
          </p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Pending Collections
          </p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            ${pendingTotal.toLocaleString()}
          </p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Clock className="h-4 w-4" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Overdue Balance
          </p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            ${overdueTotal.toLocaleString()}
          </p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}