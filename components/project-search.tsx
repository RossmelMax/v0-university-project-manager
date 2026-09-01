"use client"

import { useState, useTransition, useEffect, useMemo } from "react"
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
import { Search, Loader2, SearchX, X, ArrowUpDown } from "lucide-react"
import { PaginationControls } from "@/components/pagination-controls"

type SortKey = "title" | "year" | "career" | "studentName" | "createdAt"
type SortDir = "asc" | "desc"

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
  const [sortKey, setSortKey] = useState<SortKey>("year")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    const handle = setTimeout(() => {
      setYearError(null)
      const from = parseInt(yearFrom, 10)
      const to = parseInt(yearTo, 10)
      const fromNum = isFinite(from) ? from : null
      const toNum = isFinite(to) ? to : null

      if (fromNum !== null && toNum !== null && fromNum > toNum) {
        setYearError('El año "desde" no puede ser mayor al año "hasta"')
        return
      }

      startTransition(async () => {
        const filters: { career?: string; yearFrom?: number; yearTo?: number } = {}
        if (career) filters.career = career
        if (fromNum !== null) filters.yearFrom = fromNum
        if (toNum !== null) filters.yearTo = toNum

        const res = await searchProjects(query, filters)
        setResults(res)
        setCurrentPage(1)
        setHasSearched(query.trim().length > 0 || !!career || fromNum !== null || toNum !== null)
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

  // Ordenamiento
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir(key === "createdAt" ? "desc" : "asc") }
  }

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const aVal = String(a[sortKey] ?? "")
      const bVal = String(b[sortKey] ?? "")
      const cmp = aVal.localeCompare(bVal, "es")
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [results, sortKey, sortDir])

  // Paginación
  const totalPages = Math.max(1, Math.ceil(sortedResults.length / pageSize))
  const safePage = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedResults = sortedResults.slice((safePage - 1) * pageSize, safePage * pageSize)

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

      {/* Sorters */}
      <div className="flex gap-1 text-xs">
        {(["title", "year", "career", "studentName", "createdAt"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => { toggleSort(key); setCurrentPage(1); }}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
              sortKey === key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {key === "title" ? "Título" : key === "year" ? "Año" : key === "career" ? "Carrera" : key === "studentName" ? "Alumno" : "Fecha de subida"}
            {sortKey === key && <ArrowUpDown className="size-3" />}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {hasSearched
            ? `${sortedResults.length} ${sortedResults.length === 1 ? "resultado" : "resultados"} encontrados`
            : `${sortedResults.length} ${sortedResults.length === 1 ? "proyecto registrado" : "proyectos registrados"}`}
        </p>
      </div>

      {sortedResults.length === 0 ? (
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
            totalItems={sortedResults.length}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
