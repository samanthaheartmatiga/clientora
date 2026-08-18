"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { logWorkspaceActivity } from "@/lib/audit";

interface InviteDetails {
  id: string;
  email: string | null;
  role: string;
  organization_id: string;
  organization_name: string;
}

function JoinWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const supabase = useMemo(() => createClient(), []);
  const { refreshOrganizations, switchOrganization } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [currentSessionUser, setCurrentSessionUser] = useState<{
    id: string;
    email: string;
    fullName?: string | null;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign up fields
  const [signupEmail, setSignupEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function verifyTokenAsync() {
      if (!token) {
        if (isMounted) {
          setErrorMsg("Missing or invalid invitation token.");
          setLoading(false);
        }
        return;
      }

      try {
        // 1. Check logged-in user session
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (isMounted && user?.email) {
          setCurrentSessionUser({
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || null,
          });
        }

        // 2. Fetch invite details via backend API
        const res = await fetch(`/api/join?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Invitation not found or link has expired.");
        }

        if (isMounted) {
          setInvite(data);
          if (data.email) {
            setSignupEmail(data.email);
          }
        }
      } catch (err: unknown) {
        console.error("Token verification failed:", err);
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Invalid invitation link.";
          setErrorMsg(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void verifyTokenAsync();

    return () => {
      isMounted = false;
    };
  }, [supabase, token]);

  const joinWorkspaceWithUserId = async (userId: string, userFullName?: string) => {
    if (!invite || !token) return;

    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        userId,
        fullName: userFullName,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to join workspace.");
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("current_workspace_id", invite.organization_id);
    }

    await logWorkspaceActivity(
      `Joined workspace ${invite.organization_name} via invitation`,
      invite.organization_id
    );

    await refreshOrganizations();
    switchOrganization(invite.organization_id);

    router.push("/home");
  };

  // Scenario 1: Existing logged-in user accepts
  const handleConfirmJoin = async () => {
    if (!token || !invite || !currentSessionUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await joinWorkspaceWithUserId(
        currentSessionUser.id,
        currentSessionUser.fullName || undefined
      );
    } catch (err: unknown) {
      console.error("Failed to join workspace:", err);
      const msg = err instanceof Error ? err.message : "Failed to join workspace.";
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  // Scenario 2: New user signs up and immediately joins
  const handleSignUpAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invite) return;

    const targetEmail = (invite.email || signupEmail).trim().toLowerCase();

    if (!targetEmail) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: targetEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: invite.role,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        await joinWorkspaceWithUserId(authData.user.id, fullName.trim());
      } else {
        router.push(
          `/auth?message=${encodeURIComponent(
            "Account created! Please check your email to verify before accessing the workspace."
          )}`
        );
      }
    } catch (err: unknown) {
      console.error("Signup and join failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to complete account registration.";
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3 bg-slate-50 dark:bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs font-semibold">Validating invitation...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Workspace Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 rounded-2xl mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {invite?.organization_name || "Workspace Invitation"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official team workspace collaboration invite
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SCENARIO 1: USER ALREADY LOGGED IN -> PROMPT TO ACCEPT INVITE */}
        {currentSessionUser && invite ? (
          <div className="space-y-5">
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Workspace Invitation Received</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Do you want to accept the invitation to join{" "}
                <strong className="text-slate-900 dark:text-white">
                  {invite.organization_name}
                </strong>{" "}
                as an assigned{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                  {invite.role}
                </span>
                ?
              </p>
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/50 text-[11px] text-slate-500 dark:text-slate-400">
                Logged in as: <strong className="text-slate-700 dark:text-slate-200">{currentSessionUser.email}</strong>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleConfirmJoin}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Joining workspace...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Accept & Join {invite.organization_name}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/home")}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Decline & Go to Home</span>
              </button>
            </div>
          </div>
        ) : invite ? (
          /* SCENARIO 2: NEW USER -> BANNER + IMMEDIATE JOIN ON SIGNUP */
          <div className="space-y-4">
            <div className="p-3.5 bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl flex items-start gap-3 shadow-xs">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  You are joining {invite.organization_name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Create your profile credentials below. You will be placed directly into the workspace with the{" "}
                  <strong className="capitalize text-indigo-600 dark:text-indigo-400">
                    {invite.role}
                  </strong>{" "}
                  role upon signing up.
                </p>
              </div>
            </div>

            <form onSubmit={handleSignUpAndJoin} className="space-y-3.5">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={Boolean(invite.email)}
                  value={invite.email || signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border ${
                    invite.email
                      ? "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account & joining...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Join {invite.organization_name}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                Already have an account?{" "}
                <Link
                  href={`/auth?redirectTo=${encodeURIComponent(
                    `/join?token=${token}`
                  )}`}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function JoinWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
          Loading invitation...
        </div>
      }
    >
      <JoinWorkspaceContent />
    </Suspense>
  );
}