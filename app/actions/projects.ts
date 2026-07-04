"use server"

import { db } from "@/lib/db"
import { thesisProjects, projectPdfs } from "@/lib/db/schema"
import { CARRERAS, type SearchResult } from "@/lib/projects"
import { getCurrentUser } from "./auth"
import { desc, sql, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"

export async function getProjects() {
  const rows = await db.select().from(thesisProjects).orderBy(desc(thesisProjects.createdAt))
  return rows
}

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
    score: Number(r.score ?? 0),
  }))
}

export async function createProject(data: {
  title: string
  studentName: string
  career: string
  year: number
  abstract: string
  pdfUrl?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("No autorizado")

  const title = data.title.trim()
  const studentName = data.studentName.trim()
  const career = data.career.trim()
  const abstract = data.abstract.trim()

  if (!title || !studentName || !career) {
    throw new Error("El título, el nombre del alumno y la carrera son obligatorios.")
  }
  if (!CARRERAS.includes(career as (typeof CARRERAS)[number])) {
    throw new Error("La carrera seleccionada no es válida.")
  }
  if (!Number.isInteger(data.year) || data.year < 1980 || data.year > 2100) {
    throw new Error("El año no es válido.")
  }

  const result = await db
    .insert(thesisProjects)
    .values({
      title,
      studentName,
      career,
      year: data.year,
      abstract,
      userId: user.id,
    })
    .returning({ id: thesisProjects.id })

  if (result.length > 0 && data.pdfUrl) {
    await db.insert(projectPdfs).values({
      projectId: result[0].id,
      pdfUrl: data.pdfUrl,
    })
  }

  revalidatePath("/")
  return result[0]
}

export async function updateProject(
  projectId: number,
  data: {
    title: string
    studentName: string
    career: string
    year: number
    abstract: string
    pdfUrl?: string
  }
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("No autorizado")

  // Verificar que el usuario es el propietario
  const project = await db.query.thesisProjects.findFirst({
    where: eq(thesisProjects.id, projectId),
  })

  if (!project || (user.role === "admin" && project.userId !== user.id)) {
    throw new Error("No tienes permisos para editar este proyecto")
  }

  const title = data.title.trim()
  const studentName = data.studentName.trim()
  const career = data.career.trim()
  const abstract = data.abstract.trim()

  if (!title || !studentName || !career) {
    throw new Error("El título, el nombre del alumno y la carrera son obligatorios.")
  }

  await db
    .update(thesisProjects)
    .set({
      title,
      studentName,
      career,
      year: data.year,
      abstract,
    })
    .where(eq(thesisProjects.id, projectId))

  if (data.pdfUrl) {
    // Eliminar PDF anterior si existe
    await db.delete(projectPdfs).where(eq(projectPdfs.projectId, projectId))

    // Agregar nuevo PDF
    await db.insert(projectPdfs).values({
      projectId,
      pdfUrl: data.pdfUrl,
    })
  }

  revalidatePath("/")
}

export async function deleteProject(projectId: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("No autorizado")

  // Verificar que el usuario es el propietario
  const project = await db.query.thesisProjects.findFirst({
    where: eq(thesisProjects.id, projectId),
  })

  if (!project || (user.role === "admin" && project.userId !== user.id)) {
    throw new Error("No tienes permisos para eliminar este proyecto")
  }

  // Eliminar PDFs asociados
  await db.delete(projectPdfs).where(eq(projectPdfs.projectId, projectId))

  // Eliminar proyecto
  await db.delete(thesisProjects).where(eq(thesisProjects.id, projectId))

  revalidatePath("/")
}

export async function getAdminProjects() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden acceder")
  }

  return db.query.thesisProjects.findMany({
    where: eq(thesisProjects.userId, user.id),
    orderBy: [desc(thesisProjects.createdAt)],
  })
}

export async function uploadPdfToBlob(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const timestamp = Date.now()
  const fileName = `projects/${timestamp}-${file.name}`

  const blob = await put(fileName, buffer, {
    access: "public",
  })

  return blob.url
}
