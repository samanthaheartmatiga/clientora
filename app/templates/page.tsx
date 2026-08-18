"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { logWorkspaceActivity } from "@/lib/audit";
import { Template } from "@/components/templates/types";
import TemplateGuide from "@/components/templates/TemplateGuide";
import TemplateControls from "@/components/templates/TemplateControls";
import TemplateGrid from "@/components/templates/TemplateGrid";
import TemplateModal from "@/components/templates/TemplateModal";

function TemplatesContent() {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg } = useWorkspace();
  const currentOrgId = currentOrg?.id;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const refetchTemplates = useCallback(async () => {
    if (!currentOrgId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("organization_id", currentOrgId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching templates:", error.message);
      } else if (data) {
        setTemplates(data as Template[]);
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentOrgId]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (isMounted) {
        await refetchTemplates();
      }
    }
    void loadData();

    if (!currentOrgId) return;

    const channel = supabase
      .channel(`realtime-templates-sync-${currentOrgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "templates",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (isMounted) void refetchTemplates();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [refetchTemplates, supabase, currentOrgId]);

  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpl.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tpl.description &&
        tpl.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      categoryFilter === "All" || tpl.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tpl: Template) => {
    setEditingTemplate(tpl);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: {
    title: string;
    category: Template["category"];
    description: string;
    file_url: string;
    file_name: string;
    file_size?: number | null;
  }) => {
    if (!currentOrgId) return;
    let error;

    if (editingTemplate) {
      const res = await supabase
        .from("templates")
        .update(formData)
        .eq("id", editingTemplate.id)
        .eq("organization_id", currentOrgId);
      error = res.error;

      if (!error) {
        await logWorkspaceActivity(`Updated Template: ${formData.title}`, currentOrgId);
      }
    } else {
      const res = await supabase
        .from("templates")
        .insert([{ ...formData, organization_id: currentOrgId }]);
      error = res.error;

      if (!error) {
        await logWorkspaceActivity(
          `Uploaded Template: ${formData.title} (${formData.category})`,
          currentOrgId
        );
      }
    }

    if (error) {
      console.error("Supabase error saving template:", error.message);
    } else {
      setIsModalOpen(false);
      await refetchTemplates();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!currentOrgId) return;
    const targetTemplate = templates.find((t) => t.id === id);

    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", id)
      .eq("organization_id", currentOrgId);

    if (!error) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      await logWorkspaceActivity(
        `Deleted Template: ${targetTemplate?.title || "Template"}`,
        currentOrgId
      );
    } else {
      console.error("Error deleting template:", error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Document Templates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Store and download reusable Word docs, contract files, and client onboarding materials for{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {currentOrg?.name || "current workspace"}
            </span>.
          </p>
        </div>
        <button
          suppressHydrationWarning
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Template</span>
        </button>
      </div>

      <TemplateGuide />

      <TemplateControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />

      <TemplateGrid
        templates={filteredTemplates}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteTemplate}
      />

      <TemplateModal
        key={editingTemplate ? editingTemplate.id : isModalOpen ? "open" : "closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTemplate={editingTemplate}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading templates...</div>}>
      <TemplatesContent />
    </Suspense>
  );
}