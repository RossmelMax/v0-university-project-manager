"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";

type Props = {
  url: string;
  title?: string;
};

export function PdfViewer({ url, title = "PDF" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1);

  const renderCurrent = useCallback(async () => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!pdf || !canvas || !wrapper) return;

    try {
      const page = await pdf.getPage(pageNum);
      const vp = page.getViewport({ scale });
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
      }
    } catch (e) {
      console.error("Render error:", e);
    }
  }, [pageNum, scale]);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    setError(null);
    setPageNum(1);
    setPageCount(0);
    setScale(1);
    pdfRef.current = null;

    (async () => {
      try {
        // @ts-ignore
        const mod: any = await import("pdfjs-dist/build/pdf.mjs");
        mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Error al obtener PDF");
        const buf = await res.arrayBuffer();
        if (dead) return;

        const pdf = await mod.getDocument({ data: buf }).promise;
        if (dead) return;

        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        if (!dead) { setError(err?.message || "Error"); setLoading(false); }
      }
    })();

    return () => { dead = true; };
  }, [url]);

  useEffect(() => {
    if (!loading && pdfRef.current) renderCurrent();
  }, [renderCurrent, loading]);

  function goPage(delta: number) {
    const n = pageNum + delta;
    if (n >= 1 && n <= pageCount) setPageNum(n);
  }

  function zoom(delta: number) {
    setScale((s) => Math.max(0.5, Math.min(3, s + delta)));
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-12 text-muted-foreground">
        <AlertTriangle className="size-12" />
        <p className="text-sm text-center">{error}</p>
        <a href={url} target="_blank" rel="noreferrer" download
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90">
          Descargar PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar - con padding extra a la derecha para no tapar el X del Dialog */}
      <div className="flex items-center justify-between px-4 py-2 pr-14 border-b border-border bg-muted/30 shrink-0">
        <span className="text-sm text-muted-foreground truncate max-w-[300px]">{title}</span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => zoom(-0.25)} disabled={scale <= 0.5}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30" title="Alejar">
            <ZoomOut className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center font-mono">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoom(0.25)} disabled={scale >= 3}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30" title="Acercar">
            <ZoomIn className="size-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button type="button" onClick={() => goPage(-1)} disabled={pageNum <= 1}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30" title="Anterior">
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground font-mono">{pageNum}/{pageCount}</span>
          <button type="button" onClick={() => goPage(1)} disabled={pageNum >= pageCount}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30" title="Siguiente">
            <ChevronRight className="size-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <a href={url} target="_blank" rel="noreferrer" download
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Descargar">
            <Download className="size-4" />
          </a>
        </div>
      </div>

      {/* Scroll area */}
      <div ref={wrapperRef} className="flex-1 overflow-auto bg-muted/10 flex justify-center p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-xl rounded-lg bg-white" />
        )}
      </div>
    </div>
  );
}
