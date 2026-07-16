import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Plus,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BankIcon } from "@/components/shared/bank-icon";
import { formatCurrency, formatDate } from "@/utils/format";

type DashboardStats = Awaited<
  ReturnType<typeof import("@/features/transactions/actions").getDashboardStats>
>;

export function DashboardView({ stats }: { stats: DashboardStats }) {
  const metrics = [
    {
      label: "Saldo total",
      value: stats.totalBalance,
      icon: Wallet,
      tone: "text-primary",
    },
    {
      label: "Receitas do mês",
      value: stats.income,
      icon: ArrowUpRight,
      tone: "text-success",
    },
    {
      label: "Despesas do mês",
      value: stats.expense,
      icon: ArrowDownRight,
      tone: "text-destructive",
    },
    {
      label: "Economia do mês",
      value: stats.savings,
      icon: PiggyBank,
      tone: "text-warning",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            Dados reais · Supabase
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Visão clara da sua saúde financeira em um só lugar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/accounts">
              <Plus className="h-4 w-4" />
              Conta
            </Link>
          </Button>
          <Button asChild>
            <Link href="/transactions">
              <Plus className="h-4 w-4" />
              Transação
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <div className="rounded-xl bg-secondary p-2">
                    <Icon className={`h-4 w-4 ${metric.tone}`} />
                  </div>
                </div>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatCurrency(metric.value)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Suas contas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/accounts">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma conta cadastrada.{" "}
                <Link href="/accounts" className="text-primary hover:underline">
                  Criar agora
                </Link>
              </p>
            ) : (
              stats.accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-xl px-1 py-2"
                >
                  <div className="flex items-center gap-3">
                    <BankIcon
                      bank={account.icon}
                      bankName={account.bank_name}
                      size={32}
                      rounded="lg"
                    />
                    <p className="text-sm font-medium">{account.name}</p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(Number(account.current_balance))}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas movimentações</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem lançamentos ainda.{" "}
                <Link
                  href="/transactions"
                  className="text-primary hover:underline"
                >
                  Registrar
                </Link>
              </p>
            ) : (
              stats.recent.map((tx) => {
                const positive = tx.type === "income";
                const accountName =
                  (tx.accounts as { name?: string } | null)?.name ?? "";
                const categoryName =
                  (tx.categories as { name?: string } | null)?.name ?? "";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl px-1 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {tx.description ||
                          categoryName ||
                          (positive ? "Receita" : "Despesa")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                        {accountName ? ` · ${accountName}` : ""}
                      </p>
                    </div>
                    <p
                      className={
                        positive
                          ? "text-sm font-semibold text-success"
                          : "text-sm font-semibold text-destructive"
                      }
                    >
                      {positive ? "+" : "-"}
                      {formatCurrency(Number(tx.amount))}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
