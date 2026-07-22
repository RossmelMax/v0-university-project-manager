// lib/projects.ts

export const CARRERAS = [
  "Ingeniería en Sistemas",
  "Ingeniería en Telecomunicaciones",
  "Ingeniería Petrolera",
] as const;

export type UserRole = "anonymous" | "admin";

export interface ThesisProject {
  id: string;
  title: string;
  studentName: string;
  career: string;
  year: number;
  abstract: string;
  pdfUrl?: string | null;
  userId?: string | null;
  createdAt: string;
  deleted?: boolean;
  deletedAt?: string | null;
}

// Tipo de utilidad para cuando vamos a insertar un proyecto nuevo
export type NewThesisProject = Omit<ThesisProject, "id" | "createdAt">;

export type SearchResult = ThesisProject & {
  score?: number;
};

export type AuditActionType = "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "PDF_UPLOAD";

export interface ProjectHistoryLog {
  id: string;
  projectId: string;
  action: AuditActionType;
  details: string; // Ej: "Se cambió el título de A a B"
  timestamp: string;
  userRole: UserRole;
}
