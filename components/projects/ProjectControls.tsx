"use client";

import React from "react";
import { Search, Filter } from "lucide-react";

interface ProjectControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export default function ProjectControls({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: ProjectControlsProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 shadow-sm dark:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-200">
      {/* Search Input */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search project or client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
      </div>

      {/* Filter Selector */}
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
        <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Planning">Planning</option>
          <option value="In Progress">In Progress</option>
          <option value="Review">Review</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
    </div>
  );
}