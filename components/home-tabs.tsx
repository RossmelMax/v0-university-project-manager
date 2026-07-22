"use client";

import { useState } from "react";
import { ProjectSearch } from "@/components/project-search";
import { ProjectForm } from "@/components/project-form";
import { AdminProjects } from "@/components/admin-projects";
import { BulkPdfUpload } from "@/components/bulk-pdf-upload";
import { deleteProject, getProjects } from "@/app/actions/projects";
import type { SearchResult } from "@/lib/projects";
import {
  Search,
  FilePlus2,
  ShieldCheck,
  FolderGit2,
  UploadCloud,
} from "lucide-react";

type Tab = "buscar" | "registrar" | "admin" | "bulk"; // <-- Agregamos "bulk"

export function HomeTabs({
  initial,
  role,
}: {
  initial: SearchResult[];
  role: "anonymous" | "admin";
}) {
  const [tab, setTab] = useState<Tab>("buscar");
  const [projects, setProjects] = useState(initial);
  const [editingProject, setEditingProject] = useState<SearchResult | null>(
    null,
  );

  async function refreshProjects() {
    const rows = await getProjects();
    setProjects(rows.map((r) => ({ ...r, score: 0 })));
  }

  async function handleDelete(id: string) {
    await deleteProject(id);
    await refreshProjects();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Grid dinámico: 4 columnas si es admin, 1 si es user normal */}
      <div
        className="grid gap-2 rounded-2xl bg-muted/50 p-2 border border-border/50"
        style={{
          gridTemplateColumns:
            role === "admin"
              ? "repeat(4, minmax(0, 1fr))"
              : "repeat(1, minmax(0, 1fr))",
        }}
      >
        <TabButton
          active={tab === "buscar"}
          onClick={() => setTab("buscar")}
        >
          <Search
            className="size-4.5"
            aria-hidden="true"
          />
          Buscar
        </TabButton>

        {role === "admin" ? (
          <>
            <TabButton
              active={tab === "admin"}
              onClick={() => setTab("admin")}
            >
              <FolderGit2
                className="size-4.5"
                aria-hidden="true"
              />
              Administrar
            </TabButton>

            <TabButton
              active={tab === "registrar"}
              onClick={() => {
                setEditingProject(null);
                setTab("registrar");
              }}
            >
              <FilePlus2
                className="size-4.5"
                aria-hidden="true"
              />
              Registrar
            </TabButton>

            {/* Nueva Tab de Bulk Upload */}
            <TabButton
              active={tab === "bulk"}
              onClick={() => {
                setEditingProject(null);
                setTab("bulk");
              }}
            >
              <UploadCloud
                className="size-4.5"
                aria-hidden="true"
              />
              Subida Masiva
            </TabButton>
          </>
        ) : null}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {tab === "buscar" ? (
          <ProjectSearch initial={projects} />
        ) : tab === "admin" ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="mb-2 text-2xl font-bold text-card-foreground flex items-center gap-2">
              <ShieldCheck className="size-6 text-primary" />
              Gestión de proyectos
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground max-w-2xl">
              Usa esta vista para editar o eliminar proyectos y para administrar
              el repositorio oficial.
            </p>
            <AdminProjects
              projects={projects}
              onDelete={handleDelete}
              onEdit={(project) => {
                setEditingProject(project);
                setTab("registrar");
              }}
            />
          </div>
        ) : tab === "registrar" ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="mb-2 text-2xl font-bold text-card-foreground flex items-center gap-2">
              <FilePlus2 className="size-6 text-primary" />
              {editingProject ? "Editar proyecto" : "Nuevo proyecto de grado"}
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground max-w-2xl">
              Sube un PDF primero, si quieres, y luego ajusta los datos antes de
              guardar. El sistema detectará automáticamente la información.
            </p>
            <ProjectForm
              mode={editingProject ? "edit" : "create"}
              project={editingProject}
              onSuccess={async () => {
                setEditingProject(null);
                await refreshProjects();
                setTab("buscar");
              }}
            />
          </div>
        ) : (
          /* Renderizamos el nuevo componente aquí */
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="mb-2 text-2xl font-bold text-card-foreground flex items-center gap-2">
              <UploadCloud className="size-6 text-primary" />
              Subida Masiva de Proyectos (Bulk Upload)
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground max-w-2xl">
              Arrastra múltiples PDFs de tesis aquí. El sistema extraerá los
              metadatos de todos en lote y los subirá a la base de datos
              automáticamente.
            </p>
            <BulkPdfUpload onSuccess={refreshProjects} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all sm:text-base ${active
        ? "bg-card text-primary shadow-sm ring-1 ring-border/50 scale-[1.01]"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        }`}
    >
      {children}
    </button>
  );
}
