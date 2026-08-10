"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getNextInvoiceNumber } from "@/lib/invoices";
import { Project, ClientOption } from "@/components/projects/types";
import ProjectStats from "@/components/projects/ProjectStats";
import ProjectControls from "@/components/projects/ProjectControls";
import ProjectGrid from "@/components/projects/ProjectGrid";
import ProjectModal from "@/components/projects/ProjectModal";

interface DbProjectRecord {
  id: string;
  client_id: string;
  title: string;
  status: Project["status"];
  budget: number | string;
  due_date: string;
  created_at?: string;
  clients?: {
    company_name: string;
  } | null;
}

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, company_name")
          .order("company_name", { ascending: true });

        if (clientsError) {
          console.error("Error fetching client options:", clientsError.message);
        } else if (isMounted && clientsData) {
          setClientOptions(clientsData as ClientOption[]);
        }

        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*, clients(company_name)")
          .order("created_at", { ascending: false });

        if (projectsError) {
          console.error("Error fetching projects:", projectsError.message);
        } else if (isMounted && projectsData) {
          const formatted: Project[] = (
            projectsData as unknown as DbProjectRecord[]
          ).map((p) => ({
            id: p.id,
            client_id: p.client_id,
            company_name: p.clients?.company_name || "Unassigned",
            title: p.title,
            status: p.status,
            budget: Number(p.budget),
            due_date: p.due_date,
            created_at: p.created_at,
          }));
          setProjects(formatted);
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
      .channel("realtime-projects-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const refetchProjects = async () => {
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*, clients(company_name)")
      .order("created_at", { ascending: false });

    if (projectsData) {
      const formatted: Project[] = (
        projectsData as unknown as DbProjectRecord[]
      ).map((p) => ({
        id: p.id,
        client_id: p.client_id,
        company_name: p.clients?.company_name || "Unassigned",
        title: p.title,
        status: p.status,
        budget: Number(p.budget),
        due_date: p.due_date,
        created_at: p.created_at,
      }));
      setProjects(formatted);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.company_name &&
        project.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "All" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: {
    client_id: string;
    title: string;
    status: Project["status"];
    budget: number;
    due_date: string;
  }) => {
    const payload = {
      client_id: formData.client_id,
      title: formData.title,
      status: formData.status,
      budget: Number(formData.budget) || 0,
      due_date: formData.due_date || null,
    };

    if (editingProject) {
      // 1. Update existing project
      const { error: updateError } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", editingProject.id);

      if (updateError) {
        console.error("Supabase Error saving project:", updateError.message);
        return;
      }

      // 2. Sync linked Invoice row
      const { data: existingInvoices } = await supabase
        .from("invoices")
        .select("id")
        .eq("project_id", editingProject.id);

      if (existingInvoices && existingInvoices.length > 0) {
        await supabase
          .from("invoices")
          .update({
            client_id: payload.client_id,
            amount: payload.budget,
            due_date: payload.due_date,
          })
          .eq("id", existingInvoices[0].id);
      } else if (payload.budget > 0) {
        const nextInvNumber = await getNextInvoiceNumber(supabase);
        await supabase.from("invoices").insert([
          {
            project_id: editingProject.id,
            client_id: payload.client_id,
            invoice_number: nextInvNumber,
            amount: payload.budget,
            status: "Pending",
            due_date: payload.due_date,
          },
        ]);
      }
    } else {
      // 1. Create new project and select returned ID
      const { data: createdProject, error: insertError } = await supabase
        .from("projects")
        .insert([payload])
        .select("id")
        .single();

      if (insertError) {
        console.error("Supabase Error saving project:", insertError.message);
        return;
      }

      // 2. Automatically generate associated invoice with next sequential invoice number if budget > 0
      if (createdProject?.id && payload.budget > 0) {
        const nextInvNumber = await getNextInvoiceNumber(supabase);

        const { error: invoiceError } = await supabase.from("invoices").insert([
          {
            project_id: createdProject.id,
            client_id: payload.client_id,
            invoice_number: nextInvNumber,
            amount: payload.budget,
            status: "Pending",
            due_date: payload.due_date,
          },
        ]);

        if (invoiceError) {
          console.error("Error creating associated invoice:", invoiceError.message);
        }
      }
    }

    setIsModalOpen(false);
    await refetchProjects();
  };

  const handleDeleteProject = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Active Projects
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track active client deliverables, timelines, and financial allocations.
          </p>
        </div>
        <button
          suppressHydrationWarning
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Stats */}
      <ProjectStats projects={projects} />

      {/* Controls */}
      <ProjectControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Grid */}
      <ProjectGrid
        projects={filteredProjects}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteProject}
      />

      {/* Modal */}
      <ProjectModal
        key={editingProject ? editingProject.id : isModalOpen ? "open" : "closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProject={editingProject}
        clientOptions={clientOptions}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading projects...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}