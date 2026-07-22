"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";

type Props = {
  url: string;
  title?: string;
};

export function PdfViewer({ url, title = "PDF" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPageNum(1);
    setPageCount(0);
    setScale(1.0);
    pdfDocRef.current = null;

    async function load() {
      try {
        // Import pdfjs (same pattern as lib/pdf.ts)
        // @ts-ignore
        const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        // Fetch PDF via proxy (que usa Admin SDK, siempre funciona)
        const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("No se pudo obtener el PDF");

        const buffer = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setPageCount(pdf.numPages);
        setLoading(false);
        renderPage(pdf, 1, 1.0);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Error al cargar PDF");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [url]);

  async function renderPage(pdf: any, num: number, s: number) {
    const canvas = canvasRef.current;
    if (!canvas || !pdf) return;
    try {
      const page = await pdf.getPage(num);
      const viewport = page.getViewport({ scale: s });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error("Error rendering page:", err);
    }
  }

  async function changePage(delta: number) {
    const next = pageNum + delta;
    if (next < 1 || next > pageCount) return;
    setPageNum(next);
    if (pdfDocRef.current) {
      await renderPage(pdfDocRef.current, next, scale);
    }
  }

  async function changeScale(delta: number) {
    const newScale = Math.max(0.5, Math.min(3, scale + delta));
    setScale(newScale);
    if (pdfDocRef.current) {
      await renderPage(pdfDocRef.current, pageNum, newScale);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-muted-foreground">
        <AlertTriangle className="size-12" />
        <p className="text-sm text-center">{error}</p>
        <a href={url} target="_blank" rel="noreferrer" download
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
          Descargar PDF directamente
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground truncate max-w-[300px]">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => changeScale(-0.25)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Alejar" disabled={scale <= 0.5}>
            <ZoomOut className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => changeScale(0.25)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Acercar" disabled={scale >= 3}>
            <ZoomIn className="size-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button type="button" onClick={() => changePage(-1)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Pagina anterior" disabled={pageNum <= 1}>
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {pageNum} / {pageCount}
          </span>
          <button type="button" onClick={() => changePage(1)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Pagina siguiente" disabled={pageNum >= pageCount}>
            <ChevronRight className="size-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <a href={url} target="_blank" rel="noreferrer" download
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Descargar PDF">
            <Download className="size-4" />
          </a>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-muted/20 flex justify-center p-4">
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-xl rounded-lg bg-white" />
        )}
      </div>
    </div>
  );
}
