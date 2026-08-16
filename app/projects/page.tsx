"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { logWorkspaceActivity } from "@/lib/audit";
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
  due_date: string | null;
  created_at?: string;
  updated_at?: string;
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

  const fetchProjectsData = useCallback(async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name", { ascending: true });

      if (clientsError) {
        console.error("Error fetching client options:", clientsError.message);
      } else if (clientsData) {
        setClientOptions(clientsData as ClientOption[]);
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*, clients(company_name)")
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error("Error fetching projects:", projectsError.message);
      } else if (projectsData) {
        const formatted: Project[] = (
          projectsData as unknown as DbProjectRecord[]
        ).map((p) => ({
          id: p.id,
          client_id: p.client_id,
          company_name: p.clients?.company_name || "Unassigned",
          title: p.title,
          status: p.status,
          budget: Number(p.budget),
          due_date: p.due_date || "",
          created_at: p.created_at,
        }));
        setProjects(formatted);
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialize() {
      try {
        const { data: clientsData } = await supabase
          .from("clients")
          .select("id, company_name")
          .order("company_name", { ascending: true });

        const { data: projectsData } = await supabase
          .from("projects")
          .select("*, clients(company_name)")
          .order("created_at", { ascending: false });

        if (!ignore) {
          if (clientsData) setClientOptions(clientsData as ClientOption[]);
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
              due_date: p.due_date || "",
              created_at: p.created_at,
            }));
            setProjects(formatted);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Init projects error:", err);
          setLoading(false);
        }
      }
    }

    initialize();

    const channel = supabase
      .channel("realtime-projects-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          if (!ignore) fetchProjectsData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => {
          if (!ignore) fetchProjectsData();
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [fetchProjectsData]);

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
    if (!formData.client_id || formData.client_id.trim() === "") {
      console.error("Validation Error: Client is required.");
      return;
    }

    const formattedDueDate =
      formData.due_date && formData.due_date.trim() !== ""
        ? formData.due_date
        : null;

    const fallbackInvoiceDueDate =
      formattedDueDate || new Date().toISOString().split("T")[0];

    const nowIsoString = new Date().toISOString();

    try {
      if (editingProject) {
        const updatePayload = {
          client_id: formData.client_id,
          title: formData.title.trim(),
          status: formData.status,
          budget: Number(formData.budget) || 0,
          due_date: formattedDueDate,
          updated_at: nowIsoString,
        };

        const { error: updateError } = await supabase
          .from("projects")
          .update(updatePayload)
          .eq("id", editingProject.id);

        if (updateError) {
          console.error("Supabase error updating project:", updateError.message);
          return;
        }

        const { data: existingInvoices } = await supabase
          .from("invoices")
          .select("id")
          .eq("project_id", editingProject.id);

        if (existingInvoices && existingInvoices.length > 0) {
          await supabase
            .from("invoices")
            .update({
              client_id: updatePayload.client_id,
              amount: updatePayload.budget,
              due_date: fallbackInvoiceDueDate,
              updated_at: nowIsoString,
            })
            .eq("id", existingInvoices[0].id);
        } else if (updatePayload.budget > 0) {
          const nextInvNumber = await getNextInvoiceNumber(supabase);
          await supabase.from("invoices").insert([
            {
              project_id: editingProject.id,
              client_id: updatePayload.client_id,
              invoice_number: nextInvNumber,
              amount: updatePayload.budget,
              status: "Pending",
              due_date: fallbackInvoiceDueDate,
              updated_at: nowIsoString,
            },
          ]);
        }

        let actionDesc = `Updated Project: ${formData.title}`;
        if (editingProject.status !== formData.status) {
          actionDesc = `Updated Project: ${formData.title} (Status: ${editingProject.status} → ${formData.status})`;
        }
        await logWorkspaceActivity(actionDesc);
      } else {
        const insertPayload = {
          client_id: formData.client_id,
          title: formData.title.trim(),
          status: formData.status,
          budget: Number(formData.budget) || 0,
          due_date: formattedDueDate,
          updated_at: nowIsoString,
        };

        const { data: createdProject, error: insertError } = await supabase
          .from("projects")
          .insert([insertPayload])
          .select("id")
          .single();

        if (insertError) {
          console.error("Supabase error creating project:", insertError.message);
          return;
        }

        if (createdProject?.id && insertPayload.budget > 0) {
          try {
            const nextInvNumber = await getNextInvoiceNumber(supabase);
            const { error: invoiceError } = await supabase.from("invoices").insert([
              {
                project_id: createdProject.id,
                client_id: insertPayload.client_id,
                invoice_number: nextInvNumber,
                amount: insertPayload.budget,
                status: "Pending",
                due_date: fallbackInvoiceDueDate,
                updated_at: nowIsoString,
              },
            ]);

            if (invoiceError) {
              console.error("Error creating linked invoice:", invoiceError.message);
            }
          } catch (invErr) {
            console.error("Invoice generation error:", invErr);
          }
        }

        await logWorkspaceActivity(`Created Project: ${formData.title}`);
      }

      setIsModalOpen(false);
      await fetchProjectsData();
    } catch (err) {
      console.error("Submit project error:", err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const targetProject = projects.find((p) => p.id === id);

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (!error) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        await logWorkspaceActivity(
          `Deleted Project: ${targetProject?.title || "Project Record"}`
        );
      } else {
        console.error("Failed to delete project:", error.message);
      }
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  return (
    <div className="space-y-6">
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

      <ProjectStats projects={projects} />

      <ProjectControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <ProjectGrid
        projects={filteredProjects}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteProject}
      />

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