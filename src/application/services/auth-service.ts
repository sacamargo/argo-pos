import { z } from "zod";
import type { PublicUser } from "@/domain/entities/user";
import type { UserRepository } from "@/domain/repositories/user-repository";
import { verifyPassword } from "@/shared/utils/password";

export const loginInputSchema = z.object({
  username: z.string().trim().min(1, "Ingresa el usuario"),
  password: z.string().min(1, "Ingresa la contraseña"),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export type LoginResult = { ok: true; user: PublicUser } | { ok: false; error: string };

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async login(rawInput: LoginInput): Promise<LoginResult> {
    const parsed = loginInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const username = parsed.data.username.toLowerCase();
    const user = await this.users.findByUsername(username);

    if (!user || !user.active) {
      return { ok: false, error: "Usuario o contraseña incorrectos" };
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return { ok: false, error: "Usuario o contraseña incorrectos" };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
