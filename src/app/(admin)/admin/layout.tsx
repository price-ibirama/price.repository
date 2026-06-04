import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import type { ReactNode } from "react";

type AdminLayoutProps = {
    children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const admin = await requireAdmin();

    return (
        <AdminShell adminEmail={admin.email ?? admin.userId} adminRole={admin.role}>
            {children}
        </AdminShell>
    );
}
