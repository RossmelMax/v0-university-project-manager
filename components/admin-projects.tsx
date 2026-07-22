"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, PencilLine, History, Search, ArrowUpDown } from "lucide-react";
import { PaginationControls } from "@/components/pagination-controls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SearchResult } from "@/lib/projects";
import { ProjectHistoryList } from "@/components/project-history";

type SortKey = "title" | "year" | "career" | "studentName";
type SortDir = "asc" | "desc";

type Props = {
  projects: SearchResult[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (project: SearchResult) => void;
};

export function AdminProjects({ projects, onDelete, onEdit }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [historyProject, setHistoryProject] = useState<SearchResult | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("year");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = projects;
    if (q) {
      list = projects.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.studentName.toLowerCase().includes(q) ||
          p.career.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const aVal = String(a[sortKey] ?? "");
      const bVal = String(b[sortKey] ?? "");
      const cmp = aVal.localeCompare(bVal, "es");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [projects, search, sortKey, sortDir]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`¿Eliminar "${title}"?`)) return;
    setBusyId(id);
    try { await onDelete(id); } finally { setBusyId(null); }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título, alumno o carrera..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="h-10 pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1 text-xs">
          {(["title", "year", "career", "studentName"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                sortKey === key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {key === "title" ? "Título" : key === "year" ? "Año" : key === "career" ? "Carrera" : "Alumno"}
              {sortKey === key && <ArrowUpDown className="size-3" />}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {search ? "Sin resultados para esa búsqueda." : "No hay proyectos aún."}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {paginated.map((project) => (
              <Card key={project.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between min-h-[100px]">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{project.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {project.studentName} · {project.career} · {project.year}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {project.abstract}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button type="button" variant="outline" size="sm" onClick={() => setHistoryProject(project)}>
                    <History className="mr-1 size-3.5" /> Historial
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(project)}>
                    <PencilLine className="mr-1 size-3.5" /> Editar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" disabled={busyId === project.id} onClick={() => handleDelete(project.id, project.title)}>
                    <Trash2 className="mr-1 size-3.5" /> Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <PaginationControls
            pageSize={pageSize}
            currentPage={safePage}
            totalItems={filtered.length}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <Dialog open={!!historyProject} onOpenChange={(open) => !open && setHistoryProject(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-150">
          <DialogHeader>
            <DialogTitle className="text-xl">Auditoría del Proyecto</DialogTitle>
            <p className="text-sm text-muted-foreground">{historyProject?.title}</p>
          </DialogHeader>
          {historyProject && <ProjectHistoryList projectId={historyProject.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
