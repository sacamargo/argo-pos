import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { getAppServices } from "@/application/container";
import { loginInputSchema, type LoginInput } from "@/application/services/auth-service";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components";
import { BrandAvatar } from "@/modules/shared/components/brand-avatar";
import {
  APP_PRODUCT_NAME,
  BUSINESS_NAME,
  formatAppTitle,
} from "@/shared/constants/branding";
import { useSessionStore } from "@/shared/hooks/use-session";

type LoginFormProps = {
  onSuccess?: () => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const setSession = useSessionStore((state) => state.setSession);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setFormError(null);

    try {
      const { auth } = await getAppServices();
      const result = await auth.login(values);

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setSession(result.user);
      onSuccess?.();
    } catch {
      setFormError("No se pudo iniciar sesión. Revisa que la app esté en modo Tauri.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandAvatar size="xl" className="ring-4 ring-primary/25 shadow-lg" />
        <div className="space-y-1">
          <p className="text-2xl font-semibold tracking-tight">{BUSINESS_NAME}</p>
          <p className="text-sm text-muted-foreground">{formatAppTitle()}</p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Iniciar sesión</CardTitle>
          <CardDescription>
            {APP_PRODUCT_NAME} · {BUSINESS_NAME}. Caja local, sin internet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="username">
                Usuario
              </label>
              <Input
                id="username"
                autoComplete="username"
                autoFocus
                className="h-12 text-base"
                {...register("username")}
              />
              {errors.username ? (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-12 text-base"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              ) : null}
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <Button type="submit" size="lg" className="h-12 w-full" disabled={submitting}>
              {submitting ? "Entrando…" : "Entrar"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Demo: admin / admin123 · vendedor / vendedor123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
