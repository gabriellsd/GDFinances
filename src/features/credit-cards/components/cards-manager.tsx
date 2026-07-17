"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  CreditCard,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { BankIcon } from "@/components/shared/bank-icon";
import { MoneyAmount } from "@/components/shared/money-amount";
import { currencies } from "@/lib/constants";
import { ACCOUNT_COLORS } from "@/lib/labels";
import { BANK_OPTIONS, getBankBrandColor } from "@/lib/banks";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import { useUIStore } from "@/store/ui-store";
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/features/accounts/actions";
import { payCreditCardInvoice } from "@/features/transactions/actions";
import {
  formatCardNumberInput,
  type AccountInput,
} from "@/lib/validations/finance";
import type { Account, AccountWithCredit } from "@/types";
import type { TransactionWithRelations } from "@/features/transactions/actions";

type InvoiceFilter = "open" | "closed";

type CardView = {
  account: AccountWithCredit;
  limit: number;
  /** Uso do limite = o que ainda está em aberto. */
  usedLimit: number;
  /** Valor de face da fatura (todas as despesas do ciclo). */
  invoiceTotal: number;
  /** O que ainda falta pagar neste ciclo. */
  outstandingAmount: number;
  available: number;
  percent: number;
  closingDay: number;
  dueDay: number;
  dueDate: Date;
  invoiceClosed: boolean;
  status: "zerada" | "vencida" | "aberta";
  statusLabel: string;
  cycleRangeLabel: string;
  cycleStartISO: string;
  cycleEndISO: string;
};

const emptyForm: AccountInput = {
  name: "",
  bank_name: "",
  icon: null,
  type: "credit",
  color: ACCOUNT_COLORS[0],
  currency: "BRL",
  initial_balance: 0,
  is_active: true,
  card_number: "",
  credit_limit: 0,
  closing_day: 1,
  due_day: 10,
  used_amount: 0,
};

function dayOptions() {
  return Array.from({ length: 31 }, (_, index) => index + 1);
}

function lastDayOfMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function clampDay(year: number, monthIndex0: number, day: number) {
  return Math.min(day, lastDayOfMonth(year, monthIndex0));
}

function dateAtDay(year: number, monthIndex0: number, day: number) {
  return new Date(
    year,
    monthIndex0,
    clampDay(year, monthIndex0, day),
    12,
    0,
    0,
    0
  );
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Ciclos pelo dia de fechamento:
 * - Fechada: do dia após o fechamento anterior até o último fechamento
 * - Aberta: do dia após o último fechamento até o próximo fechamento
 */
function getInvoiceCycles(closingDay: number, dueDay: number, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const lastClosing =
    day >= closingDay
      ? dateAtDay(year, month, closingDay)
      : dateAtDay(year, month - 1, closingDay);

  const prevClosing = dateAtDay(
    lastClosing.getFullYear(),
    lastClosing.getMonth() - 1,
    closingDay
  );

  const closedStart = new Date(
    prevClosing.getFullYear(),
    prevClosing.getMonth(),
    prevClosing.getDate() + 1,
    12,
    0,
    0,
    0
  );
  const closedEnd = lastClosing;

  const openStart = new Date(
    lastClosing.getFullYear(),
    lastClosing.getMonth(),
    lastClosing.getDate() + 1,
    12,
    0,
    0,
    0
  );
  const nextClosing = dateAtDay(
    lastClosing.getFullYear(),
    lastClosing.getMonth() + 1,
    closingDay
  );

  function dueAfterClosing(closing: Date) {
    if (dueDay >= closingDay) {
      return dateAtDay(closing.getFullYear(), closing.getMonth(), dueDay);
    }
    return dateAtDay(closing.getFullYear(), closing.getMonth() + 1, dueDay);
  }

  return {
    closed: {
      start: closedStart,
      end: closedEnd,
      dueDate: dueAfterClosing(closedEnd),
    },
    open: {
      start: openStart,
      end: nextClosing,
      dueDate: dueAfterClosing(nextClosing),
    },
  };
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Valor de face da fatura: todas as despesas do ciclo (mesmo já pagas). */
function invoiceTotalInCycle(
  transactions: TransactionWithRelations[],
  accountId: string,
  start: Date,
  end: Date
) {
  const from = toISODate(start);
  const to = toISODate(end);
  let expenses = 0;

  for (const tx of transactions) {
    if (tx.account_id !== accountId) continue;
    if (tx.type !== "expense") continue;
    const date = tx.date.slice(0, 10);
    if (date < from || date > to) continue;
    expenses += Number(tx.amount);
  }

  return Math.max(0, expenses);
}

/** Saldo em aberto da fatura: só despesas ainda a pagar. */
function outstandingInCycle(
  transactions: TransactionWithRelations[],
  accountId: string,
  start: Date,
  end: Date
) {
  const from = toISODate(start);
  const to = toISODate(end);
  let expenses = 0;
  let payments = 0;

  for (const tx of transactions) {
    if (tx.account_id !== accountId) continue;
    const date = tx.date.slice(0, 10);
    if (date < from || date > to) continue;

    if (tx.type === "expense" && !tx.is_paid) {
      expenses += Number(tx.amount);
    }
    if (tx.type === "income" && tx.is_paid) {
      payments += Number(tx.amount);
    }
  }

  return Math.max(0, expenses - payments);
}

/** Uso do limite = o que ainda está em aberto (despesas a pagar). */
function totalUsageOnCard(
  transactions: TransactionWithRelations[],
  accountId: string
) {
  let openExpenses = 0;
  let payments = 0;
  for (const tx of transactions) {
    if (tx.account_id !== accountId) continue;
    if (tx.type === "expense" && !tx.is_paid) {
      openExpenses += Number(tx.amount);
    }
    if (tx.type === "income" && tx.is_paid) {
      payments += Number(tx.amount);
    }
  }
  return Math.max(0, openExpenses - payments);
}

function buildCardView(
  account: AccountWithCredit,
  transactions: TransactionWithRelations[],
  filter: InvoiceFilter,
  referenceDate: Date
): CardView {
  const card = account.credit_card;
  const limit = card ? Number(card.credit_limit) : 0;
  const closingDay = card?.closing_day ?? 1;
  const dueDay = card?.due_day ?? 10;
  const cycles = getInvoiceCycles(closingDay, dueDay, referenceDate);
  const cycle = filter === "closed" ? cycles.closed : cycles.open;

  const invoiceTotal = invoiceTotalInCycle(
    transactions,
    account.id,
    cycle.start,
    cycle.end
  );
  const outstandingAmount = outstandingInCycle(
    transactions,
    account.id,
    cycle.start,
    cycle.end
  );
  const usedLimit = totalUsageOnCard(transactions, account.id);
  const available = Math.max(0, limit - usedLimit);
  const percent = limit > 0 ? Math.min(100, (usedLimit / limit) * 100) : 0;
  const dueDate = cycle.dueDate;
  const today = new Date();
  const overdue =
    outstandingAmount > 0 && today.getTime() > dueDate.getTime();

  let status: CardView["status"] = "aberta";
  let statusLabel = "Fatura aberta";

  if (filter === "closed") {
    if (outstandingAmount <= 0) {
      status = "zerada";
      statusLabel = "Fatura paga";
    } else {
      // Fechada e ainda em aberto = atrasada (independente do vencimento)
      status = "vencida";
      statusLabel = "Fatura atrasada";
    }
  } else if (outstandingAmount <= 0) {
    status = "zerada";
    statusLabel = "Fatura paga";
  } else if (overdue) {
    status = "vencida";
    statusLabel = "Fatura atrasada";
  } else {
    status = "aberta";
    statusLabel = "Fatura aberta";
  }

  return {
    account,
    limit,
    usedLimit,
    invoiceTotal,
    outstandingAmount,
    available,
    percent,
    closingDay,
    dueDay,
    dueDate,
    invoiceClosed: filter === "closed",
    status,
    statusLabel,
    cycleRangeLabel: `${cycle.start.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })} – ${cycle.end.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })}`,
    cycleStartISO: toISODate(cycle.start),
    cycleEndISO: toISODate(cycle.end),
  };
}

export function CardsManager({
  cards,
  paymentAccounts = [],
  transactions = [],
}: {
  cards: AccountWithCredit[];
  /** Contas (não crédito) usadas para pagar a fatura e debitar o saldo. */
  paymentAccounts?: Account[];
  transactions?: TransactionWithRelations[];
}) {
  const router = useRouter();
  const financeMonth = useUIStore((s) => s.financeMonth);
  const [filter, setFilter] = useState<InvoiceFilter>("open");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AccountWithCredit | null>(null);
  const [form, setForm] = useState<AccountInput>(emptyForm);
  const [pending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] =
    useState<AccountWithCredit | null>(null);
  const [payTarget, setPayTarget] = useState<CardView | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState("");

  // Usa o mês do header (mesmo das Transações) como referência do ciclo da fatura
  const referenceDate = useMemo(() => {
    const lastDay = new Date(
      financeMonth.year,
      financeMonth.month + 1,
      0
    ).getDate();
    const today = new Date();
    const day =
      today.getFullYear() === financeMonth.year &&
      today.getMonth() === financeMonth.month
        ? today.getDate()
        : Math.min(15, lastDay);
    return new Date(financeMonth.year, financeMonth.month, day, 12, 0, 0, 0);
  }, [financeMonth.year, financeMonth.month]);

  const views = useMemo(
    () =>
      cards.map((account) =>
        buildCardView(account, transactions, filter, referenceDate)
      ),
    [cards, transactions, filter, referenceDate]
  );

  const filtered = views;

  const availableTotal = views.reduce((sum, view) => sum + view.available, 0);
  const invoiceTotal = views.reduce((sum, view) => sum + view.invoiceTotal, 0);
  const nextDue =
    views
      .filter((view) => view.outstandingAmount > 0)
      .map((view) => view.dueDate)
      .sort((a, b) => a.getTime() - b.getTime())[0] ??
    views.map((view) => view.dueDate).sort((a, b) => a.getTime() - b.getTime())[0];

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(account: AccountWithCredit) {
    setEditing(account);
    const card = account.credit_card;
    setForm({
      name: account.name,
      bank_name: account.bank_name ?? "",
      icon: account.icon,
      type: "credit",
      color: account.color,
      currency: account.currency,
      initial_balance: Number(account.initial_balance),
      is_active: account.is_active,
      card_number: card?.card_last_four
        ? `•••• •••• •••• ${card.card_last_four}`
        : "",
      credit_limit: card?.credit_limit ?? 0,
      closing_day: card?.closing_day ?? 1,
      due_day: card?.due_day ?? 10,
      used_amount: 0,
    });
    setOpen(true);
  }

  function selectBank(slug: string | null) {
    if (!slug) {
      setForm((current) => ({
        ...current,
        icon: null,
        bank_name: "",
      }));
      return;
    }

    const bank = BANK_OPTIONS.find((item) => item.slug === slug);
    if (!bank) return;

    setForm((current) => ({
      ...current,
      icon: bank.slug,
      bank_name: bank.name,
      color: getBankBrandColor(bank.slug) ?? bank.color,
      name: current.name.trim() ? current.name : bank.name,
    }));
  }

  function openPayInvoice(view: CardView) {
    if (paymentAccounts.length === 0) {
      toast.message("Cadastre uma conta em Contas para pagar a fatura.");
      return;
    }
    setPayTarget(view);
    setPaymentAccountId(paymentAccounts[0]?.id ?? "");
  }

  function confirmPayInvoice() {
    if (!payTarget) return;
    if (!paymentAccountId) {
      toast.error("Selecione a conta de pagamento");
      return;
    }

    const view = payTarget;
    startTransition(async () => {
      const result = await payCreditCardInvoice({
        creditAccountId: view.account.id,
        paymentAccountId,
        cycleStartISO: view.cycleStartISO,
        cycleEndISO: view.cycleEndISO,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.data
          ? `Fatura paga · ${formatCurrency(result.data.amount)}`
          : "Fatura paga"
      );
      setPayTarget(null);
      router.refresh();
    });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload: AccountInput = { ...form, type: "credit" };
    startTransition(async () => {
      const result = editing
        ? await updateAccount(editing.id, payload)
        : await createAccount(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Cartão atualizado" : "Cartão criado");
      setOpen(false);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const account = pendingDelete;
    startTransition(async () => {
      const result = await deleteAccount(account.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Cartão excluído");
      setPendingDelete(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Cartões de crédito
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full bg-secondary p-1">
            <button
              type="button"
              onClick={() => setFilter("open")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                filter === "open"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Faturas abertas
            </button>
            <button
              type="button"
              onClick={() => setFilter("closed")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                filter === "closed"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Faturas fechadas
            </button>
          </div>

          <Button
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={openCreate}
            aria-label="Novo cartão"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={openCreate}
            className="flex min-h-[320px] h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 text-center shadow-soft transition hover:border-primary/50 hover:bg-primary/5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
              <Plus className="h-7 w-7" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              Novo cartão de crédito
            </span>
          </button>

          {filtered.map((view) => {
            const { account } = view;
            const dueLabel =
              view.status === "vencida" ? "Venceu em" : "Vence em";

            return (
              <Card
                key={account.id}
                className="min-h-[320px] h-full overflow-hidden border-border/70 shadow-soft"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <BankIcon
                        bank={account.icon}
                        bankName={account.bank_name}
                        size={40}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{account.name}</p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            view.status === "vencida"
                              ? "text-orange-500"
                              : view.status === "zerada"
                                ? "text-success"
                                : "text-foreground"
                          )}
                        >
                          {view.statusLabel}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {view.cycleRangeLabel}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          disabled={pending}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(account)}>
                          <Pencil className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setPendingDelete(account)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-5 space-y-1">
                    <p className="text-xs text-muted-foreground">Valor total</p>
                    <MoneyAmount
                      value={view.invoiceTotal}
                      currency={account.currency}
                      tone="expense"
                      className="text-2xl tracking-tight"
                    />
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {dueLabel}{" "}
                    <span className="font-medium text-foreground">
                      {formatLongDate(view.dueDate)}
                    </span>
                  </p>

                  <div className="mt-5 space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          view.percent >= 90
                            ? "bg-destructive"
                            : view.percent >= 70
                              ? "bg-orange-500"
                              : "bg-primary"
                        )}
                        style={{ width: `${view.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatCurrency(view.usedLimit, account.currency)} de{" "}
                        {formatCurrency(view.limit, account.currency)}
                      </span>
                      <span className="tabular-nums font-medium text-foreground">
                        {view.percent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Limite Disponível
                    </span>
                    <MoneyAmount
                      value={view.available}
                      currency={account.currency}
                      tone="neutral"
                      className="font-semibold"
                    />
                  </div>

                  <div className="mt-auto border-t border-border/70 pt-4">
                    {view.outstandingAmount > 0 ? (
                      <button
                        type="button"
                        onClick={() => openPayInvoice(view)}
                        className="w-full text-center text-xs font-bold uppercase tracking-wide text-primary hover:underline"
                      >
                        Pagar fatura
                      </button>
                    ) : (
                      <p className="w-full text-center text-xs font-bold uppercase tracking-wide text-success">
                        Fatura paga
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <SummaryTile
            icon={CalendarDays}
            label="Sua próxima fatura vence em"
            value={nextDue ? formatLongDate(nextDue) : "—"}
          />
          <SummaryTile
            icon={Wallet}
            label="Limite Disponível"
            value={formatCurrency(availableTotal)}
          />
          <SummaryTile
            icon={CreditCard}
            label={
              filter === "closed"
                ? "Valor das faturas fechadas"
                : "Valor das faturas abertas"
            }
            value={
              <MoneyAmount
                value={invoiceTotal}
                tone="expense"
                className="text-lg"
              />
            }
          />
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar cartão" : "Novo cartão de crédito"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <div className="grid max-h-44 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-border p-2 sm:grid-cols-5">
                <button
                  type="button"
                  onClick={() => selectBank(null)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-muted-foreground transition hover:bg-accent",
                    !form.icon && "bg-accent ring-2 ring-primary"
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-xs font-medium">
                    —
                  </span>
                  Outro
                </button>
                {BANK_OPTIONS.map((bank) => (
                  <button
                    key={bank.slug}
                    type="button"
                    onClick={() => selectBank(bank.slug)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] transition hover:bg-accent",
                      form.icon === bank.slug && "bg-accent ring-2 ring-primary"
                    )}
                    title={bank.name}
                  >
                    <BankIcon bank={bank.slug} bankName={bank.name} size={36} />
                    <span className="line-clamp-1 w-full text-center">
                      {bank.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-name">Nome do cartão</Label>
              <Input
                id="card-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Nubank Crédito"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-currency">Moeda</Label>
              <Select
                id="card-currency"
                value={form.currency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currency: e.target.value as AccountInput["currency"],
                  })
                }
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-sm font-medium">Dados do cartão</p>

              <div className="space-y-2">
                <Label htmlFor="card_number">Número do cartão</Label>
                <Input
                  id="card_number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="ACCT-000003"
                  value={form.card_number ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      card_number: formatCardNumberInput(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Por segurança, salvamos apenas os 4 últimos dígitos.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_limit">Limite</Label>
                <CurrencyInput
                  id="credit_limit"
                  currency={form.currency}
                  value={form.credit_limit}
                  onValueChange={(value) =>
                    setForm({ ...form, credit_limit: value })
                  }
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="closing_day">Dia de fechamento</Label>
                  <Select
                    id="closing_day"
                    value={String(form.closing_day ?? "")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        closing_day:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value),
                      })
                    }
                    required
                  >
                    <option value="">Selecione</option>
                    {dayOptions().map((day) => (
                      <option key={day} value={day}>
                        Dia {day}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_day">Dia de vencimento</Label>
                  <Select
                    id="due_day"
                    value={String(form.due_day ?? "")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        due_day:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value),
                      })
                    }
                    required
                  >
                    <option value="">Selecione</option>
                    {dayOptions().map((day) => (
                      <option key={day} value={day}>
                        Dia {day}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor (opcional)</Label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-background ${
                      form.color === color ? "ring-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, color })}
                    aria-label={`Cor ${color}`}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(payTarget)}
        onOpenChange={(openState) => {
          if (!openState) setPayTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar fatura</DialogTitle>
          </DialogHeader>
          {payTarget ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quitar{" "}
                <span className="font-medium text-foreground">
                  {payTarget.account.name}
                </span>{" "}
                de{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(payTarget.outstandingAmount)}
                </span>
                . O valor sai do saldo da conta escolhida.
              </p>
              <div className="space-y-2">
                <Label htmlFor="payment-account">Pagar com</Label>
                <Select
                  id="payment-account"
                  value={paymentAccountId}
                  onChange={(event) => setPaymentAccountId(event.target.value)}
                >
                  {paymentAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={pending || !paymentAccountId}
              onClick={confirmPayInvoice}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirmar pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(openState) => {
          if (!openState) setPendingDelete(null);
        }}
        title="Excluir cartão?"
        description={
          pendingDelete
            ? `Tem certeza que deseja excluir "${pendingDelete.name}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir cartão"
        loading={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm font-semibold leading-snug text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}
