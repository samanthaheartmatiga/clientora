export type AppRole = "superadmin" | "admin" | "member" | "viewer";

export interface RoleConfig {
  label: string;
  level: number;
  description: string;
  badgeStyle: string;
}

export const ROLES: Record<AppRole, RoleConfig> = {
  superadmin: {
    label: "Super Admin",
    level: 4,
    description: "Full system access, workspace management, and billing control",
    badgeStyle:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  admin: {
    label: "Admin / Operations",
    level: 3,
    description: "Operations and team lead role focused on day-to-day workspace execution",
    badgeStyle:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  member: {
    label: "Project Member",
    level: 2,
    description: "Execution-level team member handling assigned projects and client tasks",
    badgeStyle:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  viewer: {
    label: "Viewer (Read-Only)",
    level: 1,
    description: "Read-only access across workspace dashboards and reports",
    badgeStyle:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

export function hasPermission(userRole: AppRole, minRequiredRole: AppRole): boolean {
  return (ROLES[userRole]?.level ?? 1) >= (ROLES[minRequiredRole]?.level ?? 1);
}

export type FeatureModule =
  | "clients"
  | "projects"
  | "invoices"
  | "templates"
  | "meetings"
  | "files"
  | "team_directory";

export type ActionType = "create" | "read" | "update" | "delete";

export function canPerformAction(
  userRole: AppRole,
  module: FeatureModule,
  action: ActionType
): boolean {
  // Super Admin: Full system access
  if (userRole === "superadmin") return true;

  // All authenticated users can read workspace items
  if (action === "read") return true;

  // Viewers: Read-Only
  if (userRole === "viewer") return false;

  // Admin / Operations
  if (userRole === "admin") {
    // Delete restricted to Templates, Meetings, and Files
    if (action === "delete") {
      return module === "templates" || module === "meetings" || module === "files";
    }

    // Create & Update across operational modules + Team Directory
    if (
      module === "clients" ||
      module === "projects" ||
      module === "invoices" ||
      module === "templates" ||
      module === "meetings" ||
      module === "files" ||
      module === "team_directory"
    ) {
      return action === "create" || action === "update";
    }

    return false;
  }

  // Project Member
  if (userRole === "member") {
    if (action === "delete") return false;

    if (module === "projects" || module === "meetings") {
      return action === "create" || action === "update";
    }

    if (module === "files") {
      return action === "create";
    }

    return false;
  }

  return false;
}