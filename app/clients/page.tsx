"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { logWorkspaceActivity } from "@/lib/audit";
import { Client } from "@/components/clients/types";
import ClientStats from "@/components/clients/ClientStats";
import ClientControls from "@/components/clients/ClientControls";
import ClientTable from "@/components/clients/ClientTable";
import ClientModal from "@/components/clients/ClientModal";

interface DbClientRecord {
  id: string;
  organization_id?: string | null;
  company_name: string;
  contact_email: string;
  status: Client["status"];
  created_at: string;
  projects?: { count: number }[];
}

interface ClientMutationPayload {
  company_name: string;
  contact_email: string;
  status: "Active" | "Lead" | "Archived";
  organization_id?: string | null;
}

export default function ClientsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg } = useWorkspace();
  const currentOrgId = currentOrg?.id;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // State for on-theme Centered Delete Modal
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadClientsData = useCallback(async () => {
    if (!currentOrgId) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*, projects(count)")
        .eq("organization_id", currentOrgId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error fetching clients:", error.message);
      } else if (data) {
        const formattedClients: Client[] = (
          data as unknown as DbClientRecord[]
        ).map((client) => ({
          id: client.id,
          company_name: client.company_name,
          contact_email: client.contact_email,
          status: client.status,
          created_at: client.created_at,
          project_count: client.projects?.[0]?.count ?? 0,
        }));
        setClients(formattedClients);
      }
    } catch (err) {
      console.error("Connection Error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentOrgId]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (isMounted) {
        await loadClientsData();
      }
    }
    void init();

    if (!currentOrgId) return;

    const channel = supabase
      .channel(`clients-realtime-${currentOrgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (isMounted) void loadClientsData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (isMounted) void loadClientsData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [loadClientsData, supabase, currentOrgId]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: {
    company_name: string;
    contact_email: string;
    status: "Active" | "Lead" | "Archived";
  }) => {
    if (!currentOrgId) return;

    try {
      if (editingClient) {
        const updatePayload: Partial<ClientMutationPayload> = {
          company_name: formData.company_name,
          contact_email: formData.contact_email,
          status: formData.status,
        };

        const { error } = await supabase
          .from("clients")
          .update(updatePayload)
          .eq("id", editingClient.id)
          .eq("organization_id", currentOrgId);

        if (error) {
          console.error("Failed to update client:", error.message);
          return;
        }

        let actionDesc = `Updated Client: ${formData.company_name}`;
        if (editingClient.status !== formData.status) {
          actionDesc = `Updated Client: ${formData.company_name} (Status: ${editingClient.status} → ${formData.status})`;
        } else if (editingClient.company_name !== formData.company_name) {
          actionDesc = `Updated Client: ${editingClient.company_name} → ${formData.company_name}`;
        }

        await logWorkspaceActivity(actionDesc, currentOrgId);
      } else {
        const insertPayload: ClientMutationPayload = {
          company_name: formData.company_name,
          contact_email: formData.contact_email,
          status: formData.status,
          organization_id: currentOrgId,
        };

        const { error } = await supabase.from("clients").insert([insertPayload]);

        if (error) {
          console.error("Failed to insert client:", error.message);
          return;
        }

        await logWorkspaceActivity(`Created Client: ${formData.company_name}`, currentOrgId);
      }

      await loadClientsData();
    } catch (err) {
      console.error("Submit client error:", err);
    } finally {
      setIsModalOpen(false);
      setEditingClient(null);
    }
  };

  // Open the centered confirmation modal
  const handleInitiateDelete = (id: string) => {
    const target = clients.find((c) => c.id === id);
    if (target) {
      setClientToDelete(target);
    }
  };

  // Confirm and execute the delete action
  const handleConfirmDelete = async () => {
    if (!currentOrgId || !clientToDelete) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientToDelete.id)
        .eq("organization_id", currentOrgId);

      if (!error) {
        setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
        await logWorkspaceActivity(
          `Deleted Client: ${clientToDelete.company_name || "Client Record"}`,
          currentOrgId
        );
      } else {
        console.error("Failed to delete client:", error.message);
      }
    } catch (err) {
      console.error("Error during deletion:", err);
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Clients Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage client accounts, corporate contacts, and relationship statuses.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      <ClientStats clients={clients} />

      <ClientControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <ClientTable
        clients={filteredClients}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleInitiateDelete}
      />

      <ClientModal
        key={editingClient ? editingClient.id : isModalOpen ? "open" : "closed"}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        editingClient={editingClient}
        onSubmit={handleFormSubmit}
      />

      {/* THEMED CENTERED CONFIRMATION MODAL (MOBILE & DESKTOP CENTERED) */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6 text-center space-y-4 mx-auto my-auto transform transition-all scale-100">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Client
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                Are you sure you want to delete{" "}
                <strong className="text-slate-800 dark:text-slate-200 wrap-break-words">
                  {clientToDelete.company_name}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setClientToDelete(null)}
                className="w-full py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-full py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 text-white shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}