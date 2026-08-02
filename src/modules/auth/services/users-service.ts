"use server";

import { createClient } from "@/lib/supabase/server";
import { AppError, toAppError } from "@/modules/core/errors/app-error";
import { getCurrentProfile } from "@/modules/auth/services/auth-service";
import { canManageUsers } from "@/modules/core/permissions";
import type { Role } from "@/modules/core/constants";
import { z } from "zod";

const linkUserSchema = z.object({
  userId: z.uuid(),
  fullName: z.string().min(2).max(120),
  role: z.enum(["admin", "cashier"]),
});

const updateUserSchema = z.object({
  userId: z.uuid(),
  fullName: z.string().min(2).max(120).optional(),
  role: z.enum(["admin", "cashier"]).optional(),
  isActive: z.boolean().optional(),
});

async function requireMaster() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageUsers(profile.role as Role)) {
    throw new AppError("FORBIDDEN", "Solo master puede gestionar usuarios");
  }
  return profile;
}

export async function listUsers() {
  try {
    await requireMaster();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_active, created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    throw toAppError(error, "USERS_LIST_FAILED");
  }
}

export async function linkAuthUser(input: z.infer<typeof linkUserSchema>) {
  try {
    const master = await requireMaster();
    const parsed = linkUserSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase.from("profiles").upsert(
      {
        id: parsed.userId,
        business_id: master.business_id,
        full_name: parsed.fullName,
        role: parsed.role,
        is_active: true,
      },
      { onConflict: "id" },
    );

    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    throw toAppError(error, "USER_LINK_FAILED");
  }
}

export async function updateUser(input: z.infer<typeof updateUserSchema>) {
  try {
    const master = await requireMaster();
    const parsed = updateUserSchema.parse(input);
    const supabase = await createClient();

    const { data: target } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", parsed.userId)
      .maybeSingle();

    if (!target) throw new Error("USER_NOT_FOUND");
    if (target.role === "master" && parsed.userId !== master.id) {
      throw new AppError("FORBIDDEN", "No puedes editar otro master");
    }
    if (parsed.role && target.role === "master") {
      throw new AppError("FORBIDDEN", "No puedes cambiar el rol master");
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        ...(parsed.fullName ? { full_name: parsed.fullName } : {}),
        ...(parsed.role ? { role: parsed.role } : {}),
        ...(typeof parsed.isActive === "boolean"
          ? { is_active: parsed.isActive }
          : {}),
      })
      .eq("id", parsed.userId);

    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    throw toAppError(error, "USER_UPDATE_FAILED");
  }
}
