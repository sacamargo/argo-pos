import { and, asc, eq, sql } from "drizzle-orm";
import type { User } from "@/domain/entities/user";
import type {
  CreateUserRecordInput,
  UserRepository,
} from "@/domain/repositories/user-repository";
import { users } from "@/database/schema";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

function mapRow(row: {
  id: string;
  username: string;
  passwordHash: string;
  role: User["role"];
  active: boolean;
  createdAt: string;
}): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.passwordHash,
    role: row.role,
    active: row.active,
    createdAt: row.createdAt,
  };
}

const selectFields = {
  id: users.id,
  username: users.username,
  passwordHash: users.passwordHash,
  role: users.role,
  active: users.active,
  createdAt: users.createdAt,
};

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: AppDatabase) {}

  async findByUsername(username: string): Promise<User | null> {
    const [row] = await this.db
      .select(selectFields)
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select(selectFields)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  async listAll(): Promise<User[]> {
    const rows = await this.db
      .select(selectFields)
      .from(users)
      .orderBy(asc(users.username));

    return rows.map(mapRow);
  }

  async create(input: CreateUserRecordInput): Promise<User> {
    const user: User = {
      id: input.id,
      username: input.username,
      passwordHash: input.passwordHash,
      role: input.role,
      active: true,
      createdAt: input.createdAt,
    };
    await this.db.insert(users).values(user);
    return user;
  }

  async setActive(id: string, active: boolean): Promise<User> {
    await this.db.update(users).set({ active }).where(eq(users.id, id));
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Usuario no encontrado tras cambiar estado");
    }
    return updated;
  }

  async setPasswordHash(id: string, passwordHash: string): Promise<User> {
    await this.db.update(users).set({ passwordHash }).where(eq(users.id, id));
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Usuario no encontrado tras cambiar contraseña");
    }
    return updated;
  }

  async countActiveAdmins(): Promise<number> {
    const [row] = await this.db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.active, true)));

    return row?.count ?? 0;
  }
}
