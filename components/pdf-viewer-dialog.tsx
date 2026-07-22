"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type Props = {
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
};

export function PdfViewerDialog({
  url,
  open,
  onOpenChange,
  title = "Visor de PDF",
}: Props) {
  const [loading, setLoading] = useState(true);
  if (!url) return null;

  // Firebase Storage public URL → formato directo para embed
  const directUrl = url.includes("storage.googleapis.com")
    ? `${url}?alt=media`
    : url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1600px] min-w-180 w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border bg-muted/40 shrink-0">
          <DialogTitle className="text-lg font-bold truncate pr-6">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full bg-muted/10 relative flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/10 z-10">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <embed
            src={directUrl}
            type="application/pdf"
            className="w-full h-full border-0"
            title={title}
            onLoad={() => setLoading(false)}
          />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            download
            className="absolute bottom-6 right-6 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl shadow-lg text-sm font-semibold hover:bg-primary/90 transition-all hover:scale-105 z-20"
          >
            Descargar PDF
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
