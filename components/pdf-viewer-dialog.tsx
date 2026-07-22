"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";

type Props = {
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
};

export function PdfViewerDialog({ url, open, onOpenChange, title = "Visor de PDF" }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  if (!url) return null;

  // Usar proxy con path extraído de la URL
  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1600px] min-w-180 w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border bg-muted/40 shrink-0">
          <DialogTitle className="text-lg font-bold truncate pr-6">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full bg-muted/10 relative flex items-center justify-center">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error ? (
            <div className="flex flex-col items-center gap-4 text-muted-foreground p-8">
              <AlertTriangle className="size-12" />
              <p className="text-sm text-center">No se pudo cargar el PDF.</p>
              <a href={proxyUrl} target="_blank" rel="noreferrer"
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
                Descargar PDF
              </a>
              <a href={url} target="_blank" rel="noreferrer" download
                className="text-xs text-muted-foreground underline hover:text-foreground">
                Descarga directa (alternativa)
              </a>
            </div>
          ) : (
            <iframe
              src={proxyUrl}
              className="w-full h-full border-0"
              title={title}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          )}
          <a href={proxyUrl} target="_blank" rel="noreferrer" download
            className="absolute bottom-6 right-6 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl shadow-lg text-sm font-semibold hover:bg-primary/90 transition-all hover:scale-105 z-20">
            Descargar PDF
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
