// app/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/projects";

const SESSION_COOKIE = "udabol_session";

export async function isLoggedIn() {
  const store = await cookies();
  return store.has(SESSION_COOKIE);
}

export async function getUserRole(): Promise<UserRole> {
  const store = await cookies();
  const sessionData = store.get(SESSION_COOKIE)?.value;

  if (!sessionData) return "anonymous";

  try {
    if (sessionData === "admin") return "admin";
    if (sessionData === "anonymous") return "anonymous";

    const parsed = JSON.parse(sessionData);
    return parsed.role === "admin" ? "admin" : "anonymous";
  } catch {
    return "anonymous";
  }
}

export async function loginAction({
  idToken,
  role,
}: {
  idToken: string;
  role: string;
}) {
  const store = await cookies();

  const sessionData = JSON.stringify({ token: idToken, role });

  store.set(SESSION_COOKIE, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true };
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/ingresar");
}
