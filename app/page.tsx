"use client";

import React from "react";
import { Users, FolderKanban, DollarSign, Clock } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Overview of your clients, active projects, and financial pipeline.</p>
        </div>
      </div>

      {/* Responsive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Clients" value="24" change="12%" isPositive={true} icon={Users} />
        <MetricCard title="Active Projects" value="8" change="5%" isPositive={true} icon={FolderKanban} />
        <MetricCard title="Total Revenue" value="$42,800" change="18%" isPositive={true} icon={DollarSign} />
        <MetricCard title="Pending Invoices" value="$9,400" change="3%" isPositive={false} icon={Clock} />
      </div>
    </div>
  );
}