"use client";

import { Download, ExternalLink } from "lucide-react";

type Props = { url: string; title?: string };

/**
 * Visor de PDF: usa un <iframe> con el visor nativo del navegador
 * (Chrome y Firefox) a través del proxy interno (/api/pdf-proxy), que
 * sirve el PDF con Content-Disposition: inline. Esto da scroll continuo,
 * zoom y búsqueda nativos, mucho mejor que el render canvas de pdfjs-dist.
 */
export function PdfViewer({ url, title = "PDF" }: Props) {
  const proxyUrl = "/api/pdf-proxy?url=" + encodeURIComponent(url);

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
      <iframe
        src={proxyUrl}
        title={title}
        className="w-full flex-1"
        style={{ border: "none" }}
      />
    </div>
  );
}
