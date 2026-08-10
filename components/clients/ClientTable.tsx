"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  MoreVertical,
  CheckCircle2,
  Clock,
  Archive,
  Edit2,
  Trash2,
  Loader2,
  FolderKanban,
} from "lucide-react";
import { Client } from "./types";

interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export default function ClientTable({
  clients,
  loading,
  onEdit,
  onDelete,
}: ClientTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setActiveMenuId(null);
      }
    };

    if (activeMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenuId]);

  const getStatusBadge = (clientStatus: Client["status"]) => {
    switch (clientStatus) {
      case "Active":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Active</span>
          </span>
        );
      case "Lead":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            <span>Lead</span>
          </span>
        );
      case "Archived":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Archive className="h-3 w-3" />
            <span>Archived</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed min-w-175 text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5 w-[26%]">Company</th>
              <th className="px-5 py-3.5 w-[28%]">Contact Email</th>
              <th className="px-5 py-3.5 w-[14%]">Status</th>
              <th className="px-5 py-3.5 w-[12%]">Projects</th>
              <th className="px-5 py-3.5 w-[12%]">Created Date</th>
              <th className="px-5 py-3.5 w-[8%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                  <span>Loading clients data...</span>
                </td>
              </tr>
            ) : clients.length > 0 ? (
              clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-white truncate">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-semibold truncate">{client.company_name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 truncate">
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.contact_email}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">{getStatusBadge(client.status)}</td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/projects?search=${encodeURIComponent(client.company_name)}`}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 transition cursor-pointer"
                      title={`View projects for ${client.company_name}`}
                    >
                      <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                      <span>{client.project_count ?? 0}</span>
                    </Link>
                  </td>

                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {typeof client.created_at === "string"
                      ? client.created_at.split("T")[0]
                      : client.created_at}
                  </td>

                  <td className="px-5 py-4 text-right relative">
                    <button
                      onClick={() =>
                        setActiveMenuId(
                          activeMenuId === client.id ? null : client.id
                        )
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === client.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-28 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl p-0.5 text-left space-y-0.5"
                      >
                        <button
                          onClick={() => {
                            onEdit(client);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Edit2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            onDelete(client.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="h-3 w-3 shrink-0" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  No clients found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}