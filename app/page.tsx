import { redirect } from "next/navigation"
import { isLoggedIn } from "@/app/actions/auth"
import { getProjects } from "@/app/actions/projects"
import { SiteHeader } from "@/components/site-header"
import { HomeTabs } from "@/components/home-tabs"
import type { SearchResult } from "@/lib/projects"

export default async function HomePage() {
  if (!(await isLoggedIn())) redirect("/ingresar")

  const rows = await getProjects()
  const initial: SearchResult[] = rows.map((r) => ({ ...r, score: 0 }))

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-balance text-2xl font-bold leading-tight sm:text-4xl">
            Repositorio de Proyectos de Grado
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-sidebar-foreground/80 sm:text-lg">
            Registra y busca proyectos de grado de Ingeniería en Sistemas,
            Telecomunicaciones y Petrolera de la UDABOL.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <HomeTabs initial={initial} />
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-sm text-muted-foreground">
          Universidad de Aquino Bolivia (UDABOL) — Plataforma de proyectos de grado
        </p>
      </footer>
    </div>
  )
}
