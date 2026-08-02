import type { User, UserRole } from "@/domain/entities/user";

export type CreateUserRecordInput = {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
};

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  listAll(): Promise<User[]>;
  create(input: CreateUserRecordInput): Promise<User>;
  setActive(id: string, active: boolean): Promise<User>;
  setPasswordHash(id: string, passwordHash: string): Promise<User>;
  countActiveAdmins(): Promise<number>;
}
