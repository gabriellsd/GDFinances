"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, secondaryNav } from "@/lib/navigation";
import { useUIStore } from "@/store/ui-store";
import { APP_NAME } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {APP_NAME}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Gabriel Dias Finances
            </p>
          </div>
        )}
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-sidebar-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="relative z-10 flex flex-1 items-center justify-between gap-2">
                  {item.title}
                  {item.premium && (
                    <Badge variant="secondary" className="text-[10px]">
                      IA
                    </Badge>
                  )}
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

      <div className="space-y-1 border-t border-sidebar-border p-3">
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
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && item.title}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
