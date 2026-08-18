import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// GET: Verify token & return organization info
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing invitation token" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: invite, error: inviteErr } = await supabase
      .from("invitations")
      .select("id, email, role, organization_id, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (inviteErr) {
      console.error("Supabase invite query error:", inviteErr.message);
      return NextResponse.json(
        { error: `Database error: ${inviteErr.message}` },
        { status: 500 }
      );
    }

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation not found or invalid." },
        { status: 404 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation has already been used or revoked." },
        { status: 400 }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation link has expired." },
        { status: 400 }
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", invite.organization_id)
      .maybeSingle();

    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      organization_id: invite.organization_id,
      organization_name: org?.name || "Workspace",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to verify invitation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Add member to workspace
export async function POST(req: Request) {
  try {
    const { token, userId, fullName } = await req.json();

    if (!token || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Verify invite
    const { data: invite, error: inviteErr } = await supabase
      .from("invitations")
      .select("id, email, role, organization_id, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (inviteErr || !invite || invite.status !== "pending") {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    // 2. Add member to organization
    const { error: memberErr } = await supabase
      .from("organization_members")
      .upsert(
        {
          organization_id: invite.organization_id,
          user_id: userId,
          role: invite.role || "member",
        },
        { onConflict: "organization_id,user_id" }
      );

    if (memberErr) {
      console.error("Error inserting member:", memberErr);
      return NextResponse.json({ error: memberErr.message }, { status: 500 });
    }

    // 3. Update profile
    const profileUpdate: Record<string, unknown> = {
      id: userId,
      role: invite.role || "member",
    };
    if (fullName) {
      profileUpdate.full_name = fullName;
    }

    await supabaseAdminUpsertProfile(supabase, profileUpdate);

    // 4. Mark invite as accepted if email-specific
    if (invite.email) {
      await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invite.id);
    }

    return NextResponse.json({
      success: true,
      organization_id: invite.organization_id,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to join workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function supabaseAdminUpsertProfile(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  profile: Record<string, unknown>
) {
  await supabase.from("profiles").upsert(profile);
}