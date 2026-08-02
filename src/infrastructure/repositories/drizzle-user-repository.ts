import { eq } from "drizzle-orm";
import type { User } from "@/domain/entities/user";
import type { UserRepository } from "@/domain/repositories/user-repository";
import { users } from "@/database/schema";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: AppDatabase) {}

  async findByUsername(username: string): Promise<User | null> {
    const [row] = await this.db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      passwordHash: row.passwordHash,
      role: row.role,
      active: row.active,
      createdAt: row.createdAt,
    };
  }
}
