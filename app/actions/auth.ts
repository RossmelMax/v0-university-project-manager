"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/projects";

const SESSION_COOKIE = "udabol_session";

export async function isLoggedIn() {
  const store = await cookies();
  const v = store.get(SESSION_COOKIE)?.value;
  return v === "admin" || v === "anonymous" || Boolean(v);
}

export async function getUserRole(): Promise<UserRole> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return value === "admin" ? "admin" : "anonymous";
}

export async function login(formData: FormData | null = null) {
  const store = await cookies();
  const role = formData?.get("role") as string | null;

  if (role === "admin") {
    const email = formData?.get("email") as string | null;
    const password = formData?.get("password") as string | null;

    if (email !== "admin@udabol.edu.bo" || password !== "123456") {
      return { error: "Credenciales incorrectas" };
    }

    store.set(SESSION_COOKIE, "admin", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/");
  } else {
    store.set(SESSION_COOKIE, "anonymous", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/");
  }
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/ingresar");
}
