"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Loader2,
  FolderKanban,
  FileCode2,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Check,
} from "lucide-react";
import { Project, ClientOption } from "./types";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/lib/permissions";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject: Project | null;
  clientOptions: ClientOption[];
  onSubmit: (data: {
    client_id: string;
    title: string;
    status: Project["status"];
    budget: number;
    due_date: string;
  }) => Promise<void>;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ProjectModal({
  isOpen,
  onClose,
  editingProject,
  clientOptions,
  onSubmit,
}: ProjectModalProps) {
  const { role, loading } = useUserRole();

  const [title, setTitle] = useState<string>(editingProject?.title || "");
  const [clientId, setClientId] = useState<string>(
    editingProject?.client_id || (clientOptions[0]?.id ?? "")
  );
  const [status, setStatus] = useState<Project["status"]>(
    editingProject?.status || "Planning"
  );
  const [budget, setBudget] = useState<string>(
    editingProject?.budget !== undefined && editingProject?.budget !== null
      ? String(editingProject.budget)
      : ""
  );
  const [dueDate, setDueDate] = useState<string>(
    editingProject?.due_date || new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Custom Client Dropdown State
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Compact Calendar Dropdown State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const initialDateObj = useMemo(() => {
    const d = new Date(dueDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [dueDate]);

  const [calYear, setCalYear] = useState(initialDateObj.getFullYear());
  const [calMonth, setCalMonth] = useState(initialDateObj.getMonth());
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedClient = useMemo(
    () => clientOptions.find((c) => c.id === clientId),
    [clientOptions, clientId]
  );

  if (!isOpen) return null;

  const requiredAction = editingProject ? "update" : "create";
  const hasAccess = canPerformAction(role, "projects", requiredAction);

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

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanedValue = value.replace(/^0+(?=\d)/, "");
    setBudget(cleanedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) return;

    const selectedClientId = clientId || clientOptions[0]?.id;
    if (!title || !selectedClientId) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title,
        client_id: selectedClientId,
        status,
        budget: budget === "" ? 0 : Number(budget),
        due_date: dueDate,
      });
    } catch (error) {
      console.error("Error submitting project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { id: "Planning" as const, label: "Planning", icon: FileCode2 },
    { id: "In Progress" as const, label: "In Progress", icon: Clock },
    { id: "Review" as const, label: "Review", icon: Search },
    { id: "Completed" as const, label: "Completed", icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl dark:shadow-indigo-950/40 relative transition-colors duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {editingProject ? "Edit Project" : "Add New Project"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Set project title, client association, and deadlines.
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

        {/* Permission Warning Banner */}
        {!loading && !hasAccess && (
          <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>
              Permission Denied: Your role ({role}) cannot {editingProject ? "edit" : "create"} projects.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              required
              disabled={!hasAccess}
              placeholder="e.g. Website Redesign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          {/* Client Custom Themed Dropdown */}
          <div className="relative" ref={clientDropdownRef}>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Client
            </label>
            <button
              type="button"
              disabled={!hasAccess}
              onClick={() => setIsClientDropdownOpen((prev) => !prev)}
              className={`w-full bg-slate-50 dark:bg-slate-950/80 border rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isClientDropdownOpen
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-slate-200 dark:border-slate-800 hover:border-indigo-500/50"
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span
                  className={`truncate font-medium ${
                    selectedClient
                      ? "text-slate-900 dark:text-slate-200"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {selectedClient?.company_name || "Select Client"}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isClientDropdownOpen ? "rotate-180 text-indigo-500" : ""
                }`}
              />
            </button>

            {isClientDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl dark:shadow-indigo-950/50 max-h-52 overflow-y-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                {clientOptions.length === 0 ? (
                  <div className="py-3 px-3 text-center text-xs text-slate-400">
                    No clients available
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="truncate">{c.company_name}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Budget & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Budget ($)
              </label>
              <input
                type="number"
                min="0"
                disabled={!hasAccess}
                placeholder="0"
                value={budget}
                onChange={handleBudgetChange}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-600"
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
                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 flex items-center justify-between hover:border-indigo-500 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="truncate">{dueDate || "Select Date"}</span>
                <CalendarIcon className="h-4 w-4 text-indigo-500 shrink-0 ml-1" />
              </button>

              {isDatePickerOpen && (
                <div className="absolute right-0 bottom-full mb-2 z-50 w-56 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 backdrop-blur-xl scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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

          {/* Status Segmented Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!hasAccess}
                    onClick={() => setStatus(opt.id)}
                    className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{editingProject ? "Save Changes" : "Create Project"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}