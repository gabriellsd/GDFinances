import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankIcon } from "@/components/shared/bank-icon";
import { MoneyAmount } from "@/components/shared/money-amount";
import { formatCurrency, formatDate } from "@/utils/format";
import { CategoryDonutChart } from "@/features/dashboard/components/category-donut-chart";
import { cn } from "@/lib/utils";

type DashboardStats = Awaited<
  ReturnType<typeof import("@/features/transactions/actions").getDashboardStats>
>;

export function DashboardView({ stats }: { stats: DashboardStats }) {
  const metrics = [
    {
      label: "Saldo atual",
      value: stats.totalBalance,
      href: "/accounts",
      icon: Wallet,
      iconWrap: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
      amountTone: "auto" as const,
      signed: false,
    },
    {
      label: "Saldo previsto",
      value: stats.projectedBalance,
      href: "/transactions",
      icon: Sparkles,
      iconWrap:
        "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
      amountTone: "auto" as const,
      signed: false,
    },
    {
      label: "Receitas",
      value: stats.income,
      href: "/transactions",
      icon: ArrowUpRight,
      iconWrap:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
      amountTone: "income" as const,
      signed: false,
    },
    {
      label: "Despesas",
      value: stats.expense,
      href: "/transactions",
      icon: ArrowDownRight,
      iconWrap:
        "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
      amountTone: "expense" as const,
      signed: false,
    },
  ];

  const creditAccounts = stats.accounts.filter(
    (account) => account.type === "credit"
  );
  const cashAccounts = stats.accounts.filter(
    (account) => account.type !== "credit"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Dashboard
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.label} href={metric.href} className="group">
              <Card className="h-full border-border/70 transition-shadow hover:shadow-soft">
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                      metric.iconWrap
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {metric.label}
                    </p>
                    <MoneyAmount
                      value={metric.value}
                      tone={metric.amountTone}
                      signed={metric.signed}
                      className="text-lg font-bold tracking-tight"
                    />
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Meu Desempenho
        <ArrowRight className="h-4 w-4" />
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Despesas por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <CategoryDonutChart
              key={`expense-${stats.monthLabel}-${stats.expense}`}
              data={stats.expensesByCategory}
              emptyLabel="Sem despesas"
            />
          </CardContent>
          <div className="border-t border-border/70 py-3 text-center">
            <Link
              href="/categories"
              className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
            >
              Ver mais
            </Link>
          </div>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Receitas por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <CategoryDonutChart
              key={`income-${stats.monthLabel}-${stats.income}`}
              data={stats.incomeByCategory}
              emptyLabel="Sem receitas"
            />
          </CardContent>
          <div className="border-t border-border/70 py-3 text-center">
            <Link
              href="/categories"
              className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
            >
              Ver mais
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Balanço mensal
            </CardTitle>
            <Link
              href="/transactions"
              className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
            >
              Ver mais
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-secondary/70 px-4 py-3">
              <span className="text-sm text-muted-foreground">Receitas</span>
              <span className="font-semibold text-success">
                {formatCurrency(stats.income)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/70 px-4 py-3">
              <span className="text-sm text-muted-foreground">Despesas</span>
              <span className="font-semibold text-destructive">
                {formatCurrency(stats.expenseTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="text-sm font-medium">Resultado</span>
              <MoneyAmount
                value={stats.savings}
                tone="auto"
                className="text-base font-bold"
              />
            </div>

            {stats.recent.length > 0 ? (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Últimos lançamentos
                </p>
                {stats.recent.slice(0, 4).map((tx) => {
                  const positive = tx.type === "income";
                  const categoryName =
                    (tx.categories as { name?: string } | null)?.name ?? "";
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {tx.description ||
                            categoryName ||
                            (positive ? "Receita" : "Despesa")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.date)}
                        </p>
                      </div>
                      <MoneyAmount
                        value={Number(tx.amount)}
                        tone={positive ? "income" : "expense"}
                        signed
                        className="text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Cartões de crédito
            </CardTitle>
            <Link
              href="/cards"
              className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
            >
              Ver mais
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {creditAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cartão cadastrado.{" "}
                <Link href="/cards" className="text-primary hover:underline">
                  Criar agora
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {creditAccounts.map((account) => {
                  const limit = Number(account.credit_limit ?? 0);
                  const available = Number(account.available_limit ?? 0);
                  const used =
                    limit > 0
                      ? Math.max(0, limit - available)
                      : Math.abs(Math.min(0, account.current_balance));
                  const percent =
                    limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

                  return (
                    <Link
                      key={account.id}
                      href="/cards"
                      className="block rounded-2xl border border-border/60 bg-secondary/40 p-4 transition-colors hover:bg-secondary/70"
                    >
                      <div className="flex items-start gap-3">
                        <BankIcon
                          bank={account.icon}
                          bankName={account.bank_name}
                          size={40}
                          rounded="lg"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {account.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Limite {formatCurrency(limit)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] text-muted-foreground">
                                Em uso
                              </p>
                              <MoneyAmount
                                value={used}
                                tone="expense"
                                className="text-sm font-semibold"
                              />
                            </div>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/80">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                percent >= 90
                                  ? "bg-destructive"
                                  : percent >= 70
                                    ? "bg-amber-500"
                                    : "bg-primary"
                              )}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Disponível
                            </span>
                            <span className="font-medium tabular-nums text-foreground">
                              {formatCurrency(available)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="space-y-3 border-t border-border/70 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Contas</p>
                <Link
                  href="/accounts"
                  className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
                >
                  Ver mais
                </Link>
              </div>

              {cashAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma conta cadastrada.{" "}
                  <Link
                    href="/accounts"
                    className="text-primary hover:underline"
                  >
                    Criar agora
                  </Link>
                </p>
              ) : (
                <div className="space-y-2">
                  {cashAccounts.slice(0, 4).map((account) => (
                    <Link
                      key={account.id}
                      href="/accounts"
                      className="flex items-center justify-between rounded-xl px-1 py-2 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <BankIcon
                          bank={account.icon}
                          bankName={account.bank_name}
                          size={32}
                          rounded="lg"
                        />
                        <p className="truncate text-sm font-medium">
                          {account.name}
                        </p>
                      </div>
                      <MoneyAmount
                        value={Number(account.current_balance)}
                        tone="auto"
                        className="text-sm font-semibold"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
