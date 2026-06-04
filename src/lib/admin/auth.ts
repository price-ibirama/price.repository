import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AdminRole = "owner" | "admin" | "editor" | "viewer";

export type CurrentAdmin = {
    userId: string;
    email: string | null;
    role: AdminRole;
};

type AdminMemberRow = {
    role: AdminRole;
    active: boolean;
};

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const claims = claimsData?.claims;

    if (!claims?.sub) {
        return null;
    }

    const serviceClient = createServiceClient();
    const { data: adminMember, error } = await serviceClient
        .from("admin_members")
        .select("role, active")
        .eq("user_id", claims.sub)
        .eq("active", true)
        .maybeSingle<AdminMemberRow>();

    if (error || !adminMember?.active) {
        return null;
    }

    return {
        userId: claims.sub,
        email: typeof claims.email === "string" ? claims.email : null,
        role: adminMember.role,
    };
}

export async function requireAdmin() {
    const admin = await getCurrentAdmin();

    if (!admin) {
        redirect("/login");
    }

    return admin;
}
