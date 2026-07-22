"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";

type Props = { url: string; title?: string };

export function PdfViewer({ url, title = "PDF" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const taskRef = useRef<any>(null);
  const pageRef = useRef(1);
  const scaleRef = useRef(1);
  const wheelTimer = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1);

  // Renderiza pagina con los valores ACTUALES de los refs
  async function doRender() {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    if (taskRef.current) {
      try { taskRef.current.cancel(); } catch {}
      taskRef.current = null;
    }

    try {
      const p = await pdf.getPage(pageRef.current);
      const vp = p.getViewport({ scale: scaleRef.current });
      canvas.style.width = vp.width + "px";
      canvas.style.height = vp.height + "px";
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const task = p.render({ canvasContext: ctx, viewport: vp });
      taskRef.current = task;
      await task.promise;
      taskRef.current = null;
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") throw e;
    }
  }

  // Cargar PDF
  useEffect(() => {
    let dead = false;
    pdfRef.current = null;
    setLoading(true);

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
        if (!dead) setError(err?.message || "Error");
        setLoading(false);
      }
    })();

    return () => { dead = true; };
  }, [url]);

  // Cuando termina de cargar, renderiza pagina 1
  useEffect(() => {
    if (!loading && pdfRef.current) {
      pageRef.current = 1;
      scaleRef.current = 1;
      doRender();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Cambiar pagina
  function goTo(n: number) {
    const c = Math.max(1, Math.min(pageCount, n));
    pageRef.current = c;
    setPageNum(c);
    doRender();
  }

  function goPage(delta: number) {
    goTo(pageNum + delta);
  }

  // Zoom
  function zoom(delta: number) {
    const s = Math.max(0.5, Math.min(3, scaleRef.current + delta));
    scaleRef.current = s;
    setScale(s);
    doRender();
  }

  // Scroll con debounce
  function handleWheel(e: React.WheelEvent) {
    const now = Date.now();
    if (now - wheelTimer.current < 500) return;
    if (Math.abs(e.deltaY) < 40) return;
    if (e.deltaY > 0 && pageNum < pageCount) {
      wheelTimer.current = now;
      goTo(pageNum + 1);
    } else if (e.deltaY < 0 && pageNum > 1) {
      wheelTimer.current = now;
      goTo(pageNum - 1);
    }
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
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 pr-14 border-b border-border bg-muted/30 shrink-0">
        <span className="text-sm text-muted-foreground truncate max-w-[50%]">{title}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => zoom(-0.25)} disabled={scale <= 0.5}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30" title="Alejar">
            <ZoomOut className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center font-mono">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoom(0.25)} disabled={scale >= 3}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30" title="Acercar">
            <ZoomIn className="size-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={() => goPage(-1)} disabled={pageNum <= 1}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground font-mono">{pageNum}/{pageCount}</span>
          <button onClick={() => goPage(1)} disabled={pageNum >= pageCount}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ChevronRight className="size-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <a href={url} target="_blank" rel="noreferrer" download
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
            <Download className="size-4" />
          </a>
        </div>
      </div>

      {/* Area de scroll */}
      <div className="flex-1 overflow-auto bg-muted/10 flex justify-center p-4" onWheel={handleWheel}>
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-xl rounded-lg bg-white" />
        )}
      </div>
    </div>
  );
}
