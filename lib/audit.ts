import { createClient } from "@/app/supabase/client";

interface AuditLogRow {
  user_id: string | null;
  user_name: string;
  user_email: string;
  action: string;
  device_info: string;
  ip_address: string;
}

export async function logWorkspaceActivity(actionDescription: string): Promise<void> {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId: string | null = user?.id ?? null;
    let userEmail: string = user?.email ?? "";
    let userName = "";

    // 1. ALWAYS query profiles table FIRST to get the most recent name
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.full_name?.trim()) {
        userName = profile.full_name.trim();
      }
      if (profile?.email?.trim()) {
        userEmail = profile.email.trim();
      }
    }

    // 2. Fallback to auth user metadata if profile table didn't have it
    if (!userName && user) {
      userName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";
    }

    // 3. Fallback to email prefix
    if (!userName && userEmail) {
      userName = userEmail.split("@")[0];
    }

    const finalName = userName && userName.trim() !== "" ? userName : "Workspace Member";
    const finalEmail = userEmail && userEmail.trim() !== "" ? userEmail : "member@clientora.com";

    // 4. Device detection
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    let device = "Desktop Browser";
    if (/iPhone|iPad|iPod/i.test(ua)) device = "Safari on iOS";
    else if (/Android/i.test(ua)) device = "Chrome on Android";
    else if (/Macintosh|Mac OS/i.test(ua)) device = "Chrome on macOS";
    else if (/Windows/i.test(ua)) device = "Chrome on Windows";

    const payload: AuditLogRow = {
      user_id: userId,
      user_name: finalName,
      user_email: finalEmail,
      action: actionDescription,
      device_info: device,
      ip_address: "127.0.0.1",
    };

    const { error } = await supabase.from("audit_logs").insert([payload]);

    if (error) {
      await supabase.from("audit_logs").insert([
        {
          ...payload,
          user_id: null,
        },
      ]);
    }
  } catch (err) {
    console.error("Error in logWorkspaceActivity:", err);
  }
}