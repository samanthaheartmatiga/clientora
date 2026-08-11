export interface ClientOption {
  id: string;
  company_name: string;
  email?: string | null;
}

export interface ProjectOption {
  id: string;
  title: string;
  client_id?: string;
}

export interface Meeting {
  id: string;
  client_id: string;
  project_id?: string | null;
  company_name?: string;
  project_title?: string;
  title: string;
  meeting_type: "Online" | "In-Person";
  meeting_date: string;
  start_time: string;
  duration_minutes: number;
  meeting_link?: string | null;
  location?: string | null;
  status: "Scheduled" | "Completed" | "Canceled";
  notes?: string | null;
  created_at?: string;
}