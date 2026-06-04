import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminLayoutProps = {
    children: ReactNode;
};

const navigation = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/ofertas", label: "Ofertas" },
    { href: "/admin/produtos", label: "Produtos" },
    { href: "/admin/ingestao", label: "Ingestão" },
    { href: "/admin/buscas", label: "Buscas" },
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const admin = await requireAdmin();

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <Link className="text-xl font-bold text-slate-950" href="/admin">
                            Price Admin
                        </Link>
                        <p className="text-sm text-slate-500">
                            {admin.email ?? admin.userId} · {admin.role}
                        </p>
                    </div>
                    <form action="/auth/signout" method="post">
                        <Button variant="secondary" type="submit">
                            Sair
                        </Button>
                    </form>
                </div>
                <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-4">
                    {navigation.map((item) => (
                        <Link
                            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                            href={item.href}
                            key={item.href}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </header>
            <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
    );
}
