"use client";

import React from "react";
import { FileText, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { Invoice } from "./types";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/lib/permissions";

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: Invoice["status"]) => void;
}

export default function InvoiceTable({
  invoices,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
}: InvoiceTableProps) {
  const { role } = useUserRole();

  const handleStatusChange = (id: string, newStatus: Invoice["status"]) => {
    if (!canPerformAction(role, "invoices", "update")) return;
    onStatusChange(id, newStatus);
  };

  const handleDelete = (id: string) => {
    if (!canPerformAction(role, "invoices", "delete")) return;
    onDelete(id);
  };

  const canEdit = canPerformAction(role, "invoices", "update");
  const canDelete = canPerformAction(role, "invoices", "delete");
  const hasActions = canEdit || canDelete;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold">
            <tr>
              <th className="px-5 py-3.5">Invoice #</th>
              <th className="px-5 py-3.5">Client Company</th>
              <th className="px-5 py-3.5">Amount</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Due Date</th>
              {hasActions && <th className="px-5 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={hasActions ? 6 : 5} className="px-5 py-8 text-center text-slate-400">
                  Loading invoices database...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={hasActions ? 6 : 5} className="px-5 py-8 text-center text-slate-400">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                >
                  <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>{inv.invoice_number}</span>
                  </td>
                  <td className="px-5 py-3.5 font-medium">
                    <div>{inv.company_name}</div>
                    {inv.project_title && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        Project: {inv.project_title}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                    ${inv.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        inv.status === "Paid"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : inv.status === "Pending"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "N/A"}
                  </td>

                  {hasActions && (
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {inv.status !== "Paid" && (
                        <PermissionGuard module="invoices" action="update">
                          <button
                            title="Mark as Paid"
                            suppressHydrationWarning
                            onClick={() => handleStatusChange(inv.id, "Paid")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                      )}

                      <PermissionGuard module="invoices" action="update">
                        <button
                          title="Edit Invoice"
                          suppressHydrationWarning
                          onClick={() => onEdit(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </PermissionGuard>

                      <PermissionGuard module="invoices" action="delete">
                        <button
                          title="Delete Invoice"
                          suppressHydrationWarning
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}