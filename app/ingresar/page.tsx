"use client"

import { loginAsAnonymous, loginAsAdmin } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, LogIn, ShieldCheck, Eye } from "lucide-react"
import { useState } from "react"

export default function IngresarPage() {
  const [mode, setMode] = useState<"choose" | "admin">("choose")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError("Por favor ingresa un correo")
      return
    }
    setError("")
    setIsLoading(true)
    try {
      await loginAsAdmin(email.trim())
    } catch (err) {
      setError("Error al iniciar sesión. Intenta de nuevo.")
      setIsLoading(false)
    }
  }

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

        {mode === "choose" ? (
          <div className="mt-8 space-y-3">
            <form action={loginAsAnonymous}>
              <Button
                type="submit"
                size="lg"
                className="h-14 w-full text-base font-semibold bg-muted hover:bg-muted/80 text-foreground"
              >
                <Eye className="size-5" aria-hidden="true" />
                Acceso Anónimo
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode("admin")
                setError("")
              }}
              className="h-14 w-full rounded-md bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="size-5" aria-hidden="true" />
              Acceso de Administrador
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdminLogin} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo de Administrador
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@udabol.edu.bo"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                className="h-12"
                disabled={isLoading}
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1 h-12"
                onClick={() => {
                  setMode("choose")
                  setEmail("")
                  setError("")
                }}
                disabled={isLoading}
              >
                Atrás
              </Button>
              <Button type="submit" size="lg" className="flex-1 h-12 font-semibold" disabled={isLoading}>
                <LogIn className="size-5" aria-hidden="true" />
                {isLoading ? "Entrando..." : "Ingresar"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-sidebar-foreground/70">
        Sistema de gestión de proyectos de grado
      </p>
    </main>
  )
}
