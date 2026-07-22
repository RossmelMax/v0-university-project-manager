// app/actions/users.ts
"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getUserRole } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  addedAt: string;
  addedBy: string;
  isActive: boolean;
};

async function ensureAdmin() {
  const role = await getUserRole();
  if (role !== "admin") {
    throw new Error("No autorizado");
  }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    await ensureAdmin();
    const snapshot = await adminDb
      .collection("admins")
      .orderBy("addedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email as string,
        displayName: data.displayName as string,
        addedAt: data.addedAt as string,
        addedBy: data.addedBy as string,
        isActive: data.isActive as boolean,
      };
    });
  } catch (err) {
    console.error("Error obteniendo administradores:", err);
    return [];
  }
}

export async function addAdminUser(email: string, displayName: string) {
  try {
    await ensureAdmin();

    const existing = await adminDb
      .collection("admins")
      .where("email", "==", email.toLowerCase().trim())
      .get();

    if (!existing.empty) {
      return { ok: false as const, error: "Este email ya es administrador." };
    }

    await adminDb.collection("admins").add({
      email: email.toLowerCase().trim(),
      displayName: displayName.trim() || email.split("@")[0],
      addedAt: new Date().toISOString(),
      addedBy: "admin",
      isActive: true,
    });

    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error("Error agregando administrador:", err);
    return { ok: false as const, error: "No se pudo agregar administrador." };
  }
}

export async function removeAdminUser(id: string) {
  try {
    await ensureAdmin();
    await adminDb.collection("admins").doc(id).delete();
    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error("Error eliminando administrador:", err);
    return { ok: false as const, error: "No se pudo eliminar administrador." };
  }
}

export async function toggleAdminStatus(id: string, isActive: boolean) {
  try {
    await ensureAdmin();
    await adminDb.collection("admins").doc(id).update({ isActive });
    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error("Error actualizando estado:", err);
    return { ok: false as const, error: "No se pudo actualizar estado." };
  }
}
