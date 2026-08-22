import { notFound, redirect } from "next/navigation";
import { isLoggedIn } from "@/app/actions/auth";
import { getProjectById } from "@/app/actions/projects";
import { SiteHeader } from "@/components/site-header";
import { ProjectDetail } from "@/components/project-detail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isLoggedIn())) redirect("/ingresar");

  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) notFound();

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full">
        <ProjectDetail project={project} />
      </main>
      <footer className="border-t border-border py-8 mt-auto bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground flex flex-col gap-2">
          <p className="font-medium text-foreground">
            Plataforma de gestión y consulta de proyectos de grado con
            integración IA
          </p>
          <p>Desarrollado para la Universidad de Aquino Bolivia (UDABOL)</p>
          <p className="text-xs mt-2 opacity-60">
            © {new Date().getFullYear()} Rossmel Abasto. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
