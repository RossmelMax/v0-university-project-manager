import { redirect } from "next/navigation"
import { getUserRole, isLoggedIn } from "@/app/actions/auth"
import { getProjects } from "@/app/actions/projects"
import { SiteHeader } from "@/components/site-header"
import { HomeTabs } from "@/components/home-tabs"
import type { SearchResult } from "@/lib/projects"
import { BookOpen } from "lucide-react"

export default async function HomePage() {
  if (!(await isLoggedIn())) redirect("/ingresar")

  const role = await getUserRole()
  const rows = await getProjects()
  const initial: SearchResult[] = rows.map((r) => ({ ...r, score: 0 }))

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <SiteHeader />

      <section className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/20 p-2 rounded-xl text-primary">
              <BookOpen className="size-6" />
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl text-primary-foreground">
              Proyectos de Grado
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-sidebar-foreground/80 sm:text-lg">
            Explora el repositorio oficial de investigaciones y proyectos de grado de las carreras de <span className="font-semibold text-sidebar-foreground">Ingeniería en Sistemas, Telecomunicaciones y Petrolera</span> de la Universidad de Aquino Bolivia.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 flex-1 w-full">
        <HomeTabs initial={initial} role={role} />
      </main>

      <footer className="border-t border-border py-8 mt-auto bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground flex flex-col gap-2">
          <p className="font-medium text-foreground">Plataforma de gestión y consulta de proyectos de grado con integración IA</p>
          <p>Desarrollado para la Universidad de Aquino Bolivia (UDABOL)</p>
          <p className="text-xs mt-2 opacity-60">© {new Date().getFullYear()} Rossmel Abasto. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
