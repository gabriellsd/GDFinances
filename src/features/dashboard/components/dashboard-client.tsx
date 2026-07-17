"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getDashboardStats } from "@/features/transactions/actions";
import { useUIStore } from "@/store/ui-store";

type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export function DashboardClient({
  initialStats,
}: {
  initialStats: DashboardStats;
}) {
  const financeMonth = useUIStore((s) => s.financeMonth);
  const [stats, setStats] = useState(initialStats);
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    if (useUIStore.persist.hasHydrated()) {
      finish();
      return;
    }
    return useUIStore.persist.onFinishHydration(finish);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;
    setPending(true);

    void (async () => {
      try {
        const next = await getDashboardStats({
          year: financeMonth.year,
          month: financeMonth.month,
        });
        if (!cancelled) setStats(next);
      } finally {
        if (!cancelled) setPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, financeMonth.year, financeMonth.month]);

  return (
    <div className="relative">
      {pending ? (
        <div className="absolute right-0 top-0 z-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : null}
      <DashboardView
        key={`${financeMonth.year}-${financeMonth.month}-${stats.income}-${stats.expense}-${stats.projectedBalance}-${stats.totalBalance}`}
        stats={stats}
      />
    </div>
  );
}
