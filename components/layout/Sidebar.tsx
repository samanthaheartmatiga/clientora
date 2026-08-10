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
  Plus,
  Zap,
  Video,
  FileText,
  Folder,
  History,
  Boxes,
  Settings
} from "lucide-react";

const mainNavigation = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Invoices", href: "/invoices", icon: Receipt },
];

const secondaryNavigation = [
  { name: "Templates", href: "#", icon: Zap },
  { name: "Meetings", href: "#", icon: Video },
  { name: "Files", href: "#", icon: FileText },
  { name: "Shared with me", href: "#", icon: Folder },
  { name: "History", href: "#", icon: History },
  { name: "Integrations", href: "#", icon: Boxes },
];

const collections = [
  { name: "Commercial", color: "bg-rose-500" },
  { name: "Operations", color: "bg-blue-500" },
  { name: "Product", color: "bg-lime-400" },
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
      {/* Desktop Hover-Expandable Sidebar (Inverted Theme Colors) */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`hidden md:flex flex-col justify-between 
        /* Inverted Theme Backgrounds & Borders */
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

          {/* New Action Trigger */}
          <button
            suppressHydrationWarning
            className={`w-full flex items-center bg-slate-800/70 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200/80 border border-slate-700/50 dark:border-slate-200/80 text-slate-200 dark:text-slate-800 rounded-xl transition-all ${
              isExpanded ? "px-3 py-2 text-xs justify-between" : "p-2.5 justify-center"
            }`}
          >
            {isExpanded ? (
              <>
                <span className="text-xs font-medium whitespace-nowrap">New chat</span>
                <Plus className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              </>
            ) : (
              <Plus className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
          </button>

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
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-xl text-xs font-medium text-slate-400 dark:text-slate-600 hover:text-slate-200 dark:hover:text-slate-900 hover:bg-slate-800/40 dark:hover:bg-slate-100/60 transition-all ${
                    isExpanded ? "justify-between px-3 py-1.5" : "justify-center p-2.5"
                  }`}
                  title={!isExpanded ? item.name : undefined}
                >
                  {isExpanded && <span className="whitespace-nowrap">{item.name}</span>}
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                </Link>
              );
            })}
          </div>

          {/* Collections List */}
          {isExpanded && (
            <div className="pt-2 border-t border-slate-800/60 dark:border-slate-200 space-y-1">
              {collections.map((col) => (
                <div
                  key={col.name}
                  className="flex items-center space-x-2.5 px-3 py-1 rounded-lg text-xs text-slate-300 dark:text-slate-700 hover:bg-slate-800/30 dark:hover:bg-slate-100/60 cursor-pointer"
                >
                  <span className={`h-2 w-2 rounded-full ${col.color}`} />
                  <span className="text-xs text-slate-400 dark:text-slate-600 font-normal whitespace-nowrap">{col.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800/60 dark:border-slate-200 space-y-2 shrink-0">
          <Link
            href="#"
            className={`flex items-center rounded-xl text-xs font-medium text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 transition-all ${
              isExpanded ? "justify-between px-3 py-1.5" : "justify-center p-2.5"
            }`}
          >
            {isExpanded && <span className="whitespace-nowrap">Settings</span>}
            <Settings className="h-3.5 w-3.5 shrink-0" />
          </Link>

          {isExpanded && (
            <div className="p-2.5 bg-slate-950/60 dark:bg-slate-100 border border-slate-800/80 dark:border-slate-200 rounded-2xl space-y-0.5">
              <p className="text-[11px] font-semibold text-slate-200 dark:text-slate-900 whitespace-nowrap">100 credits left today</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 whitespace-nowrap">Invite peers to refill</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer (Matching Inverted Web View Style) */}
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
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Action Button */}
              <button className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/70 dark:bg-slate-100 border border-slate-700/50 dark:border-slate-200/80 rounded-xl text-xs text-slate-200 dark:text-slate-800">
                <span className="font-medium">New chat</span>
                <Plus className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              </button>

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
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen && setMobileOpen(false)}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-600 hover:text-slate-200 dark:hover:text-slate-900 hover:bg-slate-800/40 dark:hover:bg-slate-100/60 transition-all"
                    >
                      <span>{item.name}</span>
                      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    </Link>
                  );
                })}
              </div>

              {/* Collections */}
              <div className="pt-2 border-t border-slate-800/60 dark:border-slate-200 space-y-1">
                {collections.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center space-x-2.5 px-3 py-1 rounded-lg text-xs text-slate-300 dark:text-slate-700"
                  >
                    <span className={`h-2 w-2 rounded-full ${col.color}`} />
                    <span className="text-xs text-slate-400 dark:text-slate-600 font-normal">{col.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800/60 dark:border-slate-200 space-y-2 shrink-0">
              <Link
                href="#"
                className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900"
              >
                <span>Settings</span>
                <Settings className="h-3.5 w-3.5 shrink-0" />
              </Link>

              <div className="p-2.5 bg-slate-950/60 dark:bg-slate-100 border border-slate-800/80 dark:border-slate-200 rounded-2xl space-y-0.5">
                <p className="text-[11px] font-semibold text-slate-200 dark:text-slate-900">100 credits left today</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-500">Invite peers to refill</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}