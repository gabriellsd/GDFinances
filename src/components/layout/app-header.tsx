"use client";

import { useTheme } from "next-themes";
import { ChevronDown, ChevronLeft, ChevronRight, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  financeMonthLabel,
  MONTH_LABELS,
  useUIStore,
} from "@/store/ui-store";
import { UserMenu } from "@/features/auth/components/user-menu";

function buildMonthOptions(centerYear: number, centerMonth: number) {
  const options: Array<{ year: number; month: number; label: string }> = [];
  const center = new Date(centerYear, centerMonth, 1);

  for (let offset = -6; offset <= 6; offset++) {
    const date = new Date(center.getFullYear(), center.getMonth() + offset, 1);
    options.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: financeMonthLabel(date.getFullYear(), date.getMonth(), true),
    });
  }

  return options;
}

export function AppHeader() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const financeMonth = useUIStore((s) => s.financeMonth);
  const setFinanceMonth = useUIStore((s) => s.setFinanceMonth);
  const shiftFinanceMonth = useUIStore((s) => s.shiftFinanceMonth);

  const label = MONTH_LABELS[financeMonth.month] ?? "";
  const options = buildMonthOptions(financeMonth.year, financeMonth.month);

  return (
    <header className="sticky top-0 z-40 grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => shiftFinanceMonth(-1)}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium capitalize text-foreground shadow-soft transition hover:bg-secondary"
            >
              {label}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="max-h-72 w-48 overflow-y-auto">
            {options.map((option) => {
              const active =
                option.year === financeMonth.year &&
                option.month === financeMonth.month;
              return (
                <DropdownMenuItem
                  key={`${option.year}-${option.month}`}
                  onSelect={() => setFinanceMonth(option.year, option.month)}
                  className={active ? "bg-accent font-semibold text-primary" : ""}
                >
                  {option.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => shiftFinanceMonth(1)}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-end gap-1.5">
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

        <UserMenu showLabel />
      </div>
    </header>
  );
}
