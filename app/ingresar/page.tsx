"use client"

import { useTransition, useState } from "react"
import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, LogIn, ShieldCheck, AlertCircle } from "lucide-react"

export default function IngresarPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAnonymousLogin() {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("role", "anonymous")
      await login(formData)
    })
  }

  function handleAdminLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append("role", "admin")

    startTransition(async () => {
      const res = await login(formData)
      if (res?.error) {
        setError(res.error)
      }
    })
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

        <div className="mt-8 flex flex-col gap-6">
          <Button 
            type="button" 
            onClick={handleAnonymousLogin} 
            disabled={isPending}
            size="lg" 
            className="h-14 w-full text-base font-semibold"
          >
            <LogIn className="size-5 mr-2" aria-hidden="true" />
            Ingresar como invitado (búsqueda)
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o ingreso administrativo</span>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="admin@udabol.edu.bo" 
                required 
                className="h-12"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="h-12"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isPending}
              variant="secondary" 
              size="lg" 
              className="h-14 w-full text-base font-semibold"
            >
              <ShieldCheck className="size-5 mr-2" aria-hidden="true" />
              Acceso Administrador
            </Button>
          </form>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-sidebar-foreground/70">
        Sistema de gestión de proyectos de grado
      </p>
    </main>
  )
}
