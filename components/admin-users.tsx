"use client";

import { useState, useEffect } from "react";
import { getAdminUsers, addAdminUser, removeAdminUser, toggleAdminStatus, type AdminUser } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Trash2, Shield, ShieldOff } from "lucide-react";

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
    if (!email.trim()) return;
    setError("");
    const result = await addAdminUser(email, name);
    if (!result.ok) {
      setError(result.error);
    } else {
      setEmail("");
      setName("");
      await loadUsers();
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
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Email del nuevo admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={handleAdd} className="shrink-0">
            <UserPlus className="size-4 mr-1" />
            Agregar
          </Button>
        </div>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay administradores registrados.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{u.displayName}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Agregado: {new Date(u.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(u.id, u.isActive)}
                  >
                    {u.isActive ? (
                      <Shield className="size-4 text-green-500" />
                    ) : (
                      <ShieldOff className="size-4 text-red-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(u.id)}
                  >
                    <Trash2 className="size-4 text-red-500" />
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
