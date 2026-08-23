"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, AlertTriangle } from "lucide-react";

type Props = { url: string; title?: string };

/**
 * Visor de PDF cross-browser: descarga el PDF como blob vía el proxy
 * interno (/api/pdf-proxy) y lo muestra en un <iframe> con un blob URL.
 * Así el visor nativo del navegador (Chrome y Firefox) renderiza el PDF
 * inline con scroll, zoom y búsqueda, sin depender de los headers del
 * servidor (Content-Disposition, X-Frame-Options) que hacían que Chrome
 * no mostrara nada o que Firefox lo descargara.
 */
export function PdfViewer({ url, title = "PDF" }: Props) {
  const proxyUrl = "/api/pdf-proxy?url=" + encodeURIComponent(url);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setBlobUrl(null);
    setError(null);

    (async () => {
      try {
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("No se pudo cargar el PDF");
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "No se pudo cargar el PDF");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proxyUrl]);

  return (
    <div className="flex h-full w-full flex-col bg-muted">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {title}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={proxyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <ExternalLink className="size-3.5" />
            Abrir en pestaña
          </a>
          <a
            href={proxyUrl}
            download
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <Download className="size-3.5" />
            Descargar
          </a>
        </div>
      </div>

      {blobUrl ? (
        <iframe
          src={blobUrl}
          title={title}
          className="w-full flex-1"
          style={{ border: "none" }}
        />
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <a
            href={proxyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Abrir en una pestaña nueva
          </a>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Cargando PDF…
        </div>
      )}
    </div>
  );
}
