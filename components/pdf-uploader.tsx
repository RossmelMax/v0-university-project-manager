"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Upload, CheckCircle2, AlertCircle } from "lucide-react"
import { extractPdfData, type ExtractedProjectData } from "@/lib/pdf-extractor"
import { uploadPdfToBlob } from "@/app/actions/projects"

export interface PdfUploaderProps {
  onExtracted: (data: ExtractedProjectData, pdfUrl: string) => void
  onError?: (error: string) => void
}

export function PdfUploader({ onExtracted, onError }: PdfUploaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedProjectData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    if (!file.type.includes("pdf")) {
      const err = "Por favor selecciona un archivo PDF"
      setError(err)
      onError?.(err)
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      // Extraer datos del PDF
      const extracted = await extractPdfData(file)

      // Subir PDF a Blob
      const url = await uploadPdfToBlob(file)

      setExtractedData(extracted)
      setPdfUrl(url)
      onExtracted(extracted, url)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al procesar el PDF"
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pdf-file" className="text-base font-semibold">
          Cargar Documento (PDF)
        </Label>
        <div className="relative">
          <Input
            ref={fileInputRef}
            id="pdf-file"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-6 hover:border-primary hover:bg-muted disabled:opacity-50"
          >
            <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">
              {isLoading ? "Procesando..." : "Haz clic para seleccionar un PDF o arrastra uno aquí"}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="size-5 flex-shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </Card>
      )}

      {extractedData && (
        <Card className="border-green-200 bg-green-50 p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="size-5 flex-shrink-0 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-green-800">Datos extraídos correctamente</p>
              <p className="mt-1 text-xs text-green-700">
                Los campos se han rellenado automáticamente. Revisa y edita si es necesario.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
