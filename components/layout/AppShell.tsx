"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  // Standalone layout for sign-up / login (No Header, No Sidebar)
  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        {children}
      </div>
    );
  }

  // Standard Website / Dashboard Layout
  return (
    <>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </>
  );
}