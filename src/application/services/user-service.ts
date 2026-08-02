import { z } from "zod";
import type { ManagedUser } from "@/domain/entities/user";
import { toManagedUser } from "@/domain/entities/user";
import type { UserRepository } from "@/domain/repositories/user-repository";
import { hashPassword } from "@/shared/utils/password";

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Usuario mínimo 3 caracteres")
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, . _ -"),
  password: z.string().min(6, "Contraseña mínimo 6 caracteres").max(100),
  role: z.enum(["admin", "vendedor"]),
});

export const setUserActiveSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export const changePasswordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(6, "Contraseña mínimo 6 caracteres").max(100),
});

export class UserService {
  constructor(private readonly users: UserRepository) {}

  async list(): Promise<ManagedUser[]> {
    const rows = await this.users.listAll();
    return rows.map(toManagedUser);
  }

  async create(raw: unknown): Promise<ManagedUser> {
    const input = createUserSchema.parse(raw);
    const username = input.username.toLowerCase();
    const existing = await this.users.findByUsername(username);
    if (existing) {
      throw new Error("Ese nombre de usuario ya existe");
    }

    const passwordHash = await hashPassword(input.password);
    const created = await this.users.create({
      id: crypto.randomUUID(),
      username,
      passwordHash,
      role: input.role,
      createdAt: new Date().toISOString(),
    });

    return toManagedUser(created);
  }

  async setActive(raw: unknown): Promise<ManagedUser> {
    const input = setUserActiveSchema.parse(raw);
    const user = await this.users.findById(input.id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (user.role === "admin" && user.active && !input.active) {
      const activeAdmins = await this.users.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new Error("No puedes desactivar el último admin activo");
      }
    }

    const updated = await this.users.setActive(input.id, input.active);
    return toManagedUser(updated);
  }

  async changePassword(raw: unknown): Promise<ManagedUser> {
    const input = changePasswordSchema.parse(raw);
    const user = await this.users.findById(input.id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const passwordHash = await hashPassword(input.password);
    const updated = await this.users.setPasswordHash(input.id, passwordHash);
    return toManagedUser(updated);
  }
}
