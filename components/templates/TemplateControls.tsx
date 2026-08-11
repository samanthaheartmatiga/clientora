"use client";

import React from "react";
import { Search } from "lucide-react";

interface TemplateControlsProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
}

export default function TemplateControls({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
}: TemplateControlsProps) {
  const categories = ["All", "Proposal", "Contract", "Invoice", "Email", "Scope"];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          suppressHydrationWarning
          placeholder="Search templates or documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
      </div>

      <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => (
          <button
            key={cat}
            suppressHydrationWarning
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
              categoryFilter === cat
                ? "bg-indigo-600/10 border border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}