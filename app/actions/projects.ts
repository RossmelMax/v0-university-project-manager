"use server";

import { revalidatePath } from "next/cache";
import {
  CARRERAS,
  type SearchResult,
  type ThesisProject,
  type NewThesisProject,
  ProjectHistoryLog,
  PdfVersion,
} from "@/lib/projects";
import { adminDb } from "@/lib/firebase/admin";
import { getUserRole } from "@/app/actions/auth";

const FALLBACK_PROJECTS: ThesisProject[] = [
  {
    id: "fallback-1",
    title: "Sistema de gestión de inventarios para laboratorios",
    studentName: "María Fernanda Quiroga",
    career: "Ingeniería en Sistemas",
    year: 2024,
    abstract:
      "Plataforma para gestionar insumos, solicitudes y reportes de laboratorio con flujo de aprobación.",
    pdfUrl: null,
    createdAt: new Date("2024-01-15T00:00:00.000Z").toISOString(),
  },
  {
    id: "fallback-2",
    title: "Monitoreo remoto de equipos petroleros",
    studentName: "Carlos Alvarez",
    career: "Ingeniería Petrolera",
    year: 2023,
    abstract:
      "Sistema de monitoreo y alertas para equipos de producción usando sensores y dashboard web.",
    pdfUrl: null,
    createdAt: new Date("2023-08-20T00:00:00.000Z").toISOString(),
  },
];

async function ensureAdmin() {
  const role = await getUserRole();
  return role === "admin";
}

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
}

const PAGE_SIZE = 20;

export async function getProjects(includeDeleted: boolean = false): Promise<ThesisProject[]> {
  try {
    const snapshot = await adminDb
      .collection("projects")
      .orderBy("createdAt", "desc")
      .get();

    const projects = snapshot.docs.map((doc: any) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        title: data.title as string,
        studentName: data.studentName as string,
        career: data.career as string,
        year: data.year as number,
        abstract: data.abstract as string,
        tags: (data.tags as string[]) ?? [],
        pdfUrl: data.pdfUrl as string | null | undefined,
        userId: data.userId as string | null | undefined,
        createdAt: data.createdAt as string,
        deleted: data.deleted as boolean | undefined,
        deletedAt: data.deletedAt as string | null | undefined,
      };
    });

    if (!includeDeleted) {
      return projects.filter((p) => !p.deleted);
    }
    return projects;
  } catch (err) {
    console.error("Error obteniendo proyectos de Firestore:", err);
    return FALLBACK_PROJECTS as ThesisProject[];
  }
}

export async function getProjectsPaginated(
  lastDocId?: string,
  pageSize: number = PAGE_SIZE,
  includeDeleted: boolean = false
): Promise<PaginatedResult<ThesisProject>> {
  try {
    let query = adminDb
      .collection("projects")
      .orderBy("createdAt", "desc")
      .limit(pageSize + 1);

    if (lastDocId) {
      const lastDoc = await adminDb.collection("projects").doc(lastDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

    const projects = docs.map((doc) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        title: data.title as string,
        studentName: data.studentName as string,
        career: data.career as string,
        year: data.year as number,
        abstract: data.abstract as string,
        tags: (data.tags as string[]) ?? [],
        pdfUrl: data.pdfUrl as string | null | undefined,
        userId: data.userId as string | null | undefined,
        createdAt: data.createdAt as string,
        deleted: data.deleted as boolean | undefined,
        deletedAt: data.deletedAt as string | null | undefined,
      };
    });

    const filtered = includeDeleted ? projects : projects.filter((p) => !p.deleted);
    return { items: filtered, hasMore };
  } catch (err) {
    console.error("Error obteniendo proyectos paginados:", err);
    return { items: FALLBACK_PROJECTS as ThesisProject[], hasMore: false };
  }
}

async function addHistoryLog(
  projectId: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "PDF_UPLOAD",
  details: string,
) {
  try {
    const role = await getUserRole();
    await adminDb
      .collection("projects")
      .doc(projectId)
      .collection("history")
      .add({
        projectId,
        action,
        details,
        timestamp: new Date().toISOString(),
        userRole: role,
      });
  } catch (err) {
    console.error("Error guardando el historial:", err);
  }
}

export async function createProject(input: {
  title: string;
  studentName: string;
  career: string;
  year: number;
  abstract: string;
  pdfUrl?: string | null;
  tags?: string[];
}) {
  const title = input.title.trim();
  const studentName = input.studentName.trim();
  const career = input.career.trim();
  const abstract = input.abstract.trim();
  const tags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean);

  if (!title || !studentName || !career) {
    return {
      ok: false as const,
      error: "El título, el nombre del alumno y la carrera son obligatorios.",
    };
  }
  if (!CARRERAS.includes(career as any)) {
    return {
      ok: false as const,
      error: "La carrera seleccionada no es válida.",
    };
  }
  if (!Number.isInteger(input.year) || input.year < 1980 || input.year > 2100) {
    return { ok: false as const, error: "El año no es válido." };
  }
  if (!(await ensureAdmin())) {
    return {
      ok: false as const,
      error: "Solo los administradores pueden registrar proyectos.",
    };
  }

  try {
    const newProject: NewThesisProject = {
      title: input.title.trim(),
      studentName: input.studentName.trim(),
      career: input.career.trim(),
      year: input.year,
      abstract: input.abstract.trim(),
      tags,
      pdfUrl: input.pdfUrl ?? null,
    };

    const docRef = await adminDb.collection("projects").add({
      ...newProject,
      createdAt: new Date().toISOString(),
      deleted: false,
      deletedAt: null,
    });

    await addHistoryLog(
      docRef.id,
      "CREATE",
      "Proyecto creado. Alumno: " + newProject.studentName,
    );

    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error("Error al crear proyecto en Firestore:", err);
    return {
      ok: false as const,
      error: "No se pudo guardar el proyecto en la nube.",
    };
  }
}

export async function updateProject(
  id: string,
  input: {
    title: string;
    studentName: string;
    career: string;
    year: number;
    abstract: string;
    pdfUrl?: string | null;
    tags?: string[];
  },
) {
  if (!(await ensureAdmin())) {
    return {
      ok: false as const,
      error: "Solo los administradores pueden editar proyectos.",
    };
  }

  try {
    const docRef = adminDb.collection("projects").doc(id);
    const oldDoc = await docRef.get();

    if (!oldDoc.exists) {
      return { ok: false as const, error: "El proyecto no existe." };
    }

    const oldData = oldDoc.data() as any;
    const changes: string[] = [];

    if (oldData.title !== input.title) changes.push("Título modificado");
    if (oldData.studentName !== input.studentName)
      changes.push("Autor modificado");
    if (oldData.abstract !== input.abstract)
      changes.push("Resumen actualizado");
    if (oldData.pdfUrl !== input.pdfUrl) {
      changes.push(input.pdfUrl ? "PDF subido/actualizado" : "PDF eliminado");
    }
    const newTags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean);
    const oldTags = (oldData.tags as string[]) ?? [];
    if (JSON.stringify(oldTags.sort()) !== JSON.stringify(newTags.sort())) {
      changes.push("Etiquetas actualizadas");
    }

    if (changes.length === 0) {
      return { ok: true as const };
    }

    await docRef.update({
      title: input.title,
      studentName: input.studentName,
      career: input.career,
      year: input.year,
      abstract: input.abstract,
      tags: newTags,
      pdfUrl: input.pdfUrl ?? null,
    });

    const actionType =
      oldData.pdfUrl !== input.pdfUrl ? "PDF_UPLOAD" : "UPDATE";
    await addHistoryLog(id, actionType as any, changes.join(", "));

    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error("Error al actualizar proyecto en Firestore:", err);
    return { ok: false as const, error: "No se pudo actualizar el proyecto." };
  }
}

export async function getProjectHistory(
  projectId: string,
): Promise<ProjectHistoryLog[]> {
  try {
    const snapshot = await adminDb
      .collection("projects")
      .doc(projectId)
      .collection("history")
      .orderBy("timestamp", "desc")
      .get();

    return snapshot.docs.map(
      (doc: any) => ({
        id: doc.id,
        ...(doc.data() as Omit<ProjectHistoryLog, "id">),
      }),
    );
  } catch (err) {
    console.error("Error obteniendo el historial:", err);
    return [];
  }
}

export async function deleteProject(id: string) {
  if (!(await ensureAdmin())) {
    return {
      ok: false as const,
      error: "Solo los administradores pueden eliminar proyectos.",
    };
  }

  try {
    await adminDb.collection("projects").doc(id).update({
      deleted: true,
      deletedAt: new Date().toISOString(),
    });

    await addHistoryLog(id, "DELETE" as any, "Proyecto eliminado (soft delete)");

    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error("Error al eliminar proyecto:", err);
    return { ok: false as const, error: "No se pudo eliminar el proyecto." };
  }
}

export async function permanentlyDeleteProject(id: string) {
  if (!(await ensureAdmin())) {
    return {
      ok: false as const,
      error: "Solo los administradores pueden eliminar proyectos permanentemente.",
    };
  }

  try {
    const historySnapshot = await adminDb
      .collection("projects")
      .doc(id)
      .collection("history")
      .get();

    const batch = adminDb.batch();
    historySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.delete(adminDb.collection("projects").doc(id));
    await batch.commit();

    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error("Error al eliminar proyecto permanentemente:", err);
    return { ok: false as const, error: "No se pudo eliminar permanentemente." };
  }
}

export async function restoreProject(id: string) {
  if (!(await ensureAdmin())) {
    return {
      ok: false as const,
      error: "Solo los administradores pueden restaurar proyectos.",
    };
  }

  try {
    await adminDb.collection("projects").doc(id).update({
      deleted: false,
      deletedAt: null,
    });

    await addHistoryLog(id, "RESTORE" as any, "Proyecto restaurado");

    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error("Error al restaurar proyecto:", err);
    return { ok: false as const, error: "No se pudo restaurar el proyecto." };
  }
}

export async function getDeletedProjects(): Promise<ThesisProject[]> {
  if (!(await ensureAdmin())) {
    return [];
  }

  try {
    const snapshot = await adminDb
      .collection("projects")
      .where("deleted", "==", true)
      .orderBy("deletedAt", "desc")
      .get();

    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        title: data.title as string,
        studentName: data.studentName as string,
        career: data.career as string,
        year: data.year as number,
        abstract: data.abstract as string,
        tags: (data.tags as string[]) ?? [],
        pdfUrl: data.pdfUrl as string | null | undefined,
        userId: data.userId as string | null | undefined,
        createdAt: data.createdAt as string,
        deleted: data.deleted as boolean | undefined,
        deletedAt: data.deletedAt as string | null | undefined,
      };
    });
  } catch (err) {
    console.error("Error obteniendo proyectos eliminados:", err);
    return [];
  }
}

export async function getPdfHistory(
  projectId: string
): Promise<PdfVersion[]> {
  try {
    const snapshot = await adminDb
      .collection("projects")
      .doc(projectId)
      .collection("pdfHistory")
      .orderBy("uploadedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        url: data.url as string,
        uploadedAt: data.uploadedAt as string,
      };
    });
  } catch (err) {
    console.error("Error obteniendo historial de PDFs:", err);
    return [];
  }
}

export interface TopContributor {
  userRole: string;
  count: number;
}

/**
 * Obtiene el top N usuarios que más cambios hicieron
 * consultando la subcolección "history" de todos los proyectos.
 */
export async function getTopContributors(limit: number = 3): Promise<TopContributor[]> {
  try {
    // Obtenemos todos los proyectos para acceder a sus subcolecciones
    const projectsSnapshot = await adminDb
      .collection("projects")
      .select() // solo IDs
      .get();

    const roleCount: Record<string, number> = {};

    // Para cada proyecto, leemos su subcolección history
    const promises = projectsSnapshot.docs.map(async (projectDoc) => {
      try {
        const historySnapshot = await projectDoc.ref
          .collection("history")
          .get();
        historySnapshot.docs.forEach((historyDoc) => {
          const data = historyDoc.data();
          const role = (data.userRole as string) || "unknown";
          roleCount[role] = (roleCount[role] || 0) + 1;
        });
      } catch {
        // Ignorar proyectos sin subcolección history
      }
    });

    await Promise.all(promises);

    return Object.entries(roleCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([userRole, count]) => ({ userRole, count }));
  } catch (err) {
    console.error("Error obteniendo top contributors:", err);
    return [];
  }
}

export async function getProjectById(
  projectId: string
): Promise<ThesisProject | null> {
  try {
    const doc = await adminDb.collection("projects").doc(projectId).get();
    if (!doc.exists) return null;
    const data = doc.data() as any;
    if (data.deleted) return null;
    return {
      id: doc.id,
      title: data.title as string,
      studentName: data.studentName as string,
      career: data.career as string,
      year: data.year as number,
      abstract: data.abstract as string,
      tags: (data.tags as string[]) ?? [],
      pdfUrl: data.pdfUrl as string | null | undefined,
      userId: data.userId as string | null | undefined,
      createdAt: data.createdAt as string,
    };
  } catch (err) {
    console.error("Error obteniendo proyecto por ID:", err);
    return null;
  }
}

/**
 * Normaliza texto para búsqueda: quita tildes, mayúsculas y caracteres especiales
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calcula distancia de Levenshtein simple entre dos strings
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Tokeniza el texto en palabras clave individuales
 */
function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(Boolean);
}

export async function searchProjects(
  query: string,
  filters?: {
    career?: string;
    yearFrom?: number;
    yearTo?: number;
  }
): Promise<SearchResult[]> {
  const q = query.trim();
  const allProjects = await getProjects();

  // Aplicar filtros previos (se aplican ANTES de la búsqueda por texto)
  let filtered = allProjects;
  if (filters?.career) {
    filtered = filtered.filter((p) => p.career === filters.career);
  }
  if (filters?.yearFrom !== undefined) {
    filtered = filtered.filter((p) => Number(p.year) >= filters.yearFrom!);
  }
  if (filters?.yearTo !== undefined) {
    filtered = filtered.filter((p) => Number(p.year) <= filters.yearTo!);
  }

  if (!q) {
    return filtered.map((p) => ({ ...p, score: 0 }));
  }

  const normalizedQuery = normalize(q);
  const queryTokens = tokenize(q);

  const results = filtered
    .map((project) => {
      const title = normalize(project.title);
      const abstract = normalize(project.abstract || "");
      const studentName = normalize(project.studentName);
      const career = normalize(project.career);
      const tagsText = normalize((project.tags ?? []).join(" "));
      const allText = `${title} ${abstract} ${studentName} ${career} ${tagsText}`;

      let score = 0;

      // 1. Coincidencia exacta del query en el título (máxima prioridad)
      if (title.includes(normalizedQuery)) {
        score += 50;
      }

      // 2. Coincidencia exacta en nombre del alumno
      if (studentName.includes(normalizedQuery)) {
        score += 40;
      }

      // 3. Coincidencia exacta en texto completo
      if (allText.includes(normalizedQuery)) {
        score += 30;
      }

      // 4. Coincidencia por tokens individuales (permite búsqueda parcial)
      let tokenMatches = 0;
      for (const token of queryTokens) {
        if (token.length < 2) continue; // ignora tokens muy cortos

        // Palabras completas
        const tokenRegex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (tokenRegex.test(title)) tokenMatches += 10;
        else if (tokenRegex.test(abstract)) tokenMatches += 5;
        else if (tokenRegex.test(studentName)) tokenMatches += 3;
        else if (tokenRegex.test(career)) tokenMatches += 2;
        else if (tokenRegex.test(tagsText)) tokenMatches += 4;

        // Fuzzy match: palabras que contengan el token
        if (title.includes(token)) tokenMatches += 2;
        if (abstract.includes(token)) tokenMatches += 1;
      }
      score += tokenMatches;

      // 5. Fuzzy match Levenshtein para palabras de 4+ caracteres
      // Solo como bonus si hubo poca coincidencia directa
      if (score < 10) {
        for (const token of queryTokens) {
          if (token.length < 4) continue;
          const projectTokens = tokenize(allText);
          for (const pt of projectTokens) {
            if (pt.length < 4) continue;
            const dist = levenshtein(token, pt);
            const maxLen = Math.max(token.length, pt.length);
            if (dist <= 1) {
              score += 15; // match casi exacto (1 transposición/error)
            } else if (dist <= Math.ceil(maxLen * 0.25)) {
              score += 8; // match aproximado
            }
          }
        }
      }

      // 6. Bonus por año reciente (proyectos más nuevos primero)
      const yearBonus = Math.max(0, (project.year - 2018) * 0.5);
      score += yearBonus;

      return { ...project, score };
    })
    .filter((project) => project.score > 0)
    .sort((a, b) => {
      // Ordenar por score descendente, luego año descendente
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return b.year - a.year;
    });

  return results;
}
