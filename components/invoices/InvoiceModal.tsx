"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Loader2,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { Invoice, ClientOption } from "./types";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/lib/permissions";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoice: Invoice | null;
  clientOptions: ClientOption[];
  nextInvoiceNumber?: string;
  onSubmit: (data: {
    client_id: string;
    invoice_number: string;
    amount: number;
    status: Invoice["status"];
    due_date: string;
  }) => Promise<void>;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function InvoiceModal({
  isOpen,
  onClose,
  editingInvoice,
  clientOptions,
  nextInvoiceNumber = "INV-0001",
  onSubmit,
}: InvoiceModalProps) {
  const { role, loading } = useUserRole();

  const [clientId, setClientId] = useState<string>(
    editingInvoice?.client_id || (clientOptions[0]?.id ?? "")
  );

  // Derived read-only invoice number
  const invoiceNumber = editingInvoice?.invoice_number || nextInvoiceNumber;

  const [amount, setAmount] = useState<string>(
    editingInvoice?.amount !== undefined && editingInvoice?.amount !== null
      ? String(editingInvoice.amount)
      : ""
  );
  const [status, setStatus] = useState<Invoice["status"]>(
    editingInvoice?.status || "Pending"
  );
  const [dueDate, setDueDate] = useState<string>(
    editingInvoice?.due_date || new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Custom Dropdown States
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const initialDateObj = useMemo(() => {
    const d = new Date(dueDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [dueDate]);

  const [calYear, setCalYear] = useState(initialDateObj.getFullYear());
  const [calMonth, setCalMonth] = useState(initialDateObj.getMonth());

  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const requiredAction = editingInvoice ? "update" : "create";
  const hasAccess = canPerformAction(role, "invoices", requiredAction);

  const selectedClient = clientOptions.find((c) => c.id === clientId);

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(calMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    setDueDate(`${calYear}-${mStr}-${dStr}`);
    setIsDatePickerOpen(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanedValue = value.replace(/^0+(?=\d)/, "");
    setAmount(cleanedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) return;

    const selectedClientId = clientId || clientOptions[0]?.id;
    if (!selectedClientId || !invoiceNumber) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        client_id: selectedClientId,
        invoice_number: invoiceNumber,
        amount: amount === "" ? 0 : Number(amount),
        status,
        due_date: dueDate,
      });
    } catch (err) {
      console.error("Error submitting invoice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { id: "Pending" as const, label: "Pending", icon: Clock },
    { id: "Paid" as const, label: "Paid", icon: CheckCircle2 },
    { id: "Overdue" as const, label: "Overdue", icon: AlertCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl dark:shadow-indigo-950/40 relative transition-colors duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate client billing records and set payment parameters.
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

        {!loading && !hasAccess && (
          <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>
              Permission Denied: Your role ({role}) cannot {editingInvoice ? "edit" : "create"} invoices.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Custom Themed Client Dropdown */}
          <div className="relative" ref={clientDropdownRef}>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Client Company
            </label>
            <button
              type="button"
              disabled={!hasAccess}
              onClick={() => {
                setIsClientDropdownOpen((prev) => !prev);
                setIsDatePickerOpen(false);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 flex items-center justify-between hover:border-indigo-500 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="truncate">
                {selectedClient?.company_name || "Select Client"}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 ml-1.5 transition-transform duration-150 ${isClientDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isClientDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-full max-h-52 overflow-y-auto p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {clientOptions.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No clients found
                  </div>
                ) : (
                  clientOptions.map((c) => {
                    const isSelected = c.id === clientId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClientId(c.id);
                          setIsClientDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs rounded-xl flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="truncate">{c.company_name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Invoice Number
              </label>
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <Lock className="h-3 w-3 inline" />
                <span>Auto-generated</span>
              </span>
            </div>
            <input
              type="text"
              readOnly
              value={invoiceNumber}
              className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-not-allowed select-none focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Amount ($)
              </label>
              <input
                type="number"
                min="0"
                disabled={!hasAccess}
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Compact Themed Date Picker Dropdown */}
            <div className="relative" ref={datePickerRef}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date
              </label>
              <button
                type="button"
                disabled={!hasAccess}
                onClick={() => {
                  setIsDatePickerOpen((prev) => !prev);
                  setIsClientDropdownOpen(false);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 flex items-center justify-between hover:border-indigo-500 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="truncate">{dueDate || "Select Date"}</span>
                <CalendarIcon className="h-4 w-4 text-indigo-500 shrink-0 ml-1" />
              </button>

              {isDatePickerOpen && (
                <div className="absolute right-0 bottom-full mb-2 z-50 w-56 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-0.5 text-center mt-1.5">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <span key={d} className="text-[9px] font-semibold text-slate-400">
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-5" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const mStr = String(calMonth + 1).padStart(2, "0");
                      const dStr = String(day).padStart(2, "0");
                      const dateFormatted = `${calYear}-${mStr}-${dStr}`;
                      const isSelected = dateFormatted === dueDate;

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleSelectDay(day)}
                          className={`h-5 w-5 mx-auto rounded-md text-[11px] font-medium flex items-center justify-center transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-600/30"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!hasAccess}
                    onClick={() => setStatus(opt.id)}
                    className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2.5 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasAccess || loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{editingInvoice ? "Save Changes" : "Create Invoice"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}