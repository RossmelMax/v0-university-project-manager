import { Badge } from "@/components/ui/badge"
import type { SearchResult } from "@/lib/projects"
import { User, Calendar, GraduationCap } from "lucide-react"

const CAREER_STYLES: Record<string, string> = {
  "Ingeniería en Sistemas": "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "Ingeniería en Telecomunicaciones": "bg-chart-4/15 text-chart-4 border-chart-4/25",
  "Ingeniería Petrolera": "bg-chart-5/15 text-chart-5 border-chart-5/25",
}

export function ProjectCard({ project }: { project: SearchResult }) {
  const careerStyle =
    CAREER_STYLES[project.career] ?? "bg-secondary text-secondary-foreground border-border"

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={`font-medium ${careerStyle}`}>
          <GraduationCap className="size-3.5" aria-hidden="true" />
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

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <User className="size-4" aria-hidden="true" />
          {project.studentName}
        </span>
        {project.advisor && <span>Tutor: {project.advisor}</span>}
      </div>
    </article>
  )
}
