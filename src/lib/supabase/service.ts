import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
    }

    if (!secretKey) {
        throw new Error("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required");
    }

    return createClient(supabaseUrl, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
