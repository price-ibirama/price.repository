"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z4 from "zod/v4";

const loginSchema = z4.object({
    email: z4.email(),
    password: z4.string().min(6),
});

export async function login(formData: FormData) {
    const parsed = loginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!parsed.success) {
        redirect("/login?error=invalid");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
        redirect("/login?error=credentials");
    }

    revalidatePath("/", "layout");
    redirect("/admin");
}
