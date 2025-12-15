"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resetMyData(confirmMode: "dev_fast" | "prod_confirmed") {
  const supabase = createClient();
  const { error } = await supabase.rpc("reset_my_data", { confirm_mode: confirmMode });
  
  if (error) {
    console.error("Reset Error", error);
    throw new Error("Failed to reset data");
  }

  revalidatePath("/");
  return { success: true };
}
