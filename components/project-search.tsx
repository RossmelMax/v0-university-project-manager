"use client"

import { useState, useTransition, useEffect } from "react"
import { searchProjects } from "@/app/actions/projects"
import { type SearchResult } from "@/lib/projects"
import { ProjectCard } from "@/components/project-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, SearchX } from "lucide-react"

export function ProjectSearch({ initial }: { initial: SearchResult[] }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>(initial)
  const [hasSearched, setHasSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Búsqueda en vivo con debounce mientras se escribe.
  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await searchProjects(query)
        setResults(res)
        setHasSearched(query.trim().length > 0)
      })
    }, 300)
    return () => clearTimeout(handle)
  }, [query])

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por título, tema, alumno o carrera..."
            aria-label="Buscar proyectos de grado"
            className="h-14 pl-12 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="h-14 px-6 text-base font-semibold sm:w-auto">
          {isPending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-5" aria-hidden="true" />
          )}
          Buscar
        </Button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {hasSearched
            ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"} para "${query.trim()}"`
            : `${results.length} ${results.length === 1 ? "proyecto registrado" : "proyectos registrados"}`}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-base font-medium text-foreground">No se encontraron proyectos</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Intenta con otras palabras o revisa que estén bien escritas. La búsqueda
            también encuentra coincidencias parecidas.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}
