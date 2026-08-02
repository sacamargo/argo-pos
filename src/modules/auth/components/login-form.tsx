"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/design-system/components/button";
import { Card } from "@/design-system/components/card";
import { Input } from "@/design-system/components/input";
import { signInWithPassword } from "@/modules/auth/services/sign-in-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await signInWithPassword({ email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/pos");
      router.refresh();
    } catch {
      setError("No pudimos iniciar sesión. Revisa tus datos.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-medium text-[var(--color-accent)]">Argo POS</p>
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Entra para registrar ventas en segundos.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Correo
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            Contraseña
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
