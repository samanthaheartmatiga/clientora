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
    // 1. Get current logged in user from the active Next.js session client
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId: string | null = user?.id ?? null;
    let userName: string = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
    let userEmail: string = user?.email || "";

    // 2. Fetch full profile details if user exists
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) userName = profile.full_name;
        if (profile.email) userEmail = profile.email;
      }
    }

    const finalName = userName || userEmail.split("@")[0] || "Workspace Member";
    const finalEmail = userEmail || "member@clientora.com";

    // 3. Client Device detection
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

    // 4. Insert log
    const { error } = await supabase.from("audit_logs").insert([payload]);

    if (error) {
      // If foreign key fails because user is not in profiles table, retry with null user_id
      if (error.code === "23503") {
        await supabase.from("audit_logs").insert([
          {
            ...payload,
            user_id: null,
          },
        ]);
        console.log(`[Audit Logged (Fallback)] ${actionDescription}`);
        return;
      }
      console.error("Audit log insert error:", error.message);
    } else {
      console.log(`[Audit Logged] "${actionDescription}" by ${finalName}`);
    }
  } catch (err) {
    console.error("Audit log exception:", err);
  }
}