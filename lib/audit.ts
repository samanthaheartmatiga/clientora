import { supabase } from "@/lib/supabaseClient";
import { createClient as createBrowserClient } from "@/app/supabase/client";

interface AuditLogRow {
  organization_id: string | null;
  user_id: string | null;
  user_name: string;
  user_email: string;
  action: string;
  device_info: string;
  ip_address: string;
}

export async function logWorkspaceActivity(
  actionDescription: string,
  explicitOrgId?: string | null
): Promise<void> {
  const browserClient = createBrowserClient();

  try {
    let userId: string | null = null;
    let userEmail = "";
    let userName = "";

    // 1. Try browser SSR client
    const { data: userData } = await browserClient.auth.getUser();
    if (userData?.user) {
      userId = userData.user.id;
      userEmail = userData.user.email || "";
      userName =
        userData.user.user_metadata?.full_name ||
        userData.user.user_metadata?.name ||
        "";
    }

    // 2. Try legacy client fallback
    if (!userId) {
      const { data: legacyData } = await supabase.auth.getUser();
      if (legacyData?.user) {
        userId = legacyData.user.id;
        userEmail = legacyData.user.email || "";
        userName =
          legacyData.user.user_metadata?.full_name ||
          legacyData.user.user_metadata?.name ||
          "";
      }
    }

    // 3. Fallback: Parse auth token directly from browser cookie
    if (!userId && typeof document !== "undefined") {
      const cookieMatch = document.cookie.match(/sb-[a-z0-9]+-auth-token=([^;]+)/i);
      if (cookieMatch?.[1]) {
        try {
          const raw = decodeURIComponent(cookieMatch[1]);
          const parsed = JSON.parse(
            raw.startsWith("base64-") ? atob(raw.replace("base64-", "")) : raw
          );
          const u = parsed.user || parsed.currentSession?.user || parsed[0]?.user;
          if (u) {
            userId = u.id || null;
            userEmail = u.email || "";
            userName =
              u.user_metadata?.full_name ||
              u.user_metadata?.name ||
              "";
          }
        } catch {
          // Token decode fallback
        }
      }
    }

    // 4. Query public.profiles using the active user ID for latest name
    if (userId) {
      const { data: profile } = await browserClient
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.full_name?.trim()) {
        userName = profile.full_name;
      }
      if (profile?.email?.trim() && !userEmail) {
        userEmail = profile.email;
      }
    }

    // 5. Fallback formatting
    if (!userName && userEmail) {
      userName = userEmail.split("@")[0];
    }

    const finalName = userName?.trim() || "Workspace Member";
    const finalEmail = userEmail?.trim() || "member@clientora.com";

    // 6. Resolve Active Organization ID
    let resolvedOrgId: string | null = explicitOrgId ?? null;
    if (!resolvedOrgId && typeof window !== "undefined") {
      resolvedOrgId = localStorage.getItem("active_org_id");
    }

    // 7. Device information
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    let device = "Desktop Browser";
    if (/iPhone|iPad|iPod/i.test(ua)) device = "Safari on iOS";
    else if (/Android/i.test(ua)) device = "Chrome on Android";
    else if (/Macintosh|Mac OS/i.test(ua)) device = "Chrome on macOS";
    else if (/Windows/i.test(ua)) device = "Chrome on Windows";

    const payload: AuditLogRow = {
      organization_id: resolvedOrgId,
      user_id: userId,
      user_name: finalName,
      user_email: finalEmail,
      action: actionDescription,
      device_info: device,
      ip_address: "127.0.0.1",
    };

    const { error } = await browserClient.from("audit_logs").insert([payload]);

    if (error) {
      await browserClient.from("audit_logs").insert([
        {
          ...payload,
          user_id: null,
        },
      ]);
    }
  } catch (err) {
    console.error("Error logging workspace activity:", err);
  }
}