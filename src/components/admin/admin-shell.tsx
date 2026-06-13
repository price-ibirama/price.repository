"use client";

import { ThemeModeMenu } from "@/components/admin/theme-mode-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  ClipboardCheck,
  DatabaseZap,
  LogOut,
  MessageCircleQuestion,
  MessageSquareText,
  Store,
  StoreIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AdminShellProps = {
  adminEmail: string;
  adminRole: string;
  children: ReactNode;
  showDeveloperTools?: boolean;
};

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const navigation: NavigationItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Visão operacional",
    icon: BarChart3,
  },
  {
    href: "/admin/ofertas",
    label: "Ofertas",
    description: "Publicações e validade",
    icon: BadgePercent,
  },
  {
    href: "/admin/estabelecimentos",
    label: "Estabelecimentos",
    description: "Lojas e fontes",
    icon: StoreIcon,
  },
  {
    href: "/admin/produtos",
    label: "Produtos",
    description: "Catálogo canônico",
    icon: Boxes,
  },
  {
    href: "/admin/ingestao",
    label: "Ingestão",
    description: "Lotes e fontes",
    icon: DatabaseZap,
  },
  {
    href: "/admin/qualidade",
    label: "Qualidade",
    description: "Ofertas invalidas",
    icon: ClipboardCheck,
  },
  {
    href: "/admin/buscas",
    label: "Buscas",
    description: "Lacunas de matching",
    icon: MessageCircleQuestion,
  },
];

const developmentNavigation: NavigationItem[] = [
  {
    href: "/admin/simulador",
    label: "Simulador",
    description: "Chat local",
    icon: MessageSquareText,
  },
];

function getInitials(email: string) {
  const [name] = email.split("@");
  const parts = name.split(/[._-]/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "PA"
  );
}

function getCurrentPage(pathname: string, navigationItems: NavigationItem[]) {
  return (
    navigationItems.find((item) =>
      item.href === "/admin"
        ? pathname === item.href
        : pathname.startsWith(item.href),
    ) ?? navigation[0]
  );
}

export function AdminShell({
  adminEmail,
  adminRole,
  children,
  showDeveloperTools = false,
}: AdminShellProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const navigationItems = showDeveloperTools
    ? [...navigation, ...developmentNavigation]
    : navigation;
  const currentPage = getCurrentPage(pathname, navigationItems);

  return (
    <SidebarProvider className="min-h-svh bg-background">
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" tooltip="Price Admin">
                <Link
                  href="/admin"
                  className="group-data-[collapsible=icon]:grid group-data-[collapsible=icon]:place-items-center"
                >
                  <Store />
                  <span className="flex min-w-0 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">Price Admin</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Ofertas no WhatsApp
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="flex flex-col gap-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span className="group-data-[collapsible=icon]:hidden">
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu className="flex flex-col gap-2">
            <ThemeModeMenu />
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="size-8">
                      <AvatarFallback>{getInitials(adminEmail)}</AvatarFallback>
                    </Avatar>
                    <span className="flex min-w-0 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-medium">{adminEmail}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {adminRole}
                      </span>
                    </span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isMobile ? "start" : "end"}
                  side={isMobile ? "top" : "right"}
                  className="w-64"
                >
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="truncate">{adminEmail}</span>
                    <Badge className="w-fit" variant="secondary">
                      {adminRole}
                    </Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild variant="destructive">
                    <button
                      form="admin-signout-form"
                      type="submit"
                      className="w-full"
                    >
                      <LogOut />
                      Sair
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
          <form action="/auth/signout" id="admin-signout-form" method="post" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="flex h-14 min-w-0 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">
                  {currentPage.label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Badge variant="outline">{currentPage.description}</Badge>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/ingestao">Nova ingestão</Link>
            </Button>
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
