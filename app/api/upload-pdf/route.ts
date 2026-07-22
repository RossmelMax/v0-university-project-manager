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
    console.error("Error guardando versión anterior del PDF:", err);
  }
}

export async function POST(request: Request) {
  const rawCookie = await (await cookies()).get("udabol_session")?.value;
  const pipeIdx = rawCookie?.lastIndexOf("|") ?? -1;
  const role = pipeIdx !== -1 ? rawCookie!.slice(pipeIdx + 1) : null;

  if (role !== "admin") {
    return NextResponse.json(
      { error: "Solo los administradores pueden subir PDFs." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("pdf");
  const projectId = formData.get("projectId") as string | null;

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No se recibió un archivo PDF válido." },
      { status: 400 },
    );
  }

  // Si hay projectId, guardar versión anterior del PDF antes de reemplazar
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
    metadata: {
      contentType: "application/pdf",
      cacheControl: "public, max-age=31536000",
    },
  });

  // Hacer el archivo público para que el visor de Google Docs pueda acceder
  await fileRef.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

  return NextResponse.json({ ok: true, url: publicUrl, projectId });
}
