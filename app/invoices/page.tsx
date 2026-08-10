"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getNextInvoiceNumber } from "@/lib/invoices";
import { Invoice, ClientOption } from "@/components/invoices/types";
import InvoiceStats from "@/components/invoices/InvoiceStats";
import InvoiceControls from "@/components/invoices/InvoiceControls";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import InvoiceModal from "@/components/invoices/InvoiceModal";

interface DbInvoiceRecord {
  id: string;
  client_id: string;
  project_id?: string | null;
  invoice_number: string;
  amount: number | string;
  status: Invoice["status"];
  due_date: string;
  created_at?: string;
  clients?: {
    company_name: string;
  } | null;
  projects?: {
    title: string;
  } | null;
}

function InvoicesContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [nextInvoiceNum, setNextInvoiceNum] = useState<string>("INV-0001");

  const refetchInvoices = useCallback(async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name", { ascending: true });

      if (clientsError) {
        console.error("Error fetching clients:", clientsError.message);
      } else if (clientsData) {
        setClientOptions(clientsData as ClientOption[]);
      }

      const { data: rawInvoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*, clients(company_name), projects(title)")
        .order("created_at", { ascending: false });

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError.message);
      } else if (rawInvoices) {
        const formatted: Invoice[] = (
          rawInvoices as unknown as DbInvoiceRecord[]
        ).map((inv) => ({
          id: inv.id,
          client_id: inv.client_id,
          project_id: inv.project_id,
          company_name: inv.clients?.company_name || "Unassigned",
          project_title: inv.projects?.title || undefined,
          invoice_number: inv.invoice_number,
          amount: Number(inv.amount),
          status: inv.status,
          due_date: inv.due_date,
          created_at: inv.created_at,
        }));
        setInvoices(formatted);
      }
    } catch (err) {
      console.error("Connection error:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, company_name")
          .order("company_name", { ascending: true });

        if (clientsError) {
          console.error("Error fetching clients:", clientsError.message);
        } else if (isMounted && clientsData) {
          setClientOptions(clientsData as ClientOption[]);
        }

        const { data: rawInvoices, error: invoicesError } = await supabase
          .from("invoices")
          .select("*, clients(company_name), projects(title)")
          .order("created_at", { ascending: false });

        if (invoicesError) {
          console.error("Error fetching invoices:", invoicesError.message);
        } else if (isMounted && rawInvoices) {
          const formatted: Invoice[] = (
            rawInvoices as unknown as DbInvoiceRecord[]
          ).map((inv) => ({
            id: inv.id,
            client_id: inv.client_id,
            project_id: inv.project_id,
            company_name: inv.clients?.company_name || "Unassigned",
            project_title: inv.projects?.title || undefined,
            invoice_number: inv.invoice_number,
            amount: Number(inv.amount),
            status: inv.status,
            due_date: inv.due_date,
            created_at: inv.created_at,
          }));
          setInvoices(formatted);
        }
      } catch (err) {
        console.error("Connection error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    const channel = supabase
      .channel("realtime-invoices-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => {
          if (isMounted) loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          if (isMounted) loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => {
          if (isMounted) loadData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.project_title &&
        inv.project_title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "All" || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = async () => {
    setEditingInvoice(null);
    const nextNum = await getNextInvoiceNumber(supabase);
    setNextInvoiceNum(nextNum);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: Invoice["status"]) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
    );

    const { error } = await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating invoice status:", error.message);
      await refetchInvoices();
    }
  };

  const handleFormSubmit = async (formData: {
    client_id: string;
    invoice_number: string;
    amount: number;
    status: Invoice["status"];
    due_date: string;
  }) => {
    let error;
    if (editingInvoice) {
      const updatePayload = {
        client_id: formData.client_id,
        amount: formData.amount,
        status: formData.status,
        due_date: formData.due_date || null,
      };
      const res = await supabase
        .from("invoices")
        .update(updatePayload)
        .eq("id", editingInvoice.id);
      error = res.error;
    } else {
      const insertPayload = {
        client_id: formData.client_id,
        invoice_number: formData.invoice_number,
        amount: formData.amount,
        status: formData.status,
        due_date: formData.due_date || null,
      };
      const res = await supabase.from("invoices").insert([insertPayload]);
      error = res.error;
    }

    if (error) {
      console.error("Supabase error saving invoice:", error.message);
    } else {
      setIsModalOpen(false);
      await refetchInvoices();
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor client billing history, pending payments, and revenue collection.
          </p>
        </div>
        <button
          suppressHydrationWarning
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      <InvoiceStats invoices={invoices} />

      <InvoiceControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <InvoiceTable
        invoices={filteredInvoices}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteInvoice}
        onStatusChange={handleStatusChange}
      />

      <InvoiceModal
        key={editingInvoice ? editingInvoice.id : isModalOpen ? "open" : "closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingInvoice={editingInvoice}
        clientOptions={clientOptions}
        nextInvoiceNumber={nextInvoiceNum}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading invoices...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}