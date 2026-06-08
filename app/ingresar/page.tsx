import { redirect } from "next/navigation"
import { isLoggedIn, login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { GraduationCap, LogIn } from "lucide-react"

export default async function IngresarPage() {
  if (await isLoggedIn()) redirect("/")

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-sidebar px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="size-9" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-balance text-2xl font-bold leading-tight text-card-foreground sm:text-3xl">
            Repositorio de Proyectos de Grado
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Universidad de Aquino Bolivia <span className="font-semibold text-primary">UDABOL</span>
          </p>
        </div>

        <form action={login} className="mt-8">
          <Button type="submit" size="lg" className="h-14 w-full text-base font-semibold">
            <LogIn className="size-5" aria-hidden="true" />
            Ingresar a la plataforma
          </Button>
        </form>

        <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
          Acceso de demostración. No se requieren credenciales por ahora.
        </p>
      </div>

      <p className="mt-8 text-center text-sm text-sidebar-foreground/70">
        Sistema de gestión de proyectos de grado
      </p>
    </main>
  )
}
