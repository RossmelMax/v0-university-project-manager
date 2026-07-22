"use server";

import { type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import {
  CARRERAS,
  type SearchResult,
  type ThesisProject,
  type NewThesisProject,
  ProjectHistoryLog,
} from "@/lib/projects";
import { adminDb } from "@/lib/firebase/admin";
import { getUserRole } from "@/app/actions/auth";

// Actualizamos los IDs de respaldo a strings
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

export async function getProjects(): Promise<ThesisProject[]> {
  try {
    const snapshot = await adminDb
      .collection("projects")
      .orderBy("createdAt", "desc")
      .get();

    // Ahora usamos QueryDocumentSnapshot tipado contra DocumentData
    return snapshot.docs.map((doc: QueryDocumentSnapshot<ThesisProject>) => {
      const data = doc.data();
      // Construimos el objeto respetando ThesisProject estrictamente
      return {
        id: doc.id,
        title: data.title as string,
        studentName: data.studentName as string,
        career: data.career as string,
        year: data.year as number,
        abstract: data.abstract as string,
        pdfUrl: data.pdfUrl as string | null | undefined,
        userId: data.userId as string | null | undefined,
        createdAt: data.createdAt as string,
      };
    });
  } catch (err) {
    console.error("Error obteniendo proyectos de Firestore:", err);
    return FALLBACK_PROJECTS;
  }
}

async function addHistoryLog(
  projectId: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "PDF_UPLOAD",
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
    // No lanzamos error para no bloquear la operación principal
  }
}

export async function createProject(input: {
  title: string;
  studentName: string;
  career: string;
  year: number;
  abstract: string;
  pdfUrl?: string | null;
}) {
  const title = input.title.trim();
  const studentName = input.studentName.trim();
  const career = input.career.trim();
  const abstract = input.abstract.trim();

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
      pdfUrl: input.pdfUrl ?? null,
    };

    // 1. Guardamos el proyecto
    const docRef = await adminDb.collection("projects").add({
      ...newProject,
      createdAt: new Date().toISOString(),
    });

    // 2. Registramos el historial en la subcolección del nuevo ID
    await addHistoryLog(
      docRef.id,
      "CREATE",
      `Proyecto creado en el sistema. Alumno: ${newProject.studentName}`,
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

    const oldData = oldDoc.data() as ThesisProject;
    const changes: string[] = [];

    // Hacemos un diff manual para saber qué cambió
    if (oldData.title !== input.title) changes.push(`Título modificado`);
    if (oldData.studentName !== input.studentName)
      changes.push(`Autor modificado`);
    if (oldData.abstract !== input.abstract)
      changes.push(`Resumen actualizado`);
    if (oldData.pdfUrl !== input.pdfUrl) {
      changes.push(input.pdfUrl ? `PDF subido/actualizado` : `PDF eliminado`);
    }

    // Si no hay cambios reales, no hacemos nada
    if (changes.length === 0) {
      return { ok: true as const };
    }

    // 1. Actualizamos el documento
    await docRef.update({
      title: input.title,
      studentName: input.studentName,
      career: input.career,
      year: input.year,
      abstract: input.abstract,
      pdfUrl: input.pdfUrl ?? null,
    });

    // 2. Guardamos el registro con los detalles exactos
    const actionType =
      oldData.pdfUrl !== input.pdfUrl ? "PDF_UPLOAD" : "UPDATE";
    await addHistoryLog(id, actionType, changes.join(", "));

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
      (doc: QueryDocumentSnapshot<ProjectHistoryLog>) => ({
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
    // 1. Obtenemos todos los logs de la subcolección 'history'
    const historySnapshot = await adminDb
      .collection("projects")
      .doc(id)
      .collection("history")
      .get();

    // 2. Preparamos un "Batch" (lote de operaciones)
    const batch = adminDb.batch();

    // Agregamos cada log a la lista de ejecución (para borrarlos)
    historySnapshot.docs.forEach(
      (doc: QueryDocumentSnapshot<ProjectHistoryLog>) => {
        batch.delete(doc.ref);
      },
    );

    // 3. Agregamos el documento principal del proyecto a la lista de ejecución
    const projectRef = adminDb.collection("projects").doc(id);
    batch.delete(projectRef);

    // 4. Ejecutamos todo de un solo golpe
    await batch.commit();

    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error(
      "Error al eliminar proyecto y su historial en Firestore:",
      err,
    );
    return { ok: false as const, error: "No se pudo eliminar el proyecto." };
  }
}

export async function searchProjects(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  const allProjects = await getProjects();

  if (!q) {
    return allProjects.map((p) => ({ ...p, score: 0 }));
  }

  // Calculamos el score de búsqueda en memoria
  const results = allProjects
    .map((project) => {
      let score = 0;
      const searchableText =
        `${project.title} ${project.abstract} ${project.studentName} ${project.career}`.toLowerCase();

      if (searchableText.includes(q)) {
        score += 10;
        // Puntos extra si coincide exactamente con el título o nombre
        if (project.title.toLowerCase().includes(q)) score += 5;
        if (project.studentName.toLowerCase().includes(q)) score += 5;
      }

      return { ...project, score };
    })
    .filter((project) => project.score > 0)
    .sort((a, b) => b.score - a.score || b.year - a.year);

  return results;
}
