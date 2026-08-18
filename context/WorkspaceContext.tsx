"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/app/supabase/client";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface WorkspaceContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserOrgs = useCallback(async (): Promise<Organization[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setOrganizations([]);
        setCurrentOrg(null);
        return [];
      }

      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          role,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching organizations:", error.message);
        return [];
      }

      interface OrgMemberRow {
        role: string;
        organizations: { id: string; name: string; slug: string } | null;
      }

      const rawRows = (data || []) as unknown as OrgMemberRow[];
      const orgList: Organization[] = rawRows
        .filter((row) => row.organizations !== null)
        .map((row) => ({
          id: row.organizations!.id,
          name: row.organizations!.name,
          slug: row.organizations!.slug,
          role: row.role,
        }));

      setOrganizations(orgList);

      if (orgList.length > 0) {
        const savedOrgId =
          typeof window !== "undefined"
            ? localStorage.getItem("active_org_id") || localStorage.getItem("current_workspace_id")
            : null;

        const matchingOrg = orgList.find((o) => o.id === savedOrgId) || orgList[0];
        setCurrentOrg(matchingOrg);

        if (typeof window !== "undefined") {
          localStorage.setItem("active_org_id", matchingOrg.id);
          localStorage.setItem("current_workspace_id", matchingOrg.id);
        }
      } else {
        setCurrentOrg(null);
      }

      return orgList;
    } catch (err) {
      console.error("Failed to load workspace context:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await fetchUserOrgs();
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchUserOrgs]);

  const switchOrganization = async (orgId: string) => {
    let targetList = organizations;

    // If org isn't in state yet (e.g. freshly joined), refresh list first
    let selected = targetList.find((o) => o.id === orgId);
    if (!selected) {
      targetList = await fetchUserOrgs();
      selected = targetList.find((o) => o.id === orgId);
    }

    if (selected) {
      setCurrentOrg(selected);
      if (typeof window !== "undefined") {
        localStorage.setItem("active_org_id", selected.id);
        localStorage.setItem("current_workspace_id", selected.id);
      }
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentOrg,
        organizations,
        isLoading,
        switchOrganization,
        refreshOrganizations: async () => {
          await fetchUserOrgs();
        },
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}