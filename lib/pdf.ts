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
  const pdfjsLib: any = await import("pdfjs-dist/build/pdf");

  // Set workerSrc to a CDN-hosted worker (version pinned to installed package).
  // Adjust the version if you upgrade `pdfjs-dist` in package.json.
  try {
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://unpkg.com/pdfjs-dist@6.1.200/build/pdf.worker.min.js";
  } catch (e) {
    // ignore if setting workerSrc fails
    // eslint-disable-next-line no-console
    console.warn("Could not set pdfjs workerSrc", e);
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let text = "";
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    text += ` ${pageText}`;
  }

  const normalizedText = normalizeText(text);
  const titleMatch = normalizedText.match(
    /(?:titulo|title|proyecto)\s*[:\-]\s*([A-ZÁÉÍÓÚÑ0-9][^\n]{0,180})/i,
  );
  const studentMatch = normalizedText.match(
    /(?:alumno|autor|student|author)\s*[:\-]\s*([A-ZÁÉÍÓÚÑ][^\n]{0,80})/i,
  );
  const abstractMatch = normalizedText.match(
    /(?:resumen|abstract)\s*[:\-]\s*([A-ZÁÉÍÓÚÑ0-9][^\n]{0,800})/i,
  );

  return {
    title: titleMatch?.[1]?.trim() ?? "",
    studentName: studentMatch?.[1]?.trim() ?? "",
    career: inferCareer(normalizedText),
    year: extractYear(normalizedText),
    abstract: abstractMatch?.[1]?.trim() ?? "",
  };
}
