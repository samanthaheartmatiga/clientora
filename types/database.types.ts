export type UserRole = 'Admin' | 'Staff' | 'Client';
export type ProjectStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed';
export type InvoiceStatus = 'Pending' | 'Paid' | 'Overdue';

export interface Profile {
  id: string;
  role_id: number;
  full_name: string;
  email: string;
  created_at?: string;
}

export interface Client {
  id: string;
  company_name: string;
  contact_email: string;
  status: 'Active' | 'Lead' | 'Archived';
  created_at?: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  status: ProjectStatus;
  budget: number;
  due_date: string;
  created_at?: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  created_at?: string;
}