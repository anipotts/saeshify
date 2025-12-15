"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserPreferences {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  explicit_content: boolean;
  details_panel_open?: boolean;
  details_width?: number;
}

export async function getUserPreferences() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching prefs:", error);
    return null;
  }

  // If missing, return defaults (or create?)
  // For now return defaults + user metadata fallbacks
  if (!data) {
    return {
      user_id: user.id,
      display_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      explicit_content: true,
      details_panel_open: false,
      details_width: 360,
    };
  }

  return data as UserPreferences;
}

export async function updateUserPreferences(updates: Partial<UserPreferences>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");

  const payload = {
    user_id: user.id,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Error updating prefs:", error);
    throw new Error("Failed to update preferences");
  }

  revalidatePath("/");
  return { success: true };
}
