"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createProject } from "@/app/actions/projects"
import { CARRERAS } from "@/lib/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, AlertCircle, Plus } from "lucide-react"

const CURRENT_YEAR = new Date().getFullYear()

export function ProjectForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [career, setCareer] = useState("")
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null)

  function handleSubmit(formData: FormData) {
    setFeedback(null)
    const title = String(formData.get("title") ?? "")
    const studentName = String(formData.get("studentName") ?? "")
    const year = Number(formData.get("year") ?? 0)
    const abstract = String(formData.get("abstract") ?? "")
    const advisor = String(formData.get("advisor") ?? "")

    if (!career) {
      setFeedback({ type: "error", text: "Por favor selecciona una carrera." })
      return
    }

    startTransition(async () => {
      const res = await createProject({ title, studentName, career, year, abstract, advisor })
      if (res.ok) {
        setFeedback({ type: "ok", text: "Proyecto registrado correctamente." })
        setCareer("")
        const formEl = document.getElementById("project-form") as HTMLFormElement | null
        formEl?.reset()
        router.refresh()
      } else {
        setFeedback({ type: "error", text: res.error })
      }
    })
  }

  return (
    <form id="project-form" action={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title" className="text-sm font-semibold">
          Título del proyecto <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Ej. Sistema de gestión de inventarios con IA"
          className="h-12 text-base"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="studentName" className="text-sm font-semibold">
            Nombre del alumno <span className="text-destructive">*</span>
          </Label>
          <Input
            id="studentName"
            name="studentName"
            required
            placeholder="Ej. María Fernanda Quiroga"
            className="h-12 text-base"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="advisor" className="text-sm font-semibold">
            Tutor / Asesor
          </Label>
          <Input
            id="advisor"
            name="advisor"
            placeholder="Ej. Ing. Roberto Mendoza"
            className="h-12 text-base"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="career" className="text-sm font-semibold">
            Carrera <span className="text-destructive">*</span>
          </Label>
          <Select value={career} onValueChange={setCareer}>
            <SelectTrigger id="career" className="h-12 text-base data-[size]:h-12">
              <SelectValue placeholder="Selecciona una carrera" />
            </SelectTrigger>
            <SelectContent>
              {CARRERAS.map((c) => (
                <SelectItem key={c} value={c} className="text-base">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="year" className="text-sm font-semibold">
            Año <span className="text-destructive">*</span>
          </Label>
          <Input
            id="year"
            name="year"
            type="number"
            required
            min={1980}
            max={2100}
            defaultValue={CURRENT_YEAR}
            className="h-12 text-base"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="abstract" className="text-sm font-semibold">
          Resumen
        </Label>
        <Textarea
          id="abstract"
          name="abstract"
          rows={5}
          placeholder="Describe brevemente el objetivo y alcance del proyecto de grado..."
          className="resize-y text-base leading-relaxed"
        />
      </div>

      {feedback && (
        <div
          role="status"
          className={
            feedback.type === "ok"
              ? "flex items-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground"
              : "flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          }
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
          )}
          {feedback.text}
        </div>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="h-13 text-base font-semibold">
        <Plus className="size-5" aria-hidden="true" />
        {isPending ? "Registrando..." : "Registrar proyecto"}
      </Button>
    </form>
  )
}
