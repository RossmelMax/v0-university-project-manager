"use client"

import pdfParse from "pdf-parse"

export interface ExtractedProjectData {
  title: string
  studentName: string
  career: string
  year: number
  abstract: string
}

/**
 * Extrae datos del PDF usando patrones de búsqueda
 * Busca en las primeras 2 páginas para encontrar:
 * - Título (palabras clave: TRABAJO, PROYECTO, TESIS)
 * - Nombre estudiante (línea después de "Autor" o "Por")
 * - Carrera (búsqueda de "Ingeniería" + tipo)
 * - Año (números de 4 dígitos en rango 2000-2030)
 * - Resumen (búsqueda de "RESUMEN", "ABSTRACT", "SUMMARY")
 */
export async function extractPdfData(file: File): Promise<ExtractedProjectData> {
  const buffer = await file.arrayBuffer()
  const data = await pdfParse(Buffer.from(buffer))
  const text = data.text.toUpperCase()

  // Dividir en líneas para búsqueda más estructurada
  const lines = data.text.split("\n").map((l) => l.trim())

  // Extrae título (busca líneas largas después de palabras clave)
  const title = extractTitle(lines, text)

  // Extrae nombre estudiante (después de "Autor" o "Por" o "Estudiante")
  const studentName = extractStudentName(lines, text)

  // Extrae carrera (busca "Ingeniería en Sistemas/Telecomunicaciones/Petrolera")
  const career = extractCareer(lines, text)

  // Extrae año (números de 4 dígitos entre 2000-2030)
  const year = extractYear(lines, text)

  // Extrae resumen (después de "RESUMEN" o "ABSTRACT")
  const abstract = extractAbstract(lines, text)

  return { title, studentName, career, year, abstract }
}

function extractTitle(lines: string[], text: string): string {
  const keywordPatterns = ["TRABAJO DE", "PROYECTO DE", "TESIS", "TITLE"]
  for (const keyword of keywordPatterns) {
    const idx = lines.findIndex((l) => l.includes(keyword))
    if (idx !== -1 && idx + 1 < lines.length) {
      const candidate = lines[idx + 1]
      if (candidate && candidate.length > 5 && candidate.length < 200) {
        return candidate.slice(0, 120)
      }
    }
  }
  // Fallback: primera línea larga no vacía
  const longLine = lines.find((l) => l.length > 10 && l.length < 200)
  return longLine || "Sin título detectado"
}

function extractStudentName(lines: string[], text: string): string {
  const keywords = ["AUTOR:", "AUTOR", "POR:", "ESTUDIANTE:", "ESTUDIANTE"]
  for (const keyword of keywords) {
    const idx = lines.findIndex((l) => l.includes(keyword))
    if (idx !== -1 && idx + 1 < lines.length) {
      const candidate = lines[idx + 1].trim()
      if (candidate && candidate.length > 2 && candidate.length < 100) {
        return candidate
      }
    }
  }
  return "Nombre no detectado"
}

function extractCareer(lines: string[], text: string): string {
  const careers = [
    "Ingeniería en Sistemas",
    "INGENIERÍA EN SISTEMAS",
    "Ingeniería en Telecomunicaciones",
    "INGENIERÍA EN TELECOMUNICACIONES",
    "Ingeniería Petrolera",
    "INGENIERÍA PETROLERA",
  ]
  for (const career of careers) {
    if (text.includes(career.toUpperCase())) {
      return career
    }
  }
  return "Carrera no detectada"
}

function extractYear(lines: string[], text: string): number {
  // Busca números de 4 dígitos entre 2000 y 2030
  const regex = /\b(20\d{2})\b/g
  const matches = text.match(regex)
  if (matches && matches.length > 0) {
    const year = parseInt(matches[0], 10)
    if (year >= 2000 && year <= 2030) {
      return year
    }
  }
  return new Date().getFullYear()
}

function extractAbstract(lines: string[], text: string): string {
  const keywords = ["RESUMEN", "ABSTRACT", "SUMMARY"]
  for (const keyword of keywords) {
    const idx = lines.findIndex((l) => l.includes(keyword))
    if (idx !== -1) {
      // Tomar las siguientes líneas hasta encontrar otra palabra clave o límite
      const abstractLines = []
      for (let i = idx + 1; i < Math.min(idx + 10, lines.length); i++) {
        const line = lines[i].trim()
        if (
          line &&
          !line.includes("ÍNDICE") &&
          !line.includes("TABLA OF CONTENTS")
        ) {
          abstractLines.push(line)
        } else if (line === "") {
          continue
        } else {
          break
        }
      }
      const extracted = abstractLines.join(" ").slice(0, 300)
      if (extracted) return extracted
    }
  }
  return ""
}
