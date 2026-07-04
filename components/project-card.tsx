"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { SearchResult } from "@/lib/projects"
import { User, Calendar, GraduationCap, FileText } from "lucide-react"
import { PdfViewerDialog } from "@/components/pdf-viewer-dialog"

const CAREER_STYLES: Record<string, string> = {
  "Ingeniería en Sistemas": "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "Ingeniería en Telecomunicaciones": "bg-chart-4/15 text-chart-4 border-chart-4/25",
  "Ingeniería Petrolera": "bg-chart-5/15 text-chart-5 border-chart-5/25",
}

export function ProjectCard({ project }: { project: SearchResult }) {
  const [showPdf, setShowPdf] = useState(false)
  
  const careerStyle =
    CAREER_STYLES[project.career] ?? "bg-secondary text-secondary-foreground border-border"

  return (
    <>
      <PdfViewerDialog
        url={project.pdfUrl ?? null}
        open={showPdf}
        onOpenChange={setShowPdf}
        title={project.title}
      />
      
      <article className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`font-medium ${careerStyle}`}>
              <GraduationCap className="size-3.5 mr-1" aria-hidden="true" />
              {project.career}
            </Badge>
            <Badge variant="outline" className="gap-1 font-medium text-muted-foreground">
              <Calendar className="size-3.5" aria-hidden="true" />
              {project.year}
            </Badge>
          </div>

          <h3 className="text-pretty text-lg font-bold leading-snug text-card-foreground">
            {project.title}
          </h3>

          {project.abstract && (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {project.abstract}
            </p>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <User className="size-4" aria-hidden="true" />
            {project.studentName}
          </span>
          {project.pdfUrl && (
            <button
              onClick={() => setShowPdf(true)}
              type="button"
              className="flex items-center gap-1.5 font-medium text-primary hover:underline cursor-pointer"
            >
              <FileText className="size-4" aria-hidden="true" />
              Ver PDF
            </button>
          )}
        </div>
      </article>
    </>
  )
}
