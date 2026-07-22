"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, PencilLine, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SearchResult } from "@/lib/projects";
import { ProjectHistoryList } from "@/components/project-history";

type Props = {
  projects: SearchResult[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (project: SearchResult) => void;
};

export function AdminProjects({ projects, onDelete, onEdit }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  // Estado para controlar qué proyecto está mostrando su historial en el modal
  const [historyProject, setHistoryProject] = useState<SearchResult | null>(
    null,
  );

  async function handleDelete(id: string, title: string) {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres eliminar el proyecto "${title}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      await onDelete(id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay proyectos aún.</p>
      ) : (
        projects.map((project) => (
          <Card
            key={project.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <h3 className="font-semibold">{project.title}</h3>
              <p className="text-sm text-muted-foreground">
                {project.studentName} · {project.career} · {project.year}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {project.abstract}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Botón de Historial */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHistoryProject(project)}
              >
                <History className="mr-2 size-4" />
                Historial
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(project)}
              >
                <PencilLine className="mr-2 size-4" />
                Editar
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busyId === project.id}
                onClick={() => handleDelete(project.id, project.title)}
              >
                <Trash2 className="mr-2 size-4" />
                Eliminar
              </Button>
            </div>
          </Card>
        ))
      )}

      {/* Modal de Historial */}
      <Dialog
        open={!!historyProject}
        onOpenChange={(open) => !open && setHistoryProject(null)}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-150">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Auditoría del Proyecto
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {historyProject?.title}
            </p>
          </DialogHeader>

          <div className="mt-4">
            {historyProject && (
              <ProjectHistoryList projectId={historyProject.id} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
