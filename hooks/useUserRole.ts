"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { AppRole } from "@/lib/permissions";

export function useUserRole() {
  const supabase = useMemo(() => createClient(), []);
  const { currentOrg } = useWorkspace();
  const currentOrgId = currentOrg?.id;

  const [role, setRole] = useState<AppRole>("viewer");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserRole() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            setRole("viewer");
            setUserId(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setUserId(user.id);
        }

        // 1. If inside an active workspace, check workspace-specific role
        if (currentOrgId) {
          const { data: memberRow, error: memberErr } = await supabase
            .from("organization_members")
            .select("role")
            .eq("organization_id", currentOrgId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!memberErr && memberRow?.role) {
            if (isMounted) {
              setRole(memberRow.role as AppRole);
              setLoading(false);
            }
            return;
          }
        }

        // 2. Fallback to profiles role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (isMounted) {
          if (profile?.role) {
            setRole(profile.role as AppRole);
          } else {
            setRole("viewer");
          }
        }
      } catch (err) {
        console.error("Error determining user role:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchUserRole();

    if (!currentOrgId) return;

    // Unique channel per hook instance to prevent duplicate subscription collisions
    const channelId = `user-role-${currentOrgId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organization_members",
          filter: `organization_id=eq.${currentOrgId}`,
        },
        () => {
          if (isMounted) {
            void fetchUserRole();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, currentOrgId]);

  return { role, userId, loading };
}