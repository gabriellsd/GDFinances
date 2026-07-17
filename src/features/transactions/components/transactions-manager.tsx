"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Filter,
  MoreVertical,
  Pencil,
  PiggyBank,
  Search,
  Trash2,
  Wallet,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyAmount } from "@/components/shared/money-amount";
import { BankIcon } from "@/components/shared/bank-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import { financeMonthLabel, useUIStore } from "@/store/ui-store";
import {
  expandRecurringForMonth,
  isProjectedTransactionId,
  parseProjectedTransactionId,
  type DisplayTransaction as RecurringDisplay,
} from "@/lib/recurring-transactions";
import {
  deleteTransaction,
  materializeRecurringOccurrence,
  updateTransaction,
  type TransactionWithRelations,
} from "@/features/transactions/actions";
import { TransactionCreateDialog } from "@/features/create/components/transaction-create-dialog";
import type { Account, Category } from "@/types";

type DisplayTransaction = RecurringDisplay<TransactionWithRelations>;

type FilterType = "all" | "income" | "expense" | "pending";

type AccountRel = {
  id?: string;
  name?: string;
  color?: string;
  icon?: string | null;
  bank_name?: string | null;
  type?: string;
} | null;

type CategoryRel = {
  id?: string;
  name?: string;
  color?: string;
} | null;

export function TransactionsManager({
  transactions,
  accounts,
  categories: _categories,
}: {
  transactions: TransactionWithRelations[];
  accounts: Account[];
  categories: Category[];
  defaultType?: "income" | "expense";
}) {
  void _categories;
  const router = useRouter();
  const openCreate = useUIStore((s) => s.openCreate);
  const financeMonth = useUIStore((s) => s.financeMonth);
  const shiftFinanceMonth = useUIStore((s) => s.shiftFinanceMonth);
  const [pending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] =
    useState<TransactionWithRelations | null>(null);
  const [editing, setEditing] = useState<DisplayTransaction | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const monthLabel = financeMonthLabel(
    financeMonth.year,
    financeMonth.month,
    true
  );

  const monthTransactions = useMemo(() => {
    return expandRecurringForMonth(
      transactions,
      financeMonth.year,
      financeMonth.month
    );
  }, [transactions, financeMonth.year, financeMonth.month]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return monthTransactions.filter((tx) => {
      if (filter === "income" && tx.type !== "income") return false;
      if (filter === "expense" && tx.type !== "expense") return false;
      if (filter === "pending" && tx.is_paid) return false;
      if (!query) return true;
      const category = tx.categories as CategoryRel;
      const account = tx.accounts as AccountRel;
      const haystack = [tx.description, category?.name, account?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [monthTransactions, filter, search]);

  const stats = useMemo(() => {
    const income = monthTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = monthTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const pendingIncome = monthTransactions
      .filter((tx) => tx.type === "income" && !tx.is_paid)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const pendingExpense = monthTransactions
      .filter((tx) => tx.type === "expense" && !tx.is_paid)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalBalance = accounts
      .filter((account) => account.type !== "credit")
      .reduce((sum, account) => sum + Number(account.current_balance), 0);

    return {
      totalBalance,
      income,
      expense,
      balance: income - expense,
      projectedBalance: totalBalance + pendingIncome - pendingExpense,
    };
  }, [monthTransactions, accounts]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, DisplayTransaction[]>();
    for (const tx of filtered) {
      const key = tx.date.slice(0, 10);
      const list = groups.get(key) ?? [];
      list.push(tx);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  function shiftMonth(delta: number) {
    shiftFinanceMonth(delta);
  }

  function togglePaid(tx: DisplayTransaction) {
    if (tx.type === "transfer") return;

    startTransition(async () => {
      if (isProjectedTransactionId(tx.id) || tx.is_projected) {
        const parsed = parseProjectedTransactionId(tx.id);
        if (!parsed) {
          toast.error("Ocorrência inválida");
          return;
        }
        const result = await materializeRecurringOccurrence({
          sourceId: parsed.sourceId,
          date: tx.date.slice(0, 10),
          is_paid: true,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(
          tx.type === "income" ? "Receita fixa confirmada" : "Despesa fixa paga"
        );
        router.refresh();
        return;
      }

      const result = await updateTransaction(tx.id, {
        type: tx.type as "income" | "expense",
        amount: Number(tx.amount),
        account_id: tx.account_id,
        category_id: tx.category_id,
        date: tx.date.slice(0, 10),
        description: tx.description,
        notes: tx.notes,
        payment_method: tx.payment_method,
        is_paid: !tx.is_paid,
        recurrence: tx.is_recurring ? "fixed" : "once",
        installment_count: null,
        installment_current: null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tx.is_paid ? "Marcada como pendente" : "Marcada como paga");
      router.refresh();
    });
  }

  function requestEdit(tx: DisplayTransaction) {
    if (tx.type === "transfer") {
      toast.message("Transferências não podem ser editadas por aqui.");
      return;
    }
    if (tx.is_projected || isProjectedTransactionId(tx.id)) {
      toast.message(
        "Essa é uma ocorrência prevista da série fixa. Confirme/pague ela antes de editar, ou edite o lançamento original."
      );
      return;
    }
    setEditing(tx);
  }

  function requestDelete(tx: DisplayTransaction) {
    if (tx.is_projected || isProjectedTransactionId(tx.id)) {
      toast.message(
        "Essa é uma ocorrência futura da série fixa. Exclua o lançamento original para remover dos próximos meses."
      );
      return;
    }
    setPendingDelete(tx);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const tx = pendingDelete;
    startTransition(async () => {
      const result = await deleteTransaction(tx.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Transação excluída");
      setPendingDelete(null);
      router.refresh();
    });
  }

  const metrics = [
    {
      label: "Saldo atual",
      value: stats.totalBalance,
      icon: Wallet,
      iconWrap: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
      tone: "auto" as const,
      signed: false,
    },
    {
      label: "Saldo previsto",
      value: stats.projectedBalance,
      icon: Sparkles,
      iconWrap:
        "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
      tone: "auto" as const,
      signed: false,
    },
    {
      label: "Receitas",
      value: stats.income,
      icon: ArrowUpRight,
      iconWrap:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
      tone: "income" as const,
      signed: false,
    },
    {
      label: "Despesas",
      value: stats.expense,
      icon: ArrowDownRight,
      iconWrap:
        "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
      tone: "expense" as const,
      signed: false,
    },
    {
      label: "Balanço mensal",
      value: stats.balance,
      icon: PiggyBank,
      iconWrap:
        "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
      tone: "auto" as const,
      signed: true,
    },
  ];

  const filterLabel =
    filter === "all"
      ? "Todas"
      : filter === "income"
        ? "Receitas"
        : filter === "expense"
          ? "Despesas"
          : "Pendentes";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full border-primary/30 text-primary">
                <Filter className="h-4 w-4" />
                {filterLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setFilter("all")}>
                Todas
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilter("income")}>
                Receitas
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilter("expense")}>
                Despesas
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilter("pending")}>
                Pendentes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Buscar"
            onClick={() => setShowSearch((value) => !value)}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showSearch ? (
        <Input
          autoFocus
          placeholder="Buscar por descrição, categoria ou conta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border-border/70">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    metric.iconWrap
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <MoneyAmount
                    value={metric.value}
                    tone={metric.tone}
                    signed={metric.signed}
                    className="text-lg font-bold tracking-tight"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!accounts.length ? (
        <EmptyState
          title="Cadastre uma conta primeiro"
          description="Sem conta não dá para lançar movimentações."
          actionLabel="Nova conta"
          onAction={() => openCreate("account")}
        />
      ) : (
        <Card className="overflow-hidden border-border/70">
          <div className="flex items-center justify-center gap-4 border-b border-border/70 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => shiftMonth(-1)}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="min-w-[160px] text-center text-sm font-semibold">
              {monthLabel}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => shiftMonth(1)}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Nenhuma transação neste mês"
                description="Lance uma receita ou despesa para começar."
                actionLabel="Nova despesa"
                onAction={() => openCreate("expense")}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Situação</th>
                    <th className="px-3 py-3 font-medium">Data</th>
                    <th className="px-3 py-3 font-medium">Descrição</th>
                    <th className="px-3 py-3 font-medium">Categoria</th>
                    <th className="px-3 py-3 font-medium">Conta</th>
                    <th className="px-3 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByDate.map(([date, rows]) => {
                    const dayIncome = rows
                      .filter((tx) => tx.type === "income" && tx.is_paid)
                      .reduce((sum, tx) => sum + Number(tx.amount), 0);
                    const dayExpense = rows
                      .filter((tx) => tx.type === "expense" && tx.is_paid)
                      .reduce((sum, tx) => sum + Number(tx.amount), 0);
                    const dayNet = dayIncome - dayExpense;

                    return (
                      <DateGroup
                        key={date}
                        date={date}
                        rows={rows}
                        dayNet={dayNet}
                        pending={pending}
                        onTogglePaid={togglePaid}
                        onEdit={requestEdit}
                        onDelete={requestDelete}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Excluir transação?"
        description={
          pendingDelete
            ? `Tem certeza que deseja excluir "${
                pendingDelete.description ||
                (pendingDelete.categories as CategoryRel)?.name ||
                (pendingDelete.type === "income" ? "Receita" : "Despesa")
              }"? O saldo da conta será ajustado.`
            : ""
        }
        confirmLabel="Excluir transação"
        loading={pending}
        onConfirm={confirmDelete}
      />

      <TransactionCreateDialog
        open={Boolean(editing)}
        type={editing?.type === "income" ? "income" : "expense"}
        transaction={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}

function DateGroup({
  date,
  rows,
  dayNet,
  pending,
  onTogglePaid,
  onEdit,
  onDelete,
}: {
  date: string;
  rows: DisplayTransaction[];
  dayNet: number;
  pending: boolean;
  onTogglePaid: (tx: DisplayTransaction) => void;
  onEdit: (tx: DisplayTransaction) => void;
  onDelete: (tx: DisplayTransaction) => void;
}) {
  return (
    <>
      {rows.map((tx) => {
        const positive = tx.type === "income";
        const category = tx.categories as CategoryRel;
        const account = tx.accounts as AccountRel;
        const title =
          tx.description ||
          category?.name ||
          (positive ? "Receita" : "Despesa");

        return (
          <tr
            key={tx.id}
            className="border-b border-border/50 transition hover:bg-secondary/30"
          >
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={() => onTogglePaid(tx)}
                disabled={pending || tx.type === "transfer"}
                className="rounded-full p-0.5"
                title={tx.is_paid ? "Paga" : "Pendente"}
              >
                {tx.is_paid ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <CircleAlert className="h-5 w-5 text-destructive" />
                )}
              </button>
            </td>
            <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
              {formatDate(date, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </td>
            <td className="px-3 py-3">
              <button
                type="button"
                onClick={() => onEdit(tx)}
                className="flex min-w-0 flex-col gap-1 text-left"
              >
                <span className="truncate font-medium hover:text-primary hover:underline">
                  {title}
                </span>
                <div className="flex flex-wrap gap-1">
                  {tx.is_recurring ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {positive ? "receita fixa" : "despesa fixa"}
                    </Badge>
                  ) : null}
                  {tx.installment_count && tx.installment_current ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {tx.installment_current}/{tx.installment_count}
                    </Badge>
                  ) : null}
                </div>
              </button>
            </td>
            <td className="px-3 py-3">
              {category?.name ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color ?? "#94a3b8" }}
                  />
                  {category.name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </td>
            <td className="px-3 py-3">
              {account?.name ? (
                <span className="inline-flex items-center gap-2 text-sm">
                  <BankIcon
                    bank={account.icon}
                    bankName={account.bank_name}
                    size={20}
                    rounded="full"
                  />
                  <span className="truncate">{account.name}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </td>
            <td className="px-3 py-3 text-right">
              <MoneyAmount
                value={Number(tx.amount)}
                tone={positive ? "income" : "expense"}
                signed
                className="text-sm"
              />
            </td>
            <td className="px-4 py-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={pending}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEdit(tx)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => onDelete(tx)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        );
      })}
      <tr className="border-b border-border/70 bg-secondary/50">
        <td
          colSpan={7}
          className="px-4 py-2 text-right text-xs text-muted-foreground"
        >
          Saldo do final do dia{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(dayNet)}
          </span>
        </td>
      </tr>
    </>
  );
}
