import "@/app/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Price",
    description: "Chat automatizado de ofertas para WhatsApp",
};

type RootLayoutProps = {
    children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
