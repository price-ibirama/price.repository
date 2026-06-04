import "@/app/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
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
        <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
            <body>
                <TooltipProvider>{children}</TooltipProvider>
            </body>
        </html>
    );
}
