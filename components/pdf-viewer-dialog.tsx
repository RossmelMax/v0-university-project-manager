"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Props = {
  url: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
}

export function PdfViewerDialog({ url, open, onOpenChange, title = "Visor de PDF" }: Props) {
  if (!url) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border bg-muted/40">
          <DialogTitle className="text-lg font-bold truncate pr-6">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full bg-muted/10 relative">
          <iframe 
            src={`${url}#toolbar=0&navpanes=0`} 
            className="w-full h-full border-0 bg-transparent"
            title={title}
          />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-6 right-6 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl shadow-lg text-sm font-semibold hover:bg-primary/90 transition-all hover:scale-105"
          >
            Abrir original / Descargar
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
