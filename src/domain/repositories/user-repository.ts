import type { User } from "@/domain/entities/user";

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
}
