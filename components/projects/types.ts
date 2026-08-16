export interface Project {
  id: string;
  client_id: string;
  company_name?: string;
  title: string;
  status: "Planning" | "In Progress" | "Review" | "Completed";
  budget: number;
  due_date: string;
  created_at?: string;
}

export interface ClientOption {
  id: string;
  company_name: string;
}