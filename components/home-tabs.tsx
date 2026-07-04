"use client"

import { useState } from "react"
import { ProjectSearch } from "@/components/project-search"
import { ProjectForm } from "@/components/project-form"
import { AdminProjects } from "@/components/admin-projects"
import { deleteProject, getProjects } from "@/app/actions/projects"
import type { SearchResult } from "@/lib/projects"
import { Search, FilePlus2, ShieldCheck } from "lucide-react"

type Tab = "buscar" | "registrar" | "admin"

export function HomeTabs({ initial, role }: { initial: SearchResult[]; role: "anonymous" | "admin" }) {
  const [tab, setTab] = useState<Tab>("buscar")
  const [projects, setProjects] = useState(initial)
  const [editingProject, setEditingProject] = useState<SearchResult | null>(null)

  async function refreshProjects() {
    const rows = await getProjects()
    setProjects(rows.map((r) => ({ ...r, score: 0 })))
  }

  async function handleDelete(id: number) {
    await deleteProject(id)
    await refreshProjects()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-2 rounded-xl bg-muted p-1.5" style={{ gridTemplateColumns: role === "admin" ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))" }}>
        <TabButton active={tab === "buscar"} onClick={() => setTab("buscar")}>
          <Search className="size-4.5" aria-hidden="true" />
          Buscar proyectos
        </TabButton>
        {role === "admin" ? (
          <>
            <TabButton active={tab === "admin"} onClick={() => setTab("admin")}>
              <ShieldCheck className="size-4.5" aria-hidden="true" />
              Administrar
            </TabButton>
            <TabButton active={tab === "registrar"} onClick={() => setTab("registrar")}>
              <FilePlus2 className="size-4.5" aria-hidden="true" />
              Registrar proyecto
            </TabButton>
          </>
        ) : null}
      </div>

      {tab === "buscar" ? (
        <ProjectSearch initial={projects} />
      ) : tab === "admin" ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <h2 className="mb-1 text-xl font-bold text-card-foreground">Gestión de proyectos</h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Usa esta vista para editar o eliminar proyectos y para administrar el repositorio.
          </p>
          <AdminProjects projects={projects} onDelete={handleDelete} onEdit={(project) => {
            setEditingProject(project)
            setTab("registrar")
          }} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <h2 className="mb-1 text-xl font-bold text-card-foreground">{editingProject ? "Editar proyecto" : "Nuevo proyecto de grado"}</h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Sube un PDF primero, si quieres, y luego ajusta los datos antes de guardar.
          </p>
          <ProjectForm mode={editingProject ? "edit" : "create"} project={editingProject} onSuccess={async () => {
            setEditingProject(null)
            await refreshProjects()
            setTab("buscar")
          }} />
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors sm:text-base ${active
        ? "bg-card text-primary shadow-sm"
        : "text-muted-foreground hover:text-foreground"
        }`}
    >
      {children}
    </button>
  )
}
