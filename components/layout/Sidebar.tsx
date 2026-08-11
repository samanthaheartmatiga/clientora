"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Receipt, 
  X,
  Zap,
  Video,
  Folder,
  Settings
} from "lucide-react";

const mainNavigation = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Invoices", href: "/invoices", icon: Receipt },
];

const secondaryNavigation = [
  { name: "Templates", href: "/templates", icon: Zap },
  { name: "Meetings", href: "/meetings", icon: Video },
  { name: "Files", href: "/files", icon: Folder },
];

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen = false, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Desktop Hover-Expandable Sidebar */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`hidden md:flex flex-col justify-between 
        bg-slate-900/95 dark:bg-white/95 
        text-slate-300 dark:text-slate-700
        border-r border-slate-800/80 dark:border-slate-200/80 
        rounded-r-3xl shadow-2xl transition-all duration-300 ease-in-out shrink-0 relative h-full overflow-hidden z-30 ${
          isExpanded ? "w-60 p-4" : "w-16 p-3"
        }`}
      >
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="flex items-center space-x-3 px-0.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-500/20 shrink-0">
              CO
            </div>
            {isExpanded && (
              <span className="text-sm font-bold text-white dark:text-slate-900 tracking-tight whitespace-nowrap transition-opacity duration-200">
                ClientOra
              </span>
            )}
          </div>

          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                      : "text-slate-400 dark:text-slate-600 hover:text-slate-200 dark:hover:text-slate-900 hover:bg-slate-800/40 dark:hover:bg-slate-100/60"
                  } ${isExpanded ? "justify-between px-3 py-2" : "justify-center p-2.5"}`}
                  title={!isExpanded ? item.name : undefined}
                >
                  {isExpanded && <span className="whitespace-nowrap">{item.name}</span>}
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* Workspace Items */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60 dark:border-slate-200">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                      : "text-slate-400 dark:text-slate-600 hover:text-slate-200 dark:hover:text-slate-900 hover:bg-slate-800/40 dark:hover:bg-slate-100/60"
                  } ${isExpanded ? "justify-between px-3 py-1.5" : "justify-center p-2.5"}`}
                  title={!isExpanded ? item.name : undefined}
                >
                  {isExpanded && <span className="whitespace-nowrap">{item.name}</span>}
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800/60 dark:border-slate-200 space-y-2 shrink-0">
          <Link
            href="/settings"
            className={`flex items-center rounded-xl text-xs font-medium transition-all ${
              pathname === "/settings"
                ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                : "text-slate-400 dark:text-slate-600 hover:text-slate-200 dark:hover:text-slate-900 hover:bg-slate-800/40 dark:hover:bg-slate-100/60"
            } ${isExpanded ? "justify-between px-3 py-1.5" : "justify-center p-2.5"}`}
          >
            {isExpanded && <span className="whitespace-nowrap">Settings</span>}
            <Settings className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-slate-900 dark:bg-white border-r border-slate-800/80 dark:border-slate-200/80 rounded-r-3xl h-full z-10 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-500/20">
                    CO
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white dark:text-slate-900 tracking-tight leading-none">ClientOra</h1>
                  </div>
                </div>
                {setMobileOpen && (
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Core Links */}
              <div className="space-y-1">
                {mainNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen && setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                          : "text-slate-400 dark:text-slate-600 hover:text-slate-200 dark:hover:text-slate-900 hover:bg-slate-800/40 dark:hover:bg-slate-100/60"
                      }`}
                    >
                      <span>{item.name}</span>
                      <Icon className="h-4 w-4 shrink-0" />
                    </Link>
                  );
                })}
              </div>

              {/* Workspace Links */}
              <div className="space-y-1 pt-1 border-t border-slate-800/60 dark:border-slate-200">
                {secondaryNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen && setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                          : "text-slate-400 dark:text-slate-600 hover:text-slate-200 dark:hover:text-slate-900 hover:bg-slate-800/40 dark:hover:bg-slate-100/60"
                      }`}
                    >
                      <span>{item.name}</span>
                      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800/60 dark:border-slate-200 space-y-2 shrink-0">
              <Link
                href="/settings"
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  pathname === "/settings"
                    ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                    : "text-slate-400 dark:text-slate-600 hover:text-slate-200 dark:hover:text-slate-900 hover:bg-slate-800/40 dark:hover:bg-slate-100/60"
                }`}
              >
                <span>Settings</span>
                <Settings className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}