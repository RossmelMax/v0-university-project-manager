import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { GraduationCap, LogOut } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-6" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold sm:text-base">Proyectos de Grado</p>
            <p className="text-xs text-sidebar-foreground/70">UDABOL</p>
          </div>
        </div>

        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
