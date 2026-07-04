export const CARRERAS = [
  "Ingeniería en Sistemas",
  "Ingeniería en Telecomunicaciones",
  "Ingeniería Petrolera",
] as const;

export type SearchResult = {
  id: number;
  title: string;
  studentName: string;
  career: string;
  year: number;
  abstract: string;
  score: number;
  pdfUrl?: string | null;
};

export type UserRole = "anonymous" | "admin";
