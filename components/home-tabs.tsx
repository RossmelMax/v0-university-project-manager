"use client"

import { useState } from "react"
import { ProjectSearch } from "@/components/project-search"
import { ProjectForm } from "@/components/project-form"
import type { SearchResult } from "@/lib/projects"
import { Search, FilePlus2 } from "lucide-react"

type Tab = "buscar" | "registrar"

export function HomeTabs({ initial }: { initial: SearchResult[] }) {
  const [tab, setTab] = useState<Tab>("buscar")

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1.5">
        <TabButton active={tab === "buscar"} onClick={() => setTab("buscar")}>
          <Search className="size-4.5" aria-hidden="true" />
          Buscar proyectos
        </TabButton>
        <TabButton active={tab === "registrar"} onClick={() => setTab("registrar")}>
          <FilePlus2 className="size-4.5" aria-hidden="true" />
          Registrar proyecto
        </TabButton>
      </div>

      {tab === "buscar" ? (
        <ProjectSearch initial={initial} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <h2 className="mb-1 text-xl font-bold text-card-foreground">Nuevo proyecto de grado</h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Completa los datos para agregar el proyecto al repositorio.
          </p>
          <ProjectForm />
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
      className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors sm:text-base ${
        active
          ? "bg-card text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}
