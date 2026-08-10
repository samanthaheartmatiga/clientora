export interface Project {
  id: string;
  name: string;
  client_name: string;
  status: "In Progress" | "Completed" | "On Hold";
  budget: number;
  due_date: string;
  created_at?: string;
}