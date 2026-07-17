"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/format";

export type CategorySlice = {
  id: string;
  name: string;
  color: string;
  value: number;
};

const FALLBACK_COLORS = [
  "#7c3aed",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

export function CategoryDonutChart({
  data,
  emptyLabel = "Sem dados",
}: {
  data: CategorySlice[];
  emptyLabel?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData =
    total > 0
      ? data
      : [{ id: "empty", name: emptyLabel, color: "#e2e8f0", value: 1 }];

  const active =
    total > 0 && activeId
      ? chartData.find((item) => item.id === activeId) ?? null
      : null;
  const activePercent =
    active && total > 0 ? Math.round((active.value / total) * 100) : 0;

  return (
    <div className="relative mx-auto h-[220px] w-full max-w-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="92%"
            paddingAngle={total > 0 ? 2 : 0}
            stroke="none"
            onMouseEnter={(_, index) => {
              if (total <= 0) return;
              setActiveId(chartData[index]?.id ?? null);
            }}
            onMouseLeave={() => setActiveId(null)}
          >
            {chartData.map((entry, index) => {
              const fill =
                total > 0
                  ? entry.color ||
                    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                  : "#e2e8f0";
              const dimmed =
                total > 0 && activeId != null && entry.id !== activeId;

              return (
                <Cell
                  key={entry.id}
                  fill={fill}
                  fillOpacity={dimmed ? 0.35 : 1}
                  style={{ cursor: total > 0 ? "pointer" : "default" }}
                />
              );
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        {active ? (
          <>
            <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
              {active.name}
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-foreground">
              {activePercent}%
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatCurrency(active.value)}
            </p>
          </>
        ) : (
          <p className="text-lg font-bold tracking-tight text-foreground">
            {formatCurrency(total)}
          </p>
        )}
      </div>
    </div>
  );
}
