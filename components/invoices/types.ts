export interface Invoice {
  id: string;
  client_id: string;
  project_id?: string | null;
  company_name: string;
  project_title?: string;
  invoice_number: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  due_date: string;
  created_at?: string;
}

export interface ClientOption {
  id: string;
  company_name: string;
}