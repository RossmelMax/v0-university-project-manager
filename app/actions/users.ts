// app/actions/users.ts
"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { getUserRole } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  uid?: string;
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
        uid: data.uid as string | undefined,
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

export async function addAdminUser(email: string, displayName: string, uid?: string) {
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
      uid: uid || null,
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

export async function updateAdminUser(
  id: string,
  data: { displayName?: string; email?: string; password?: string }
) {
  try {
    await ensureAdmin();

    const docRef = adminDb.collection("admins").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return { ok: false as const, error: "Administrador no encontrado." };
    }

    const currentData = doc.data()!;
    const updates: Record<string, unknown> = {};

    if (data.displayName !== undefined && data.displayName.trim()) {
      updates.displayName = data.displayName.trim();
    }

    if (data.email !== undefined && data.email.trim()) {
      const newEmail = data.email.toLowerCase().trim();
      if (newEmail !== currentData.email) {
        updates.email = newEmail;
      }
    }

    if (Object.keys(updates).length > 0) {
      await docRef.update(updates);
    }

    if (data.password && data.password.trim().length >= 6) {
      let uid = currentData.uid as string | undefined;
      if (!uid) {
        try {
          const userRecord = await adminAuth.getUserByEmail(
            (updates.email as string) || currentData.email
          );
          uid = userRecord.uid;
        } catch {
          return { ok: false as const, error: "No se pudo encontrar el usuario en Firebase Auth." };
        }
      }
      await adminAuth.updateUser(uid, { password: data.password.trim() });

      if (data.email && data.email.trim() && updates.email) {
        await adminAuth.updateUser(uid, { email: updates.email as string });
      }
    }

    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    console.error("Error actualizando administrador:", err);
    return { ok: false as const, error: "No se pudo actualizar el administrador." };
  }
}
