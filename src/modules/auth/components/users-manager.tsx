"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/design-system/components/button";
import { Card } from "@/design-system/components/card";
import { Input } from "@/design-system/components/input";
import { Badge } from "@/design-system/components/badge";
import {
  linkAuthUser,
  updateUser,
} from "@/modules/auth/services/users-service";
import { ROLE_LABELS, type Role } from "@/modules/core/constants";

type UserRow = {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export function UsersManager({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    userId: "",
    fullName: "",
    role: "cashier" as "admin" | "cashier",
  });

  function linkUser() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await linkAuthUser(form);
        setMessage("Usuario vinculado");
        setForm({ userId: "", fullName: "", role: "cashier" });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-5">
        <h2 className="text-lg font-semibold">Vincular usuario Auth</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Crea el usuario en Supabase Authentication y pega aquí su UUID.
        </p>
        <Input
          placeholder="UUID del usuario (auth.users id)"
          value={form.userId}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, userId: event.target.value }))
          }
        />
        <Input
          placeholder="Nombre completo"
          value={form.fullName}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, fullName: event.target.value }))
          }
        />
        <select
          className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
          value={form.role}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              role: event.target.value as "admin" | "cashier",
            }))
          }
        >
          <option value="cashier">Vendedor</option>
          <option value="admin">Administrador</option>
        </select>
        <Button disabled={pending} onClick={linkUser}>
          Vincular
        </Button>
        {message ? (
          <p className="text-sm text-[var(--color-success)]">{message}</p>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
      </Card>

      <Card className="divide-y divide-[var(--color-border)]">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          >
            <div>
              <p className="font-medium">{user.full_name}</p>
              <p className="text-xs text-[var(--color-muted)]">{user.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={user.is_active ? "success" : "neutral"}>
                {ROLE_LABELS[user.role as Role] ?? user.role}
              </Badge>
              {user.role !== "master" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await updateUser({
                        userId: user.id,
                        isActive: !user.is_active,
                      });
                      router.refresh();
                    });
                  }}
                >
                  {user.is_active ? "Desactivar" : "Activar"}
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
