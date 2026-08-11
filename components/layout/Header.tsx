"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  User,
  Calendar,
  FileText,
  CheckCheck,
  Trash2,
  FolderKanban,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useNotifications } from "@/context/NotificationContext";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const {
    filteredNotifications,
    unreadCount,
    activeTab,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (id: string, rawLink?: string) => {
    await markAsRead(id);
    setIsOpen(false);

    if (rawLink) {
      const targetPath = rawLink.startsWith("/") ? rawLink : `/${rawLink}`;
      router.push(targetPath);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md transition-colors duration-200">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
          aria-label="Open Mobile Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

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

      {/* Right Section */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        <ThemeToggle />

        {/* Notification Bell Container */}
        <div className="relative">
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
            )}
          </button>

          {/* Mobile-Optimized Dropdown */}
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />

              <div className="absolute -right-12 sm:right-0 mt-3 w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm md:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header Title & Actions */}
                <div className="flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-indigo-500/20">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] sm:text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <CheckCheck className="h-3 w-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs Bar: All | Invoices | Meetings */}
                <div className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition cursor-pointer ${
                      activeTab === "all"
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab("invoices")}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition cursor-pointer ${
                      activeTab === "invoices"
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    Invoices
                  </button>
                  <button
                    onClick={() => setActiveTab("meetings")}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition cursor-pointer ${
                      activeTab === "meetings"
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    Meetings
                  </button>
                </div>

                {/* Filtered Notifications List */}
                <div className="max-h-64 sm:max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-400">
                      No {activeTab !== "all" ? activeTab : ""} notifications found
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => {
                      const isUnread = !notif.read;
                      return (
                        <div
                          key={notif.id}
                          onClick={() =>
                            handleNotificationClick(
                              notif.id,
                              notif.link || undefined
                            )
                          }
                          className={`group p-2.5 sm:p-3 transition cursor-pointer flex items-start space-x-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            isUnread
                              ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                              : ""
                          }`}
                        >
                          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                            {notif.type === "invoice" ? (
                              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : notif.type === "project" ? (
                              <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : (
                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {notif.title}
                              </p>
                              <div className="flex items-center space-x-1 shrink-0 ml-1.5">
                                {isUnread && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                                )}
                                <button
                                  onClick={(e) => handleDelete(e, notif.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  title="Delete notification"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

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