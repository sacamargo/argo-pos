import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/modules/auth/types/login";

export async function signInWithPassword(input: LoginInput) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos de acceso inválidos",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false as const, error: "Credenciales inválidas" };
  }

  return { ok: true as const };
}
