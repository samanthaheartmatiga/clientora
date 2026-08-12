"use client";

import React from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction, FeatureModule, ActionType } from "@/lib/permissions";

interface PermissionGuardProps {
  module: FeatureModule;
  action: ActionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  module,
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { role, loading } = useUserRole();

  if (loading) return null;

  if (canPerformAction(role, module, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}