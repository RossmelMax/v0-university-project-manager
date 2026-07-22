import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminStorage, adminDb } from "@/lib/firebase/admin";

function buildStoragePath(fileName: string) {
  const safeFileName = encodeURIComponent(fileName);
  return `projects/${crypto.randomUUID()}-${safeFileName}`;
}

async function savePdfVersion(projectId: string, oldUrl: string) {
  try {
    await adminDb
      .collection("projects")
      .doc(projectId)
      .collection("pdfHistory")
      .add({
        url: oldUrl,
        uploadedAt: new Date().toISOString(),
      });
  } catch (err) {
    console.error("Error guardando version anterior del PDF:", err);
  }
}

export async function POST(request: Request) {
  const rawCookie = await (await cookies()).get("udabol_session")?.value;
  const pipeIdx = rawCookie?.lastIndexOf("|") ?? -1;
  const role = pipeIdx !== -1 ? rawCookie!.slice(pipeIdx + 1) : null;

  if (role !== "admin") {
    return NextResponse.json({ error: "Solo los administradores pueden subir PDFs." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("pdf");
  const projectId = formData.get("projectId") as string | null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibio un archivo PDF valido." }, { status: 400 });
  }

  // Guardar version anterior si hay reemplazo
  if (projectId) {
    try {
      const doc = await adminDb.collection("projects").doc(projectId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data?.pdfUrl) {
          await savePdfVersion(projectId, data.pdfUrl as string);
        }
      }
    } catch (err) {
      console.error("Error al verificar pdfUrl anterior:", err);
    }
  }

  // Subir a Firebase Storage usando Admin SDK
  const path = buildStoragePath(file.name);
  const bucket = adminStorage.bucket();
  const fileRef = bucket.file(path);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fileRef.save(buffer, {
    metadata: { contentType: "application/pdf", cacheControl: "public, max-age=31536000" },
  });

  // Generar URL firmada valida 1 ano (no requiere makePublic)
  const [signedUrl] = await fileRef.getSignedUrl({
    action: "read",
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
  });

  return NextResponse.json({ ok: true, url: signedUrl, projectId });
}
