// app/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/projects";
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE = "udabol_session";
const SESSION_MAX_DAYS = 14;

export async function isLoggedIn() {
  const store = await cookies();
  return store.has(SESSION_COOKIE);
}

export async function getUserRole(): Promise<UserRole> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return "anonymous";

  // Formato: "sessionCookie|role"
  const pipeIdx = raw.lastIndexOf("|");
  if (pipeIdx === -1) return "anonymous";

  const sessionCookie = raw.slice(0, pipeIdx);
  const role = raw.slice(pipeIdx + 1);
  if (!sessionCookie) return "anonymous";

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    if (!decoded?.uid) return "anonymous";
    return role === "admin" ? "admin" : "anonymous";
  } catch {
    // Session expirada o inválida — login otra vez
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

  // Session cookie de Firebase: válida 14 días
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_DAYS * 24 * 60 * 60 * 1000,
  });

  store.set(SESSION_COOKIE, `${sessionCookie}|${role}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_DAYS * 24 * 60 * 60,
  });

  return { success: true };
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/ingresar");
}
