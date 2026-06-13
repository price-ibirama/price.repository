"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const themeOptions = [
    {
        value: "light",
        label: "Claro",
        icon: Sun,
    },
    {
        value: "dark",
        label: "Escuro",
        icon: Moon,
    },
    {
        value: "system",
        label: "Sistema",
        icon: Monitor,
    },
];

function getThemeOption(theme: string | undefined) {
    return themeOptions.find((option) => option.value === theme) ?? themeOptions[2];
}

export function ThemeModeMenu() {
    const isMobile = useIsMobile();
    const [mounted, setMounted] = useState(false);
    const { setTheme, theme } = useTheme();
    const selectedTheme = mounted ? theme : "system";
    const selectedOption = getThemeOption(selectedTheme);
    const Icon = selectedOption.icon;

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <SidebarMenuItem>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip="Tema">
                        <Icon />
                        <span className="group-data-[collapsible=icon]:hidden">{selectedOption.label}</span>
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isMobile ? "start" : "end"} side={isMobile ? "top" : "right"} className="w-48">
                    <DropdownMenuLabel>Tema</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedTheme ?? "system"} onValueChange={setTheme}>
                        {themeOptions.map((option) => {
                            const OptionIcon = option.icon;

                            return (
                                <DropdownMenuRadioItem key={option.value} value={option.value}>
                                    <OptionIcon />
                                    {option.label}
                                </DropdownMenuRadioItem>
                            );
                        })}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    );
}
