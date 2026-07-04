"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Props = {
    open: boolean
    current: {
        title: string
        studentName: string
        career: string
        year: number
        abstract: string
    }
    extracted: {
        title: string
        studentName: string
        career: string
        year: string
        abstract: string
    }
    onUseExtracted: () => void
    onKeepCurrent: () => void
}

export function PdfComparisonDialog({ open, current, extracted, onUseExtracted, onKeepCurrent }: Props) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <Card className="w-full max-w-2xl p-6">
                <h3 className="text-lg font-semibold">Datos detectados en el nuevo PDF</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Revisa los datos detectados y elige si quieres usar los nuevos o conservar los actuales.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-border p-4">
                        <p className="text-sm font-semibold text-muted-foreground">Actuales</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            <li><span className="font-medium">Título:</span> {current.title || "—"}</li>
                            <li><span className="font-medium">Alumno:</span> {current.studentName || "—"}</li>
                            <li><span className="font-medium">Carrera:</span> {current.career || "—"}</li>
                            <li><span className="font-medium">Año:</span> {current.year || "—"}</li>
                            <li><span className="font-medium">Resumen:</span> {current.abstract || "—"}</li>
                        </ul>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                        <p className="text-sm font-semibold text-muted-foreground">Nuevos</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            <li><span className="font-medium">Título:</span> {extracted.title || "—"}</li>
                            <li><span className="font-medium">Alumno:</span> {extracted.studentName || "—"}</li>
                            <li><span className="font-medium">Carrera:</span> {extracted.career || "—"}</li>
                            <li><span className="font-medium">Año:</span> {extracted.year || "—"}</li>
                            <li><span className="font-medium">Resumen:</span> {extracted.abstract || "—"}</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onKeepCurrent}>Mantener actuales</Button>
                    <Button type="button" onClick={onUseExtracted}>Usar datos del PDF</Button>
                </div>
            </Card>
        </div>
    )
}
