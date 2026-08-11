export interface FileItem {
  id: string;
  name: string;          // The actual file path/name in Supabase storage
  displayName: string;   // Clean readable name shown in UI
  size: number;
  created_at: string;
  publicUrl: string;
  project_id?: string | null;
  project_title?: string | null;
}

export interface ProjectOption {
  id: string;
  title: string;
}

export type FileCategory = "All" | "Documents" | "Images" | "Archives";