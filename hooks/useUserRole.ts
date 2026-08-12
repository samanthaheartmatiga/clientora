"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/app/supabase/client";
import { AppRole } from "@/lib/permissions";

export function useUserRole() {
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<AppRole>("viewer");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && isMounted) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role && isMounted) {
          setRole(profile.role as AppRole);
        }
      }

      if (isMounted) setLoading(false);
    }

    fetchUserRole();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return { role, userId, loading };
}