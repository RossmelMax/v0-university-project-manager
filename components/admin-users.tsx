"use client";

import { useState, useEffect } from "react";
import { getAdminUsers, addAdminUser, removeAdminUser, toggleAdminStatus, type AdminUser } from "@/app/actions/users";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Trash2, Shield, ShieldOff } from "lucide-react";

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const result = await getAdminUsers();
    setUsers(result);
    setLoading(false);
  }

  async function handleAdd() {
    if (!email.trim() || !password.trim()) {
      setError("Email y contraseña son obligatorios");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setError("");

    try {
      // Crear usuario en Firebase Auth
      await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Registrar como admin en Firestore
      const result = await addAdminUser(email.trim(), name.trim());
      if (!result.ok) {
        setError(result.error || "Error al agregar admin");
      } else {
        setEmail("");
        setName("");
        setPassword("");
        await loadUsers();
      }
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/email-already-in-use") {
        setError("Este email ya está registrado en Firebase Auth. Puedes agregarlo como admin si ya existe.");
      } else {
        setError(err.message || "Error al crear usuario");
      }
    }
  }

  async function handleRemove(id: string) {
    await removeAdminUser(id);
    await loadUsers();
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleAdminStatus(id, !current);
    await loadUsers();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" />
          Administradores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mb-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Email del nuevo admin" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={handleAdd} className="self-start">
            <UserPlus className="size-4 mr-1" />
            Crear Administrador
          </Button>
        </div>
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay administradores registrados.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{u.displayName}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground">Agregado: {new Date(u.addedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(u.id, u.isActive)}
                    title={u.isActive ? "Desactivar administrador" : "Activar administrador"}
                  >
                    {u.isActive ? <Shield className="size-4 text-green-500" /> : <ShieldOff className="size-4 text-red-500" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(u.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
