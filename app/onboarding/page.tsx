"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { refreshOrganizations, switchOrganization } = useWorkspace();

  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate URL slug from company name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCompanyName(val);
    if (!isCustomSlug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustomSlug(true);
    setSlug(
      e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMsg("Please enter your organization or company name.");
      return;
    }

    const cleanSlug = slug.trim() || companyName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      // 1. Create the new Organization
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert([
          {
            name: companyName.trim(),
            slug: cleanSlug,
          },
        ])
        .select()
        .single();

      if (orgError) {
        if (orgError.code === "23505") {
          throw new Error("This workspace URL slug is already taken. Please try another.");
        }
        throw orgError;
      }

      // 2. Add creator as 'superadmin' / owner in organization_members
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert([
          {
            organization_id: newOrg.id,
            user_id: user.id,
            role: "superadmin",
          },
        ]);

      if (memberError) throw memberError;

      // 3. Refresh context and set active workspace
      await refreshOrganizations();
      switchOrganization(newOrg.id);

      // 4. Redirect to home dashboard
      router.push("/home");
    } catch (err: unknown) {
      console.error("Workspace creation failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to create workspace.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 rounded-2xl mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create Your Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set up your organization to manage clients, invoices, and projects with your team.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Company or Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hinata Global or Asta Tech"
              value={companyName}
              onChange={handleNameChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Workspace URL Identifier
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-500">
              <span className="shrink-0 text-slate-400">clientora.com/</span>
              <input
                type="text"
                required
                placeholder="company-slug"
                value={slug}
                onChange={handleSlugChange}
                className="w-full bg-transparent pl-1 font-semibold text-indigo-600 dark:text-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              You will be designated as the <strong>Workspace Superadmin</strong> with full management permissions over team members and billing.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Setting up workspace...</span>
              </>
            ) : (
              <>
                <span>Launch Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
          <span>Isolated multi-tenant database protection</span>
        </div>
      </div>
    </div>
  );
}