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
  const role =
    (formData?.get("role") as string | null) === "admin"
      ? "admin"
      : "anonymous";
  store.set(SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/ingresar");
}
