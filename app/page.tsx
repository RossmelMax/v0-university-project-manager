import { redirect } from "next/navigation"
import { getUserRole, isLoggedIn } from "@/app/actions/auth"
import { getProjects } from "@/app/actions/projects"
import { SiteHeader } from "@/components/site-header"
import { HomeTabs } from "@/components/home-tabs"
import type { SearchResult } from "@/lib/projects"

export default async function HomePage() {
  if (!(await isLoggedIn())) redirect("/ingresar")

  const role = await getUserRole()
  const rows = await getProjects()
  const initial: SearchResult[] = rows.map((r) => ({ ...r, score: 0 }))
  const hasDatabase = Boolean(process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim())

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
          <h1 className="text-balance text-lg font-bold leading-tight sm:text-xl">
            Repositorio de Proyectos de Grado
          </h1>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-sidebar-foreground/80">
            Ingeniería en Sistemas, Telecomunicaciones y Petrolera — UDABOL
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {!hasDatabase && (
          <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900">
            La base de datos no está configurada en este entorno, así que la app está mostrando datos de respaldo.
            Cuando conectes Supabase o PostgreSQL, define DATABASE_URL para habilitar guardado y búsquedas reales.
          </div>
        )}
        <HomeTabs initial={initial} role={role} />
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-sm text-muted-foreground">
          Universidad de Aquino Bolivia (UDABOL) — Plataforma de proyectos de grado
        </p>
      </footer>
    </div>
  )
}
