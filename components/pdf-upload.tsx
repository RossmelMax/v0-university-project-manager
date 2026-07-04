"use client"

import { useState, type ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { extractPdfData } from "@/lib/pdf"
import { FileText, Loader2 } from "lucide-react"

type Props = {
    onExtracted: (data: {
        title: string
        studentName: string
        career: string
        year: string
        abstract: string
    }) => void
    onUploadComplete: (url: string) => void
    existingPdfUrl?: string | null
}

export function PdfUpload({ onExtracted, onUploadComplete, existingPdfUrl = null }: Props) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("pdf", file)

            const uploadResponse = await fetch("/api/upload-pdf", {
                method: "POST",
                body: formData,
            })
            const uploadResult = await uploadResponse.json()

            if (!uploadResponse.ok || !uploadResult.ok) {
                throw new Error(uploadResult.error || "No se pudo subir el PDF.")
            }

            onUploadComplete(uploadResult.url)
            const data = await extractPdfData(file)
            onExtracted(data)
        } catch (err) {
            setError("No se pudo subir o procesar el PDF. Intenta con otro archivo o completa los campos manualmente.")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-4">
            <Label htmlFor="pdfFile" className="text-sm font-semibold">
                PDF del proyecto (opcional)
            </Label>
            <Input id="pdfFile" type="file" accept="application/pdf" onChange={handleChange} />
            <p className="text-xs text-muted-foreground">
                Si subes un PDF, lo guardaremos en Supabase Storage y extraeremos los datos automáticamente.
            </p>
            {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Subiendo y procesando PDF...
                </div>
            ) : null}
            {existingPdfUrl ? (
                <p className="text-sm text-muted-foreground">
                    PDF guardado: <a href={existingPdfUrl} target="_blank" rel="noreferrer" className="text-primary underline">ver archivo</a>
                </p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-4" />
                Después de subir el PDF, ajusta los datos antes de guardar el proyecto.
            </div>
        </div>
    )
}
