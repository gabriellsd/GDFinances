"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/format";

const evolution = [
  { month: "Jan", saldo: 8200 },
  { month: "Fev", saldo: 9100 },
  { month: "Mar", saldo: 8800 },
  { month: "Abr", saldo: 10200 },
  { month: "Mai", saldo: 11400 },
  { month: "Jun", saldo: 12840 },
];

const metrics = [
  {
    label: "Saldo total",
    value: 12840.55,
    delta: "+8,2%",
    icon: Wallet,
    tone: "text-primary",
  },
  {
    label: "Receitas do mês",
    value: 8450,
    delta: "+12%",
    icon: ArrowUpRight,
    tone: "text-success",
  },
  {
    label: "Despesas do mês",
    value: 3920.4,
    delta: "-18%",
    icon: ArrowDownRight,
    tone: "text-destructive",
  },
  {
    label: "Economia",
    value: 4529.6,
    delta: "+R$420",
    icon: PiggyBank,
    tone: "text-warning",
  },
];

const insights = [
  {
    title: "Você gastou 18% menos este mês",
    message: "Mercado e delivery caíram em relação a maio.",
    tone: "success" as const,
  },
  {
    title: "Seu cartão fecha amanhã",
    message: "Nubank • fatura estimada R$ 1.280,00",
    tone: "warning" as const,
  },
  {
    title: "Meta de emergência em 64%",
    message: "Faltam R$ 3.600 para completar a reserva.",
    tone: "info" as const,
  },
];

const recent = [
  { name: "Salário", amount: 7200, type: "income", date: "01 Jul" },
  { name: "Mercado", amount: -286.9, type: "expense", date: "14 Jul" },
  { name: "Spotify", amount: -21.9, type: "expense", date: "12 Jul" },
  { name: "Freelance", amount: 1250, type: "income", date: "10 Jul" },
];

export function DashboardPreview() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            Preview · dados mock
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Visão clara da sua saúde financeira em um só lugar.
          </p>
        </div>
        <Link
          href="/ai"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" />
          Perguntar à IA
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {metric.delta} vs mês anterior
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução do saldo</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolution}>
                <defs>
                  <linearGradient id="saldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="var(--primary)"
                  fill="url(#saldo)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Insights IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.title}
                className="rounded-xl border border-border/80 bg-secondary/40 p-3"
              >
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {insight.message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas movimentações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((item) => (
              <div
                key={`${item.name}-${item.date}`}
                className="flex items-center justify-between rounded-xl px-1 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <p
                  className={
                    item.amount >= 0
                      ? "text-sm font-semibold text-success"
                      : "text-sm font-semibold text-destructive"
                  }
                >
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta · Reserva de emergência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(6400)}
                </p>
                <p className="text-sm text-muted-foreground">
                  de {formatCurrency(10000)}
                </p>
              </div>
              <Badge variant="success">64%</Badge>
            </div>
            <Progress value={64} />
            <p className="text-sm text-muted-foreground">
              Previsão de conclusão em outubro com aportes atuais.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
