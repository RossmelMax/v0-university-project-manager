"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const SESSION_COOKIE = "udabol_session"

export async function isLoggedIn() {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value === "1"
}

export async function login() {
  const store = await cookies()
  store.set(SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  redirect("/")
}

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect("/ingresar")
}
