"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function toISODate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function MiniMonthCalendar({
  value,
  onChange,
  accentClassName,
}: {
  value: string;
  onChange: (iso: string) => void;
  accentClassName?: string;
}) {
  const selected = useMemo(() => {
    try {
      return parseISO(value);
    } catch {
      return new Date();
    }
  }, [value]);

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMonth((current) => addMonths(current, -1))}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMonth((current) => addMonths(current, 1))}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="py-1 text-center text-[11px] font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const selectedDay = isSameDay(day, selected);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                onChange(toISODate(day));
                if (!inMonth) setViewMonth(startOfMonth(day));
              }}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-lg text-sm transition",
                !inMonth && "text-muted-foreground/40",
                inMonth && "text-foreground hover:bg-secondary",
                today && !selectedDay && "font-semibold text-primary",
                selectedDay &&
                  cn(
                    accentClassName ?? "bg-primary text-primary-foreground",
                    "font-semibold hover:opacity-90"
                  )
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
