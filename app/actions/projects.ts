"use server"

import { db } from "@/lib/db"
import { thesisProjects, type NewThesisProject } from "@/lib/db/schema"
import { CARRERAS, type SearchResult } from "@/lib/projects"
import { desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getProjects() {
  const rows = await db.select().from(thesisProjects).orderBy(desc(thesisProjects.createdAt))
  return rows
}

export async function createProject(input: {
  title: string
  studentName: string
  career: string
  year: number
  abstract: string
  advisor?: string
}) {
  const title = input.title.trim()
  const studentName = input.studentName.trim()
  const career = input.career.trim()
  const abstract = input.abstract.trim()
  const advisor = (input.advisor ?? "").trim()

  if (!title || !studentName || !career) {
    return { ok: false as const, error: "El título, el nombre del alumno y la carrera son obligatorios." }
  }
  if (!CARRERAS.includes(career as (typeof CARRERAS)[number])) {
    return { ok: false as const, error: "La carrera seleccionada no es válida." }
  }
  if (!Number.isInteger(input.year) || input.year < 1980 || input.year > 2100) {
    return { ok: false as const, error: "El año no es válido." }
  }

  const newProject: NewThesisProject = { title, studentName, career, year: input.year, abstract, advisor }
  await db.insert(thesisProjects).values(newProject)
  revalidatePath("/")
  return { ok: true as const }
}

/**
 * Búsqueda "semántica" simple basada en similitud de texto (pg_trgm).
 * Combina la similitud del título, resumen, alumno y carrera para encontrar
 * proyectos parecidos aunque haya errores de tipeo o palabras incompletas.
 */
export async function searchProjects(query: string): Promise<SearchResult[]> {
  const q = query.trim()
  if (!q) {
    const rows = await getProjects()
    return rows.map((r) => ({ ...r, score: 0 }))
  }

  const like = `%${q}%`
  const rows = await db.execute(sql`
    SELECT
      id,
      title,
      student_name AS "studentName",
      career,
      year,
      abstract,
      advisor,
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
  `)

  return (rows.rows as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    studentName: String(r.studentName),
    career: String(r.career),
    year: Number(r.year),
    abstract: String(r.abstract ?? ""),
    advisor: r.advisor ? String(r.advisor) : null,
    score: Number(r.score ?? 0),
  }))
}
