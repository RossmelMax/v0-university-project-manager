import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let path = searchParams.get("path");
  const url = searchParams.get("url");

  // Si no hay path pero hay URL, extraer el path de la URL
  if (!path && url) {
    try {
      const u = new URL(url);
      // Formato: /udabol-project-manager.firebasestorage.app/projects/xxx
      // o: /v0/b/udabol-project-manager.firebasestorage.app/o/projects%2Fxxx
      const match = u.pathname.match(/\/(projects\/[^?]+)/);
      if (match) path = decodeURIComponent(match[1]);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  }

  if (!path) {
    return NextResponse.json({ error: "path or url parameter required" }, { status: 400 });
  }

  try {
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(path);
    const [exists] = await fileRef.exists();
    if (!exists) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const [buffer] = await fileRef.download();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("PDF proxy error:", err?.message || err);
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
  }
}
