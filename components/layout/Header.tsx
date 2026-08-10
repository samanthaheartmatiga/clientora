"use client";

import React from "react";
import { Menu, Bell, Search, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md transition-colors duration-200">
      {/* Left Section: Mobile Menu Trigger & Search */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
          aria-label="Open Mobile Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Quick Search Input */}
        <div className="relative hidden sm:block w-64 md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            suppressHydrationWarning
            placeholder="Search dashboard..."
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl pl-10 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
          />
        </div>
      </div>

      {/* Right Section: Theme Toggle, Notifications, User Profile */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Theme Switcher Button */}
        <ThemeToggle />

        {/* Notification Button */}
        <button
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-950" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* User Profile Info */}
        <div className="flex items-center space-x-2.5 pl-1 cursor-pointer">
          <div className="h-8 w-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs shadow-inner shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Admin User
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Workspace Owner
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}