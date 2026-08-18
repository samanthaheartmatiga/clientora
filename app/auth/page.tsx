"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Lock,
  ArrowRight,
  FolderKanban,
  Users,
  Receipt,
  Globe,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/app/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      setIsLoading(false);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } else {
      if (!fullName.trim()) {
        setErrorMsg("Full name is required.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      setIsLoading(false);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        setSuccessMsg("Account created! Accessing Clientora...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      } else {
        setSuccessMsg("Account created! Accessing Clientora...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* TOP LEFT BRAND LOGO */}
      <div className="absolute top-6 left-8 z-30 flex items-center">
        <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
          <Image
            src="/clientoralogonobg.png"
            alt="ClientOra Logo"
            width={36}
            height={36}
            className="h-full w-full object-contain"
            priority
          />
        </div>
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
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
              Clientora
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your clients, projects, and workforce seamlessly.
            </p>
          </div>

          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-indigo-900/10 p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  mode === "login"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  mode === "signup"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* ERROR FEEDBACK CONTAINER */}
            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3.5 text-xs text-rose-600 dark:text-rose-400 space-y-1.5">
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>
                    {errorMsg.includes("Password should contain at least one character of each")
                      ? "Password requirements not met:"
                      : errorMsg}
                  </span>
                </div>

                {/* Formatted bulleted list if Supabase returns complex password errors */}
                {errorMsg.includes("Password should contain at least one character of each") && (
                  <ul className="list-disc list-inside pl-5 space-y-0.5 text-[11px] opacity-90">
                    <li>At least 8 characters</li>
                    <li>At least one lowercase letter (a-z)</li>
                    <li>At least one uppercase letter (A-Z)</li>
                    <li>At least one number (0-9)</li>
                    <li>At least one special character (!@#$%^&*)</li>
                  </ul>
                )}
              </div>
            )}

            {/* SUCCESS FEEDBACK CONTAINER */}
            {successMsg && (
              <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuth} noValidate className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <User className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Fill in your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Work Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {mode === "login" && (
                    <Link
                      href="/auth/forgot-password"
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative mt-1">
                  <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    <span>{mode === "login" ? "Signing In..." : "Creating Account..."}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === "login" ? "Sign In to Clientora" : "Create Account"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT GRAPHIC PANEL */}
      <div className="hidden lg:block w-1/2 relative min-h-screen bg-indigo-600 dark:bg-indigo-900 overflow-hidden rounded-l-[120px] shadow-2xl z-10">
        
        {/* Layered Background Organic Waves */}
        <div className="absolute -top-20 -right-20 w-125 h-125 bg-indigo-700/90 dark:bg-indigo-950/90 rounded-[120px] transform rotate-45" />
        <div className="absolute -bottom-28 -left-20 w-130 h-130 bg-indigo-500/80 dark:bg-indigo-800/80 rounded-[160px] transform -rotate-12" />

        {/* Balanced Floating Geometric Orbs */}
        <div className="absolute top-10 left-36 w-12 h-12 bg-amber-300 rounded-full opacity-90 shadow-md" />
        <div className="absolute top-24 left-1/2 w-6 h-6 bg-rose-300 rounded-full opacity-80" />
        <div className="absolute top-16 right-20 w-28 h-28 bg-emerald-400 rounded-full opacity-90 shadow-lg" />
        <div className="absolute top-1/2 left-20 w-16 h-16 bg-amber-300 rounded-full opacity-90 shadow-md" />
        <div className="absolute bottom-20 right-16 w-20 h-20 bg-sky-300 rounded-full opacity-80" />
        <div className="absolute bottom-1/3 left-48 w-8 h-8 bg-rose-300 rounded-full opacity-80" />
        <div className="absolute bottom-8 left-1/3 w-6 h-6 bg-emerald-300 rounded-full opacity-80" />

        {/* TOP RIGHT COMPLIANCE PILL */}
        <div className="absolute top-10 right-10 z-20 flex items-center space-x-2 px-3.5 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-[10px] text-white/90 border border-white/15 shadow-sm">
          <Globe className="h-3.5 w-3.5 text-sky-300" />
          <span>Global Team Access</span>
        </div>

        {/* TOP LEFT FEATURE CARD */}
        <div className="absolute top-20 left-24 flex items-center space-x-3 bg-white/15 backdrop-blur-lg border border-white/25 rounded-2xl p-3.5 shadow-2xl text-white transform -rotate-2 hover:rotate-0 transition-transform duration-300">
          <div className="h-9 w-9 rounded-xl bg-emerald-400/30 border border-emerald-300/40 flex items-center justify-center text-emerald-300 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Client Retention High</p>
            <p className="text-[10px] text-emerald-200">Consistent satisfaction score</p>
          </div>
        </div>

        {/* CENTER-RIGHT GRAPHIC CARD 1 */}
        <div className="absolute top-1/3 right-16 w-52 h-36 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 transform rotate-12 p-4 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-2">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="w-24 h-2 bg-white/40 rounded-full mb-1.5" />
          <div className="w-14 h-2 bg-white/20 rounded-full" />
        </div>

        {/* CENTER-LEFT GRAPHIC CARD 2 */}
        <div className="absolute top-1/2 left-28 w-48 h-32 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 transform -rotate-12 p-4 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-2">
            <Users className="h-5 w-5" />
          </div>
          <div className="w-20 h-2 bg-white/40 rounded-full mb-1.5" />
          <div className="w-12 h-2 bg-white/20 rounded-full" />
        </div>

        {/* BOTTOM-RIGHT GRAPHIC CARD 3 */}
        <div className="absolute bottom-28 right-28 w-56 h-36 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 transform -rotate-6 p-4 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-2">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="w-28 h-2 bg-white/40 rounded-full mb-1.5" />
          <div className="w-16 h-2 bg-white/20 rounded-full" />
        </div>

        {/* BOTTOM-LEFT FLOATING PILL */}
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