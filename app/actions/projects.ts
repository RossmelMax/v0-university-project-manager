"use server";

import { db } from "@/lib/db";
import { thesisProjects, type NewThesisProject } from "@/lib/db/schema";
import { CARRERAS, type SearchResult } from "@/lib/projects";
import { desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseFetch(path: string, opts?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase configuration missing");
  }

  const url = SUPABASE_URL.replace(/\/$/, "") + "/rest/v1" + path;
  const headers: Record<string, string> = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const res = await fetch(url, { headers, ...opts });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }
  return res.json();
}

const FALLBACK_PROJECTS = [
  {
    id: 1,
    title: "Sistema de gestión de inventarios para laboratorios",
    studentName: "María Fernanda Quiroga",
    career: "Ingeniería en Sistemas",
    year: 2024,
    abstract:
      "Plataforma para gestionar insumos, solicitudes y reportes de laboratorio con flujo de aprobación.",
    pdfUrl: null as string | null,
    createdAt: new Date("2024-01-15T00:00:00.000Z"),
  },
  {
    id: 2,
    title: "Monitoreo remoto de equipos petroleros",
    studentName: "Carlos Alvarez",
    career: "Ingeniería Petrolera",
    year: 2023,
    abstract:
      "Sistema de monitoreo y alertas para equipos de producción usando sensores y dashboard web.",
    pdfUrl: null as string | null,
    createdAt: new Date("2023-08-20T00:00:00.000Z"),
  },
] as const;

function toSearchResult(row: (typeof FALLBACK_PROJECTS)[number]): SearchResult {
  return {
    id: row.id,
    title: row.title,
    studentName: row.studentName,
    career: row.career,
    year: row.year,
    abstract: row.abstract,
    score: 0,
  };
}

async function ensureAdmin() {
  try {
    const store = await cookies();
    const value =
      typeof store.get === "function"
        ? store.get("udabol_session")?.value
        : undefined;
    return value === "admin";
  } catch (e) {
    return false;
  }
}

export async function getProjects() {
  // Prefer Supabase REST first (more likely to be reachable from cloud)
  try {
    const items = await supabaseFetch(`/thesis_projects?select=*`);
    return (items as any[]).map((it) => ({
      id: Number(it.id),
      title: it.title,
      studentName: it.student_name,
      career: it.career,
      year: Number(it.year),
      abstract: it.abstract ?? "",
      pdfUrl: it.pdf_url ?? null,
      createdAt: new Date(it.created_at),
    }));
  } catch (restErr) {
    try {
      const rows = await db
        .select()
        .from(thesisProjects)
        .orderBy(desc(thesisProjects.createdAt));
      return rows;
    } catch (dbErr) {
      console.warn(
        "No se pudo obtener proyectos (REST y DB fallaron). Usando datos de respaldo.",
        { restErr, dbErr },
      );
      return FALLBACK_PROJECTS.map((project) => ({ ...project }));
    }
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
  if (!CARRERAS.includes(career as (typeof CARRERAS)[number])) {
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

  // Prefer Supabase REST for writes first
  try {
    await supabaseFetch(`/thesis_projects`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        title,
        student_name: studentName,
        career,
        year: input.year,
        abstract,
        pdf_url: input.pdfUrl ?? null,
      }),
    });
    revalidatePath("/");
    return { ok: true as const };
  } catch (restErr) {
    // If REST fails, try direct DB insert
    try {
      const newProject: NewThesisProject = {
        title,
        studentName,
        career,
        year: input.year,
        abstract,
        pdfUrl: input.pdfUrl ?? null,
      };
      await db.insert(thesisProjects).values(newProject);
      revalidatePath("/");
      return { ok: true as const };
    } catch (dbErr) {
      console.error("No se pudo guardar el proyecto (REST y DB fallaron).", {
        restErr,
        dbErr,
      });
      return {
        ok: false as const,
        error:
          "No se pudo guardar el proyecto porque la base de datos no está disponible. Configura DATABASE_URL o conecta Supabase para habilitar el guardado.",
      };
    }
  }
}

export async function updateProject(
  id: number,
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

  // Prefer Supabase REST for update first
  try {
    await supabaseFetch(`/thesis_projects?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        title: input.title,
        student_name: input.studentName,
        career: input.career,
        year: input.year,
        abstract: input.abstract,
        pdf_url: input.pdfUrl ?? null,
      }),
    });
    revalidatePath("/");
    return { ok: true as const };
  } catch (restErr) {
    try {
      await db
        .update(thesisProjects)
        .set({
          title: input.title,
          studentName: input.studentName,
          career: input.career,
          year: input.year,
          abstract: input.abstract,
          pdfUrl: input.pdfUrl ?? null,
        })
        .where(sql`${thesisProjects.id} = ${id}`);
      revalidatePath("/");
      return { ok: true as const };
    } catch (dbErr) {
      console.error("No se pudo actualizar el proyecto (REST y DB fallaron).", {
        restErr,
        dbErr,
      });
      return {
        ok: false as const,
        error: "No se pudo actualizar el proyecto.",
      };
    }
  }
}

export async function deleteProject(id: number) {
  if (!(await ensureAdmin())) {
    return {
      ok: false as const,
      error: "Solo los administradores pueden eliminar proyectos.",
    };
  }

  // Prefer Supabase REST for delete first
  try {
    await supabaseFetch(`/thesis_projects?id=eq.${id}`, { method: "DELETE" });
    revalidatePath("/");
    return { ok: true as const };
  } catch (restErr) {
    try {
      await db.delete(thesisProjects).where(sql`${thesisProjects.id} = ${id}`);
      revalidatePath("/");
      return { ok: true as const };
    } catch (dbErr) {
      console.error("No se pudo eliminar el proyecto (REST y DB fallaron).", {
        restErr,
        dbErr,
      });
      return { ok: false as const, error: "No se pudo eliminar el proyecto." };
    }
  }
}

export async function searchProjects(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) {
    const rows = await getProjects();
    return rows.map((r) => ({ ...r, score: 0 }));
  }

  try {
    const like = `%${q}%`;
    const rows = await db.execute(sql`
      SELECT
        id,
        title,
        student_name AS "studentName",
        career,
        year,
        abstract,
        GREATEST(
          word_similarity(${q}, title),
          word_similarity(${q}, abstract),
          word_similarity(${q}, student_name),
          word_similarity(${q}, career)
        ) AS score
      FROM thesis_projects
      WHERE
        ${q} <% title
        OR ${q} <% abstract
        OR ${q} <% student_name
        OR ${q} <% career
        OR title ILIKE ${like}
        OR abstract ILIKE ${like}
        OR student_name ILIKE ${like}
        OR career ILIKE ${like}
      ORDER BY score DESC, year DESC
      LIMIT 50
    `);

    return (rows.rows as Record<string, unknown>[]).map((r) => ({
      id: Number(r.id),
      title: String(r.title),
      studentName: String(r.studentName),
      career: String(r.career),
      year: Number(r.year),
      abstract: String(r.abstract ?? ""),
      score: Number(r.score ?? 0),
    }));
  } catch (error) {
    console.warn(
      "La búsqueda no pudo usar la base de datos. Usando resultados de respaldo.",
      error,
    );
    return (
      FALLBACK_PROJECTS.filter((project) => {
        const hayCoincidencia = [
          project.title,
          project.abstract,
          project.studentName,
          project.career,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());

        return hayCoincidencia;
      }) as (typeof FALLBACK_PROJECTS)[number][]
    ).map(toSearchResult);
  }
}
