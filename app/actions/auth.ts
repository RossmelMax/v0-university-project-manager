"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const SESSION_COOKIE = "udabol_session"
const USER_ID_COOKIE = "udabol_user_id"
const USER_ROLE_COOKIE = "udabol_role"

export async function isLoggedIn() {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value === "1"
}

export async function getCurrentUser() {
  const store = await cookies()
  const userId = store.get(USER_ID_COOKIE)?.value
  const role = store.get(USER_ROLE_COOKIE)?.value

  if (!userId) return null
  return { id: parseInt(userId, 10), role: role || "anonymous" }
}

export async function loginAsAnonymous() {
  const store = await cookies()
  const result = await db
    .insert(users)
    .values({ email: `anonymous-${Date.now()}@udabol.local`, role: "anonymous" })
    .returning({ id: users.id, role: users.role })

  if (result.length > 0) {
    const user = result[0]
    store.set(SESSION_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    store.set(USER_ID_COOKIE, user.id.toString(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    store.set(USER_ROLE_COOKIE, user.role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  redirect("/")
}

export async function loginAsAdmin(email: string) {
  const store = await cookies()

  // Buscar o crear usuario admin
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (!user) {
    const result = await db
      .insert(users)
      .values({ email, role: "admin" })
      .returning({ id: users.id, role: users.role })
    user = result[0]
  }

  store.set(SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  store.set(USER_ID_COOKIE, user.id.toString(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  store.set(USER_ROLE_COOKIE, user.role, {
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
  store.delete(USER_ID_COOKIE)
  store.delete(USER_ROLE_COOKIE)
  redirect("/ingresar")
}
