export interface Template {
  id: string;
  title: string;
  category: "Proposal" | "Contract" | "Invoice" | "Email" | "Scope";
  description: string;
  file_url: string;
  file_name: string;
  file_size?: number | null;
  created_at?: string;
}