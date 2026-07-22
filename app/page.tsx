import { redirect } from "next/navigation";
import { getUserRole, isLoggedIn } from "@/app/actions/auth";
import { getProjects } from "@/app/actions/projects";
import { SiteHeader } from "@/components/site-header";
import { HomeTabs } from "@/components/home-tabs";
import type { SearchResult } from "@/lib/projects";
import { BookOpen } from "lucide-react";

export default async function HomePage() {
  if (!(await isLoggedIn())) redirect("/ingresar");

  const role = await getUserRole();
  const rows = await getProjects();
  const initial: SearchResult[] = rows.map((r) => ({ ...r, score: 0 }));

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <SiteHeader />

      {/* Hero section eliminado por claridad */}

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 flex-1 w-full">
        <HomeTabs
          initial={initial}
          role={role}
        />
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
