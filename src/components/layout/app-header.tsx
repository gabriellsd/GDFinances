"use client";

import { useTheme } from "next-themes";
import {
  Bell,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/ui-store";
import { UserMenu } from "@/features/auth/components/user-menu";

export function AppHeader() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="relative hidden max-w-md flex-1 md:block"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          readOnly
          placeholder="Pesquisar contas, transações, tags..."
          className="cursor-pointer pl-9 pr-16"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setCommandOpen(true)}
          aria-label="Pesquisar"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button className="hidden sm:inline-flex" size="sm">
          <Plus className="h-4 w-4" />
          Nova
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Alternar tema"
          onClick={() =>
            setTheme(
              (theme === "system" ? resolvedTheme : theme) === "dark"
                ? "light"
                : "dark"
            )
          }
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
