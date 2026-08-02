"use server";

import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/modules/core/errors/app-error";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, business_id, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw toAppError(error, "PROFILE_LOAD_FAILED");
  }

  return data;
}
