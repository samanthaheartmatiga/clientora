export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Pending";
}

export interface ActivityLog {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  timestamp: string;
  ip_address: string;
  device: string;
}

export type SettingsTabType = "profile" | "team" | "history";