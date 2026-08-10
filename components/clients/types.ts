export interface Client {
  id: string;
  company_name: string;
  contact_email: string;
  status: "Active" | "Lead" | "Archived";
  project_count?: number;
  created_at: string;
}