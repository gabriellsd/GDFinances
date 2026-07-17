"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, secondaryNav } from "@/lib/navigation";
import { useUIStore } from "@/store/ui-store";
import { APP_NAME } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const openCreate = useUIStore((s) => s.openCreate);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[76px]" : "w-[240px]"
      )}
    >
      <div className={cn("px-4 pt-5", collapsed && "px-2")}>
        <Link href="/dashboard" className="mb-5 flex items-center px-1">
          {!collapsed ? (
            <span className="text-xl font-bold tracking-tight text-primary">
              {APP_NAME}
            </span>
          ) : (
            <span className="mx-auto text-lg font-bold text-primary">GD</span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={cn(
                "w-full rounded-full shadow-soft",
                collapsed && "h-10 w-10 px-0"
              )}
            >
              <Plus className="h-4 w-4" />
              {!collapsed ? "Novo" : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onSelect={() => openCreate("income")}>
              Receita
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openCreate("expense")}>
              Despesa
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openCreate("account")}>
              Conta
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openCreate("category")}>
              Categoria
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {mainNav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              ) : null}
              <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
              {!collapsed && (
                <span className="relative z-10 flex flex-1 items-center justify-between gap-2">
                  {item.title}
                  {item.premium ? (
                    <Badge variant="secondary" className="text-[10px]">
                      IA
                    </Badge>
                  ) : null}
                </span>
              )}
            </Link>
          );

          if (!collapsed) return link;

          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.title}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border p-2">
        {secondaryNav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {!collapsed && item.title}
            </Link>
          );
        })}
        <a
          href="mailto:suporte@gdfinances.app"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <CircleHelp className="h-[18px] w-[18px]" />
          {!collapsed && "Central de Ajuda"}
        </a>
      </div>
    </aside>
  );
}
