"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, X, Loader2, AlertTriangle } from "lucide-react";

type Props = { url: string; title?: string; onClose?: () => void };

/**
 * Visor de PDF cross-browser con pdf.js: renderiza TODAS las páginas apiladas
 * en scroll continuo (como el visor nativo). Funciona igual en Chrome y Firefox,
 * sin depender del visor nativo ni de los headers del servidor (que hacían que
 * Firefox descargara el PDF en vez de mostrarlo).
 */
export function PdfViewer({ url, title = "PDF", onClose }: Props) {
  const proxyUrl = "/api/pdf-proxy?url=" + encodeURIComponent(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let doc: any = null;
    setStatus("loading");
    setErrorMsg(null);

    (async () => {
      try {
        // @ts-ignore — el build .mjs de pdfjs-dist no trae tipos
        const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        doc = await pdfjs.getDocument({ url: proxyUrl }).promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        const width = container.clientWidth || 800;
        const dpr = window.devicePixelRatio || 1;

        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return;
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: width / base.width });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 12px";
          canvas.style.boxShadow = "0 1px 3px rgba(0,0,0,0.18)";

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          await page.render({ canvasContext: ctx, viewport }).promise;
          container.appendChild(canvas);
        }

        if (!cancelled) setStatus("ready");
      } catch (e: any) {
        if (!cancelled) {
          setErrorMsg(e?.message || "No se pudo cargar el PDF");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (doc) {
        try {
          doc.destroy();
        } catch {}
      }
    };
  }, [proxyUrl]);

  return (
    <div className="flex h-full w-full flex-col bg-muted">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-3 py-2">
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {title}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={proxyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <ExternalLink className="size-3.5" />
            Abrir en pestaña
          </a>
          <a
            href={proxyUrl}
            download
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <Download className="size-3.5" />
            Descargar
          </a>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="inline-flex size-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 w-full overflow-auto">
        <div ref={containerRef} className="px-4 py-4" />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Cargando PDF…
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <a
              href={proxyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Abrir en una pestaña nueva
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
