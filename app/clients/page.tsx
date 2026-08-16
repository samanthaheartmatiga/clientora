"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { logWorkspaceActivity } from "@/lib/audit";
import { Client } from "@/components/clients/types";
import ClientStats from "@/components/clients/ClientStats";
import ClientControls from "@/components/clients/ClientControls";
import ClientTable from "@/components/clients/ClientTable";
import ClientModal from "@/components/clients/ClientModal";

interface DbClientRecord {
  id: string;
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
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadClientsData() {
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*, projects(count)")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase Error:", error);
        } else if (isMounted && data) {
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
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadClientsData();

    const channel = supabase
      .channel("clients-realtime-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
        },
        () => {
          loadClientsData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          loadClientsData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

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

  const handleFormSubmit = async (formData: ClientMutationPayload) => {
    try {
      const payload: ClientMutationPayload = {
        company_name: formData.company_name,
        contact_email: formData.contact_email,
        status: formData.status,
      };

      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", editingClient.id);

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

        await logWorkspaceActivity(actionDesc);
      } else {
        const { error } = await supabase.from("clients").insert([payload]);

        if (error) {
          console.error("Failed to insert client:", error.message);
          return;
        }

        await logWorkspaceActivity(`Created Client: ${formData.company_name}`);
      }
    } catch (err) {
      console.error("Submit client error:", err);
    } finally {
      setIsModalOpen(false);
      setEditingClient(null);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const targetClient = clients.find((c) => c.id === id);

    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (!error) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      await logWorkspaceActivity(
        `Deleted Client: ${targetClient?.company_name || "Client Record"}`
      );
    } else {
      console.error("Failed to delete client:", error.message);
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
        onDelete={handleDeleteClient}
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
    </div>
  );
}