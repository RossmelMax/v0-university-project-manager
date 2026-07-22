"use client"

import { useState, useTransition, useEffect } from "react"
import { searchProjects } from "@/app/actions/projects"
import { CARRERAS, type SearchResult } from "@/lib/projects"
import { ProjectCard } from "@/components/project-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Loader2, SearchX, Download, X } from "lucide-react"
import { PaginationControls } from "@/components/pagination-controls"

export function ProjectSearch({ initial }: { initial: SearchResult[] }) {
  const [query, setQuery] = useState("")
  const [career, setCareer] = useState("")
  const [yearFrom, setYearFrom] = useState("")
  const [yearTo, setYearTo] = useState("")
  const [yearError, setYearError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>(initial)
  const [hasSearched, setHasSearched] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const handle = setTimeout(() => {
      setYearError(null)
      const from = yearFrom ? Number(yearFrom) : null
      const to = yearTo ? Number(yearTo) : null

      if (from !== null && to !== null && from > to) {
        setYearError('El año "desde" no puede ser mayor al año "hasta"')
        return
      }

      startTransition(async () => {
        const filters: { career?: string; yearFrom?: number; yearTo?: number } = {}
        if (career) filters.career = career
        if (from !== null && !isNaN(from)) filters.yearFrom = from
        if (to !== null && !isNaN(to)) filters.yearTo = to

        const res = await searchProjects(query, filters)
        setResults(res)
        setCurrentPage(1)
        setHasSearched(query.trim().length > 0 || !!career || !!yearFrom || !!yearTo)
      })
    }, 300)
    return () => clearTimeout(handle)
  }, [query, career, yearFrom, yearTo])

  function clearFilters() {
    setCareer("")
    setYearFrom("")
    setYearTo("")
    setYearError(null)
    setCurrentPage(1)
  }

  const hasFilters = !!career || !!yearFrom || !!yearTo

  // Paginación
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize))
  const safePage = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedResults = results.slice((safePage - 1) * pageSize, safePage * pageSize)

  function exportCSV() {
    const headers = ["Título", "Alumno", "Carrera", "Año", "Resumen", "URL PDF"]
    const rows = results.map((p) => [
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.studentName.replace(/"/g, '""')}"`,
      `"${p.career}"`,
      p.year,
      `"${(p.abstract || "").replace(/"/g, '""')}"`,
      p.pdfUrl || "",
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `proyectos-udabol-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
          {isPending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
          Buscar
        </Button>
      </form>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-career" className="text-xs font-semibold text-muted-foreground">Carrera</label>
          <Select value={career} onValueChange={(val) => setCareer(val === "all" || !val ? "" : val)}>
            <SelectTrigger id="filter-career" className="!h-10 w-[240px] text-sm items-center">
              <SelectValue placeholder="Todas las carreras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">Todas las carreras</SelectItem>
              {CARRERAS.map((c) => (<SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-year-from" className="text-xs font-semibold text-muted-foreground">Año desde</label>
          <Input
            id="filter-year-from" type="number" min={1980} max={2100}
            value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}
            placeholder="Ej. 2020" className="h-10 w-[120px] text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-year-to" className="text-xs font-semibold text-muted-foreground">Año hasta</label>
          <Input
            id="filter-year-to" type="number" min={1980} max={2100}
            value={yearTo} onChange={(e) => setYearTo(e.target.value)}
            placeholder="Ej. 2025" className="h-10 w-[120px] text-sm"
          />
        </div>

        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-10 gap-1.5 text-xs cursor-pointer">
            <X className="size-3.5" /> Limpiar filtros
          </Button>
        )}
      </div>

      {yearError && <p className="text-xs text-destructive font-medium">{yearError}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {hasSearched
            ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"} encontrados`
            : `${results.length} ${results.length === 1 ? "proyecto registrado" : "proyectos registrados"}`}
        </p>
        {results.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs">
            <Download className="size-3.5 mr-1" /> Exportar CSV
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-base font-medium text-foreground">No se encontraron proyectos</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Intenta con otras palabras o ajusta los filtros.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paginatedResults.map((p) => (<ProjectCard key={p.id} project={p} />))}
          </div>
          <PaginationControls
            pageSize={pageSize}
            currentPage={safePage}
            totalItems={results.length}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
