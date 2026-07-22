"use client";

import { useEffect, useState } from "react";
import { getProjectHistory } from "@/app/actions/projects";
import type { ProjectHistoryLog } from "@/lib/projects";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  PlusCircle,
  Pencil,
  Trash2,
  FileUp,
  Loader2,
} from "lucide-react";

export function ProjectHistoryList({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<ProjectHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const data = await getProjectHistory(projectId);
      setLogs(data);
      setLoading(false);
    }

    if (projectId) fetchHistory();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay registros en el historial para este proyecto.
      </div>
    );
  }

  // Diccionario para iconos y colores según la acción
  const actionStyles = {
    CREATE: {
      icon: PlusCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    UPDATE: { icon: Pencil, color: "text-blue-500", bg: "bg-blue-500/10" },
    DELETE: {
      icon: Trash2,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    PDF_UPLOAD: {
      icon: FileUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  };

  return (
    <div className="space-y-6">
      <h3 className="flex items-center text-lg font-semibold text-foreground">
        <Activity className="mr-2 size-5" />
        Historial de Cambios
      </h3>

      <div className="relative space-y-4 before:absolute before:inset-y-0 before:left-4.75 before:w-px before:bg-border">
        {logs.map((log) => {
          const Style = actionStyles[log.action] || {
            icon: Activity,
            color: "text-muted-foreground",
            bg: "bg-muted",
          };
          const Icon = Style.icon;

          return (
            <div
              key={log.id}
              className="relative flex items-start gap-4"
            >
              <div
                className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-background ${Style.bg} ${Style.color}`}
              >
                <Icon className="size-4" />
              </div>

              <div className="flex flex-col gap-1 pt-1.5">
                <p className="text-sm font-medium text-foreground">
                  {log.details}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm", {
                      locale: es,
                    })}
                  </span>
                  <span>•</span>
                  <span className="capitalize">Por: {log.userRole}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
