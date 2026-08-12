"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/app/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label="Log Out"
      className="inline-flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold h-8 w-8 sm:h-auto sm:w-auto p-0 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl transition cursor-pointer shrink-0 whitespace-nowrap"
    >
      {isLoggingOut ? (
        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin shrink-0" />
      ) : (
        <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
      )}
      <span className="hidden sm:inline">Log Out</span>
    </button>
  );
}