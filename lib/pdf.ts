export type PdfExtraction = {
  title: string;
  studentName: string;
  career: string;
  year: string;
  abstract: string;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractYear(text: string) {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match?.[0] ?? "";
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

  // dynamic import of the build file that exists in the installed package
  const pdfjsLib: any = await import("pdfjs-dist/build/pdf.mjs");

  // Set workerSrc to a local worker file copied to the public folder.
  try {
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  } catch (e) {
    // ignore if setting workerSrc fails
    // eslint-disable-next-line no-console
    console.warn("Could not set pdfjs workerSrc", e);
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let text = "";
  // Only process first 15 pages for metadata to avoid performance issues
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

  try {
    const response = await fetch("/api/extract-pdf-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalizedText }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || "",
        studentName: data.studentName || "",
        career: data.career || "",
        year: data.year || "",
        abstract: data.abstract || "",
      };
    }
  } catch (error) {
    console.warn("Fallo en extracción por IA, cayendo a heurística de regex", error);
  }

  const titleRegex = /(?:CARRERA DE [A-ZÁÉÍÓÚÑ\s]+?)\s+([A-ZÁÉÍÓÚÑ\s0-9,\.]{20,250}?)\s+(?:EXAMEN DE GRADO|PROYECTO DE GRADO|TESIS DE GRADO|TRABAJO DIRIGIDO|POSTULANTE|AUTOR)/i;
  const titleMatchFallback = normalizedText.match(/(?:titulo|title|proyecto|tesis)\s*[:\-]\s*([A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑa-záéíóúñ\s0-9,\.]{10,180})/i);
  const titleMatch = normalizedText.match(titleRegex) || titleMatchFallback;

  const studentRegex = /(?:postulante|alumno|autor|student|author)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{5,80}?)(?=\s+(?:COCHABAMBA|LA PAZ|SANTA CRUZ|BOLIVIA|TUTOR|DOCENTE|202[0-9]|19[0-9]{2}))/i;
  const studentMatch = normalizedText.match(studentRegex);

  const abstractRegex = /(?:1\.1\s*RESUMEN|RESUMEN EJECUTIVO|RESUMEN|ABSTRACT)[\s\.\:]+(.*?)(?:1\.2\s*ANTECEDENTES|2\s*OBJETIVOS|INTRODUCCIÓN|ÍNDICE|CAPÍTULO)/i;
  const abstractMatch = normalizedText.match(abstractRegex);

  return {
    title: (titleMatch?.[1] || titleMatch?.[0] || "").trim(),
    studentName: (studentMatch?.[1] || "").trim(),
    career: inferCareer(normalizedText),
    year: extractYear(normalizedText),
    abstract: (abstractMatch?.[1] || "").trim(),
  };
}
