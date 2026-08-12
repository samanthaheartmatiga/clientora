"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, User, Mail, Lock } from "lucide-react";
import { createClient } from "@/app/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    // Register user & attach full_name metadata for Supabase profile creation
    const { data, error } = await supabase.auth.signUp({
      email,
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

    // Check if session exists (email confirmation turned off) or confirmation required
    if (data.session) {
      setSuccessMsg("Account created! Redirecting to settings...");
      setTimeout(() => {
        router.push("/settings");
      }, 1500);
    } else {
      setSuccessMsg("Account created! Please check your email to confirm your registration.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Create an Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Get started by setting up your profile details.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignUp} noValidate className="space-y-4">
          {/* Full Name Input */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1">
              <User className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Work Email Input */}
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

          {/* Password Input */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Password <span className="text-rose-500">*</span>
            </label>
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
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white text-xs font-semibold py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}