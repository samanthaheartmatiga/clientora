/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Save, Check, Loader2, ChevronDown, Search, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { getCountries, getCountryCallingCode, CountryCode } from "libphonenumber-js";
import { createClient } from "@/app/supabase/client";
import LogoutButton from "./LogoutButton";

export interface Profile {
  id: string;
  role_id?: number;
  full_name?: string;
  email?: string;
  created_at?: string | null;
  role_title?: string | null;
  department?: string | null;
  work_location?: string | null;
  selected_country?: string | null;
  phone_number?: string | null;
}

export interface DepartmentItem {
  id: string;
  name: string;
}

export interface WorkSetupItem {
  id: string;
  name: string;
}

export default function ProfileTab() {
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Success Feedback Badges
  const [deptAddedSuccess, setDeptAddedSuccess] = useState(false);
  const [setupAddedSuccess, setSetupAddedSuccess] = useState(false);

  // Validation Error States
  const [errors, setErrors] = useState<{ fullName?: string }>({});

  // Dropdown Toggle States
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Search Query State
  const [countrySearch, setCountrySearch] = useState("");

  // CRUD States
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [workSetups, setWorkSetups] = useState<WorkSetupItem[]>([]);

  const [newDeptInput, setNewDeptInput] = useState("");
  const [isAddingDept, setIsAddingDept] = useState(false);

  const [newSetupInput, setNewSetupInput] = useState("");
  const [isAddingSetup, setIsAddingSetup] = useState(false);

  // Element Refs
  const countryRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);
  const setupRef = useRef<HTMLDivElement>(null);
  const countrySearchRef = useRef<HTMLInputElement>(null);

  // Form Field States
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("PH");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Wrapped with useCallback to satisfy react-hooks/exhaustive-deps
  const fetchDepartments = useCallback(async () => {
    const { data } = await supabase
      .from("organization_departments")
      .select("id, name")
      .order("name", { ascending: true });
    if (data) setDepartments(data as unknown as DepartmentItem[]);
  }, [supabase]);

  const fetchWorkSetups = useCallback(async () => {
    const { data } = await supabase
      .from("organization_work_setups")
      .select("id, name")
      .order("name", { ascending: true });
    if (data) setWorkSetups(data as unknown as WorkSetupItem[]);
  }, [supabase]);

  // Load Initial Data
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");

        const signupName = user.user_metadata?.full_name || user.user_metadata?.name || "";

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          const p = profile as unknown as Profile;
          setFullName(p.full_name || signupName);
          setRoleTitle(p.role_title || "");
          setDepartment(p.department || "");
          setWorkLocation(p.work_location || "");
          setSelectedCountry((p.selected_country as CountryCode) || "PH");
          setPhoneNumber(p.phone_number || "");
        } else {
          setFullName(signupName);
        }
      }

      await fetchDepartments();
      await fetchWorkSetups();

      setIsLoading(false);
    }

    loadInitialData();
  }, [supabase, fetchDepartments, fetchWorkSetups]);

  // Realtime Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("organization_dropdowns_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organization_departments" },
        () => fetchDepartments()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organization_work_setups" },
        () => fetchWorkSetups()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchDepartments, fetchWorkSetups]);

  // Country Options
  const countryOptions = useMemo(() => {
    const countries = getCountries();
    return countries
      .map((country) => {
        try {
          const callingCode = getCountryCallingCode(country);
          return {
            iso: country,
            callingCode: `+${callingCode}`,
            flagUrl: `https://flagcdn.com/w40/${country.toLowerCase()}.png`,
            label: `${country} (+${callingCode})`,
          };
        } catch {
          return null;
        }
      })
      .filter((c): c is { iso: CountryCode; callingCode: string; flagUrl: string; label: string } => c !== null)
      .sort((a, b) => a.iso.localeCompare(b.iso));
  }, []);

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return countryOptions;
    return countryOptions.filter(
      (c) => c.iso.toLowerCase().includes(query) || c.callingCode.includes(query)
    );
  }, [countryOptions, countrySearch]);

  const activeCountryObj = useMemo(
    () => countryOptions.find((c) => c.iso === selectedCountry) || countryOptions[0],
    [countryOptions, selectedCountry]
  );

  useEffect(() => {
    if (isCountryOpen) {
      const timer = setTimeout(() => countrySearchRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isCountryOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
        setCountrySearch("");
      }
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setIsDeptOpen(false);
      }
      if (setupRef.current && !setupRef.current.contains(event.target as Node)) {
        setIsSetupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleAddDepartment = async () => {
    const trimmed = newDeptInput.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("organization_departments")
      .insert([{ name: trimmed } as unknown as DepartmentItem])
      .select("id, name")
      .single();

    if (error) {
      console.error("Error adding department:", error.message);
    } else if (data) {
      const inserted = data as unknown as DepartmentItem;
      setDepartment(inserted.name);
      await fetchDepartments();
    }

    setNewDeptInput("");
    setIsAddingDept(false);
    setIsDeptOpen(false);

    setDeptAddedSuccess(true);
    setTimeout(() => setDeptAddedSuccess(false), 3000);
  };

  const handleDeleteDepartment = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();

    const { error } = await supabase
      .from("organization_departments")
      .delete()
      .eq("id", id);

    if (!error) {
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      if (department === name) {
        setDepartment("");
      }
    }
  };

  const handleAddSetup = async () => {
    const trimmed = newSetupInput.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("organization_work_setups")
      .insert([{ name: trimmed } as unknown as WorkSetupItem])
      .select("id, name")
      .single();

    if (error) {
      console.error("Error adding work setup:", error.message);
    } else if (data) {
      const inserted = data as unknown as WorkSetupItem;
      setWorkLocation(inserted.name);
      await fetchWorkSetups();
    }

    setNewSetupInput("");
    setIsAddingSetup(false);
    setIsSetupOpen(false);

    setSetupAddedSuccess(true);
    setTimeout(() => setSetupAddedSuccess(false), 3000);
  };

  const handleDeleteSetup = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();

    const { error } = await supabase
      .from("organization_work_setups")
      .delete()
      .eq("id", id);

    if (!error) {
      setWorkSetups((prev) => prev.filter((s) => s.id !== id));
      if (workLocation === name) {
        setWorkLocation("");
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value.replace(/\D/g, ""));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");

    const newErrors: { fullName?: string } = {};
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (!userId) return;

    setIsSaving(true);

    const payload: Partial<Profile> = {
      id: userId,
      full_name: fullName,
      email: email,
      role_title: roleTitle,
      department: department,
      work_location: workLocation,
      selected_country: selectedCountry,
      phone_number: phoneNumber,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert([payload as unknown as Profile]);

    setIsSaving(false);

    if (error) {
      console.error("Error saving profile:", error.message);
      setSaveError(error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="text-xs">Loading profile settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} noValidate className="space-y-5">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Personal & Work Details
          </h2>
          <p className="text-[11px] text-slate-400">
            Your direct contact and work preference details visible to peers.
          </p>
        </div>
        <LogoutButton />
      </div>

      {saveError && (
        <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>Failed to save profile: {saveError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter full name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors({ ...errors, fullName: undefined });
            }}
            className={`w-full bg-slate-50 dark:bg-slate-800/80 border rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition mt-1 ${
              errors.fullName
                ? "border-rose-500/80 focus:border-rose-500"
                : "border-slate-200 dark:border-slate-700/80 focus:border-indigo-500"
            }`}
          />
          {errors.fullName && (
            <div className="flex items-center space-x-1 mt-1.5 text-rose-500 text-[11px] font-medium">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{errors.fullName}</span>
            </div>
          )}
        </div>

        {/* Work Email */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Work Email
          </label>
          <input
            type="email"
            disabled
            placeholder="name@company.com"
            value={email}
            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed mt-1 transition"
          />
        </div>

        {/* Position Title */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Company Position / Title
          </label>
          <input
            type="text"
            placeholder="Enter position / title"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 mt-1 transition"
          />
        </div>

        {/* CRUD Department Dropdown */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Department
          </label>
          <div className="relative mt-1" ref={deptRef}>
            <button
              type="button"
              onClick={() => {
                setIsDeptOpen(!isDeptOpen);
                setIsCountryOpen(false);
                setIsSetupOpen(false);
              }}
              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer transition"
            >
              <span className={department ? "text-slate-800 dark:text-slate-200" : "text-slate-400"}>
                {department || "Select or add department"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {deptAddedSuccess && (
              <p className="flex items-center space-x-1 mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" />
                <span>Department successfully added!</span>
              </p>
            )}

            {isDeptOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1">
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <div
                        key={dept.id}
                        onClick={() => {
                          setDepartment(dept.name);
                          setIsDeptOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition ${
                          department === dept.name
                            ? "bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{dept.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDepartment(e, dept.id, dept.name)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-xs text-slate-400">
                      No departments added yet
                    </div>
                  )}
                </div>

                {isAddingDept ? (
                  <div className="flex items-center space-x-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="New dept name..."
                      value={newDeptInput}
                      onChange={(e) => setNewDeptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDepartment();
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddDepartment}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded-lg shrink-0 transition cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingDept(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 shrink-0 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingDept(true)}
                    className="w-full flex items-center justify-center space-x-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add New Department</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CRUD Work Setup Dropdown */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Work Setup
          </label>
          <div className="relative mt-1" ref={setupRef}>
            <button
              type="button"
              onClick={() => {
                setIsSetupOpen(!isSetupOpen);
                setIsCountryOpen(false);
                setIsDeptOpen(false);
              }}
              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer transition"
            >
              <span className={workLocation ? "text-slate-800 dark:text-slate-200" : "text-slate-400"}>
                {workLocation || "Select or add work setup"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {setupAddedSuccess && (
              <p className="flex items-center space-x-1 mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" />
                <span>Work setup successfully added!</span>
              </p>
            )}

            {isSetupOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1">
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {workSetups.length > 0 ? (
                    workSetups.map((setup) => (
                      <div
                        key={setup.id}
                        onClick={() => {
                          setWorkLocation(setup.name);
                          setIsSetupOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition ${
                          workLocation === setup.name
                            ? "bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{setup.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSetup(e, setup.id, setup.name)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-xs text-slate-400">
                      No setups added yet
                    </div>
                  )}
                </div>

                {isAddingSetup ? (
                  <div className="flex items-center space-x-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="e.g. Flexible..."
                      value={newSetupInput}
                      onChange={(e) => setNewSetupInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSetup();
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSetup}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded-lg shrink-0 transition cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSetup(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 shrink-0 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingSetup(true)}
                    className="w-full flex items-center justify-center space-x-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add New Setup</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Searchable CP Number Picker */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            CP Number
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <div className="relative shrink-0" ref={countryRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCountryOpen(!isCountryOpen);
                  setIsDeptOpen(false);
                  setIsSetupOpen(false);
                }}
                className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <img
                  src={activeCountryObj.flagUrl}
                  alt={activeCountryObj.iso}
                  className="w-5 h-3.5 object-cover rounded-xs shadow-sm shrink-0"
                />
                <span className="font-medium">{activeCountryObj.iso}</span>
                <span className="text-slate-400">({activeCountryObj.callingCode})</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
              </button>

              {isCountryOpen && (
                <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1">
                  <div className="relative flex items-center mb-1">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                      ref={countrySearchRef}
                      type="text"
                      placeholder="Search country or code..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => (
                        <button
                          key={c.iso}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c.iso);
                            setIsCountryOpen(false);
                            setCountrySearch("");
                          }}
                          className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition ${
                            selectedCountry === c.iso
                              ? "bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <img
                            src={c.flagUrl}
                            alt={c.iso}
                            className="w-5 h-3.5 object-cover rounded-xs shadow-sm shrink-0"
                          />
                          <span className="w-8 font-medium">{c.iso}</span>
                          <span className="text-slate-400">{c.callingCode}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No country found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="Enter phone number"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {saved ? (
          <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            <span>Profile details saved successfully!</span>
          </span>
        ) : (
          <span />
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}