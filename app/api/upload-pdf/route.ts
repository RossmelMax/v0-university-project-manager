import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;

function getCookieValue(name: string) {
  const store = cookies();
  return store.get(name)?.value;
}

function buildStoragePath(fileName: string) {
  const safeFileName = encodeURIComponent(fileName);
  return ["projects", `${crypto.randomUUID()}-${safeFileName}`].join("/");
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_STORAGE_BUCKET) {
    return NextResponse.json(
      {
        error:
          "Supabase storage no está configurado. Define SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_STORAGE_BUCKET.",
      },
      { status: 500 },
    );
  }

  if (getCookieValue("udabol_session") !== "admin") {
    return NextResponse.json(
      { error: "Solo los administradores pueden subir PDFs." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("pdf");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No se recibió un archivo PDF válido." },
      { status: 400 },
    );
  }

  const path = buildStoragePath(file.name);
  const bucketUrl = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(
    SUPABASE_STORAGE_BUCKET,
  )}/${path}`;

  const arrayBuffer = await file.arrayBuffer();
  const res = await fetch(bucketUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": file.type || "application/pdf",
    },
    body: arrayBuffer,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    return NextResponse.json(
      {
        error: `No se pudo subir el PDF al almacenamiento de Supabase. ${res.status} ${message}`,
      },
      { status: 502 },
    );
  }

  const publicUrl = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(
    SUPABASE_STORAGE_BUCKET,
  )}/${path}`;

  return NextResponse.json({ ok: true, url: publicUrl });
}
