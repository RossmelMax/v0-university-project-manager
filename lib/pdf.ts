export type PdfExtraction = {
  title: string;
  studentName: string;
  career: string;
  year: string;
  abstract: string;
  keywords: string[];
};

function normalizeText(value: string) {
  // Limpia espacios múltiples y saltos de línea raros
  return value.replace(/\s+/g, " ").trim();
}

function extractYear(text: string) {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match?.[0] ?? "";
}

/**
 * Extrae palabras clave de un texto usando heurística simple:
 * remueve stopwords en español, busca palabras significativas frecuentes.
 * Retorna un array de hasta 8 keywords.
 */
export function extractKeywords(text: string): string[] {
  if (!text || text.trim().length < 30) return [];

  const stopwords = new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del",
    "en", "con", "por", "para", "que", "es", "son", "se", "su", "al",
    "como", "más", "este", "esta", "entre", "cada", "todo", "todos",
    "fue", "han", "ha", "ser", "tiene", "tienen", "sus", "lo", "le",
    "del", "así", "muy", "sin", "sobre", "también", "desde", "hasta",
    "donde", "cuando", "durante", "pero", "o", "y", "e", "a",
    "the", "of", "and", "in", "to", "a", "is", "for", "with", "on",
    "this", "that", "are", "be", "was", "were", "it", "its", "an",
  ]);

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-záéíóúñ0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = normalized.split(/\s+/).filter((w) => {
    return w.length >= 4 && !stopwords.has(w) && !/^\d+$/.test(w);
  });

  // Contar frecuencia
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Ordenar por frecuencia descendente, luego alfabéticamente
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word]) => word);

  return sorted;
}

function inferCareer(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("sistemas")) return "Ingeniería en Sistemas";
  if (lower.includes("telecom")) return "Ingeniería en Telecomunicaciones";
  if (lower.includes("petrol")) return "Ingeniería Petrolera";
  return "";
}

// Dynamically import pdfjs in the browser only. This avoids server-side
// errors like "DOMMatrix is not defined" when Next.js evaluates modules on
// the server. We also set a CDN workerSrc so pdfjs can initialize.
export async function extractPdfData(file: File): Promise<PdfExtraction> {
  if (typeof window === "undefined") {
    throw new Error("PDF extraction must run in the browser.");
  }

  // Ignoramos el warning de TS para este path específico de .mjs
  // @ts-ignore: No declaration file for pdfjs-dist/build/pdf.mjs
  const pdfjsLib: any = await import("pdfjs-dist/build/pdf.mjs");

  // Set workerSrc to a local worker file copied to the public folder.
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  } catch (e) {
    console.warn("Could not set pdfjs workerSrc", e);
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let text = "";
  // Extraemos hasta las primeras 15 páginas para saltar los índices y llegar al resumen
  const maxPages = Math.min(pdf.numPages, 15);
  for (let index = 1; index <= maxPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    text += ` ${pageText}`;
  }

  const normalizedText = normalizeText(text);

  // 1. Intentamos con la IA primero
  try {
    const response = await fetch("/api/extract-pdf-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalizedText }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.title || data.studentName) {
        const abstractText = data.abstract || "";
        return {
          title: data.title || "",
          studentName: data.studentName || "",
          career: data.career || "",
          year: data.year || "",
          abstract: abstractText,
          keywords: data.keywords ?? extractKeywords(abstractText),
        };
      }
    }
  } catch (error) {
    console.warn(
      "Fallo en extracción por IA, cayendo a heurística de regex",
      error,
    );
  }

  // 2. Fallback heurístico con Regex tuneado
  const titleRegex =
    /(?:CARRERA DE [A-ZÁÉÍÓÚÑ\s]+?)\s+([A-ZÁÉÍÓÚÑ\s0-9,\.]{20,250}?)\s+(?:EXAMEN DE GRADO|PROYECTO DE GRADO|TESIS DE GRADO|TRABAJO DIRIGIDO|POSTULANTE|AUTOR)/i;
  const titleMatchFallback = normalizedText.match(
    /(?:titulo|title|proyecto|tesis)\s*[:\-]\s*([A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑa-záéíóúñ\s0-9,\.]{10,180})/i,
  );
  const titleMatch = normalizedText.match(titleRegex) || titleMatchFallback;

  const studentRegex =
    /(?:postulante|alumno|autor|student|author)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{5,80}?)(?=\s+(?:COCHABAMBA|LA PAZ|SANTA CRUZ|BOLIVIA|TUTOR|DOCENTE|202[0-9]|19[0-9]{2}))/i;
  const studentMatch = normalizedText.match(studentRegex);

  // Regex robusto para atrapar el abstract:
  // Busca palabras clave de inicio y captura entre 100 a 2500 caracteres hasta chocar con palabras clave del siguiente capítulo
  const abstractRegex =
    /(?:RESUMEN EJECUTIVO|1\.1\s*RESUMEN|RESUMEN|ABSTRACT)[\s\.\:]+([\s\S]{100,2500}?)(?:1\.2\s*ANTECEDENTES|2\s*OBJETIVOS|INTRODUCCI[ÓO]N|ÍNDICE|CAP[ÍI]TULO)/i;
  const abstractMatch = normalizedText.match(abstractRegex);

  let finalAbstract = (abstractMatch?.[1] || "").trim();

  // Cortamos a un máximo razonable para no desbordar el Textarea ni la BD
  if (finalAbstract.length > 800) {
    finalAbstract = finalAbstract.substring(0, 800) + "...";
  }

  return {
    title: (titleMatch?.[1] || titleMatch?.[0] || "").trim(),
    studentName: (studentMatch?.[1] || "").trim(),
    career: inferCareer(normalizedText),
    year: extractYear(normalizedText),
    abstract: finalAbstract,
    keywords: extractKeywords(finalAbstract),
  };
}
