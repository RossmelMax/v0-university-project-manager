"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, X } from "lucide-react"
import { ExtractedProjectData } from "@/lib/pdf-extractor"

export interface PdfComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  oldData: {
    title: string
    studentName: string
    career: string
    year: number
    abstract: string
  }
  newData: ExtractedProjectData
  onUseNew: () => void
  onUseOld: () => void
}

export function PdfComparisonModal({
  isOpen,
  onClose,
  oldData,
  newData,
  onUseNew,
  onUseOld,
}: PdfComparisonModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparar Datos del Documento</DialogTitle>
          <DialogDescription>
            Se detectaron cambios en el documento PDF. Elige qué datos usar para cada campo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <ComparisonField
            label="Título del Proyecto"
            oldValue={oldData.title}
            newValue={newData.title}
          />

          {/* Alumno */}
          <ComparisonField
            label="Nombre del Alumno"
            oldValue={oldData.studentName}
            newValue={newData.studentName}
          />

          {/* Carrera */}
          <ComparisonField
            label="Carrera"
            oldValue={oldData.career}
            newValue={newData.career}
          />

          {/* Año */}
          <ComparisonField
            label="Año"
            oldValue={oldData.year.toString()}
            newValue={newData.year.toString()}
          />

          {/* Resumen */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Resumen</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-3 bg-muted">
                <p className="text-xs font-medium text-muted-foreground mb-1">Anterior</p>
                <p className="text-sm line-clamp-4">{oldData.abstract || "(Sin resumen)"}</p>
              </Card>
              <Card className="p-3 bg-accent/10 border-accent">
                <p className="text-xs font-medium text-accent-foreground mb-1">Nuevo PDF</p>
                <p className="text-sm line-clamp-4">{newData.abstract || "(Sin resumen)"}</p>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onUseOld}>
            <CheckCircle2 className="size-4 mr-2" aria-hidden="true" />
            Mantener Datos Anteriores
          </Button>
          <Button onClick={onUseNew} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <CheckCircle2 className="size-4 mr-2" aria-hidden="true" />
            Usar Datos del Nuevo PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ComparisonFieldProps {
  label: string
  oldValue: string
  newValue: string
}

function ComparisonField({ label, oldValue, newValue }: ComparisonFieldProps) {
  const isChanged = oldValue !== newValue

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">{label}</h3>
      <div className="grid grid-cols-2 gap-4">
        <Card className={`p-3 ${isChanged ? "bg-orange-50 border-orange-200" : "bg-muted"}`}>
          <p className="text-xs font-medium text-muted-foreground mb-1">Anterior</p>
          <p className="text-sm font-medium break-words">{oldValue}</p>
        </Card>
        <Card className={`p-3 ${isChanged ? "bg-green-50 border-green-200" : "bg-muted"}`}>
          <p className="text-xs font-medium text-muted-foreground mb-1">Nuevo PDF</p>
          <p className="text-sm font-medium break-words">{newValue}</p>
        </Card>
      </div>
      {isChanged && <p className="text-xs text-orange-600 font-medium">⚠️ Cambio detectado</p>}
    </div>
  )
}
