"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Users,
  Receipt,
  Globe,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/app/supabase/client";
import { logWorkspaceActivity } from "@/lib/audit";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      await logWorkspaceActivity("Updated account password via reset flow");

      // Sign out of recovery session so user logs in fresh
      await supabase.auth.signOut();

      setIsSuccess(true);
    } catch (err: unknown) {
      console.error("Password update error:", err);
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* TOP LEFT BRAND LOGO */}
      <div className="absolute top-6 left-8 z-30 flex items-center">
        <Link
          href="/auth"
          className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center transition hover:opacity-90"
        >
          <Image
            src="/clientoralogonobg.png"
            alt="ClientOra Logo"
            width={40}
            height={40}
            className="h-full w-full object-contain"
            priority
          />
        </Link>
      </div>

      {/* LEFT SIDE ACCENTS */}
      <div className="absolute top-8 left-8 flex flex-col space-y-2 pointer-events-none opacity-40">
        <div className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
        <div className="w-4 h-4 bg-indigo-800 dark:bg-indigo-500 rounded-full" />
      </div>

      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-200/70 dark:bg-amber-500/20 rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-12 w-32 h-32 bg-indigo-600/80 rounded-full pointer-events-none" />

      {/* OVERLAPPING FORM CONTAINER */}
      <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end pr-0 lg:pr-12 p-6 z-20 relative">
        <div className="w-full max-w-md space-y-5 pt-12 lg:pt-0 transform lg:translate-x-16 transition-transform">
          {/* LOGO HEADER (NO TEXT) */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="h-14 w-14 rounded-2xl overflow-hidden flex items-center justify-center">
              <Image
                src="/clientoralogonobg.png"
                alt="ClientOra Logo"
                width={56}
                height={56}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Manage your clients, projects, and workforce seamlessly.
            </p>
          </div>

          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-indigo-900/10 p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="h-11 w-11 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 rounded-2xl mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Create New Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set a strong password to secure your account.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3.5 text-xs text-rose-600 dark:text-rose-400 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isSuccess ? (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Password Changed Successfully</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-400">
                    Your credentials have been updated. Please sign in with your new password to access your workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/auth")}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} noValidate className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white text-xs font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT GRAPHIC PANEL */}
      <div className="hidden lg:block w-1/2 relative min-h-screen bg-indigo-600 dark:bg-indigo-900 overflow-hidden rounded-l-[120px] shadow-2xl z-10">
        <div className="absolute -top-20 -right-20 w-125 h-125 bg-indigo-700/90 dark:bg-indigo-950/90 rounded-[120px] transform rotate-45" />
        <div className="absolute -bottom-28 -left-20 w-130 h-130 bg-indigo-500/80 dark:bg-indigo-800/80 rounded-[160px] transform -rotate-12" />

        <div className="absolute top-10 left-36 w-12 h-12 bg-amber-300 rounded-full opacity-90 shadow-md" />
        <div className="absolute top-24 left-1/2 w-6 h-6 bg-rose-300 rounded-full opacity-80" />
        <div className="absolute top-16 right-20 w-28 h-28 bg-emerald-400 rounded-full opacity-90 shadow-lg" />
        <div className="absolute top-1/2 left-20 w-16 h-16 bg-amber-300 rounded-full opacity-90 shadow-md" />
        <div className="absolute bottom-20 right-16 w-20 h-20 bg-sky-300 rounded-full opacity-80" />
        <div className="absolute bottom-1/3 left-48 w-8 h-8 bg-rose-300 rounded-full opacity-80" />
        <div className="absolute bottom-8 left-1/3 w-6 h-6 bg-emerald-300 rounded-full opacity-80" />

        <div className="absolute top-10 right-10 z-20 flex items-center space-x-2 px-3.5 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-[10px] text-white/90 border border-white/15 shadow-sm">
          <Globe className="h-3.5 w-3.5 text-sky-300" />
          <span>Global Team Access</span>
        </div>

        <div className="absolute top-20 left-24 flex items-center space-x-3 bg-white/15 backdrop-blur-lg border border-white/25 rounded-2xl p-3.5 shadow-2xl text-white transform -rotate-2 hover:rotate-0 transition-transform duration-300">
          <div className="h-9 w-9 rounded-xl bg-emerald-400/30 border border-emerald-300/40 flex items-center justify-center text-emerald-300 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Client Retention High</p>
            <p className="text-[10px] text-emerald-200">Consistent satisfaction score</p>
          </div>
        </div>

        <div className="absolute top-1/3 right-16 w-52 h-36 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 transform rotate-12 p-4 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-2">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="w-24 h-2 bg-white/40 rounded-full mb-1.5" />
          <div className="w-14 h-2 bg-white/20 rounded-full" />
        </div>

        <div className="absolute top-1/2 left-28 w-48 h-32 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 transform -rotate-12 p-4 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-2">
            <Users className="h-5 w-5" />
          </div>
          <div className="w-20 h-2 bg-white/40 rounded-full mb-1.5" />
          <div className="w-12 h-2 bg-white/20 rounded-full" />
        </div>

        <div className="absolute bottom-28 right-28 w-56 h-36 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 transform -rotate-6 p-4 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-2">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="w-28 h-2 bg-white/40 rounded-full mb-1.5" />
          <div className="w-16 h-2 bg-white/20 rounded-full" />
        </div>

        <div className="absolute bottom-12 left-20 flex items-center space-x-2.5 px-4 py-2.5 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-xl text-white">
          <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
          <div className="text-[11px]">
            <p className="font-bold">Next-Gen Workspace</p>
            <p className="opacity-75 text-[10px]">Real-time client collaboration</p>
          </div>
        </div>
      </div>
    </div>
  );
}