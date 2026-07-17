"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Banknote,
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
import { accountTypes, currencies } from "@/lib/constants";
import { accountTypeLabels, ACCOUNT_COLORS } from "@/lib/labels";
import { BANK_OPTIONS, getBankBrandColor } from "@/lib/banks";
import { cn } from "@/lib/utils";
import { expandRecurringForMonth } from "@/lib/recurring-transactions";
import { useUIStore } from "@/store/ui-store";
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/features/accounts/actions";
import type { TransactionWithRelations } from "@/features/transactions/actions";
import type { AccountInput } from "@/lib/validations/finance";
import type { AccountWithCredit } from "@/types";
import type { ReactNode } from "react";

const cashAccountTypes = accountTypes.filter((type) => type !== "credit");

const emptyForm: AccountInput = {
  name: "",
  bank_name: "",
  icon: null,
  type: "checking",
  color: ACCOUNT_COLORS[0],
  currency: "BRL",
  initial_balance: 0,
  is_active: true,
  card_number: "",
  credit_limit: null,
  closing_day: null,
  due_day: null,
  used_amount: 0,
};

export function AccountsManager({
  accounts,
  transactions = [],
}: {
  accounts: AccountWithCredit[];
  transactions?: TransactionWithRelations[];
}) {
  const router = useRouter();
  const openCreateExpense = useUIStore((s) => s.openCreate);
  const financeMonth = useUIStore((s) => s.financeMonth);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AccountWithCredit | null>(null);
  const [form, setForm] = useState<AccountInput>(emptyForm);
  const [pending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] =
    useState<AccountWithCredit | null>(null);

  const cashAccounts = useMemo(
    () => accounts.filter((account) => account.type !== "credit"),
    [accounts]
  );

  const monthTx = useMemo(
    () =>
      expandRecurringForMonth(
        transactions,
        financeMonth.year,
        financeMonth.month
      ),
    [transactions, financeMonth.year, financeMonth.month]
  );

  const accountViews = useMemo(() => {
    return cashAccounts.map((account) => {
      const current = Number(account.current_balance);
      const pendingIncome = monthTx
        .filter(
          (tx) =>
            tx.account_id === account.id &&
            tx.type === "income" &&
            !tx.is_paid
        )
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      const pendingExpense = monthTx
        .filter(
          (tx) =>
            tx.account_id === account.id &&
            tx.type === "expense" &&
            !tx.is_paid
        )
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      const projected = current + pendingIncome - pendingExpense;
      return { account, current, projected };
    });
  }, [cashAccounts, monthTx]);

  const totalCurrent = accountViews.reduce((sum, view) => sum + view.current, 0);
  const totalProjected = accountViews.reduce(
    (sum, view) => sum + view.projected,
    0
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(account: AccountWithCredit) {
    if (account.type === "credit") {
      toast.message("Cartões de crédito são gerenciados em Cartões.");
      return;
    }
    setEditing(account);
    setForm({
      name: account.name,
      bank_name: account.bank_name ?? "",
      icon: account.icon,
      type: account.type,
      color: account.color,
      currency: account.currency,
      initial_balance: Number(account.initial_balance),
      is_active: account.is_active,
      card_number: "",
      credit_limit: null,
      closing_day: null,
      due_day: null,
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

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.type === "credit") {
      toast.error("Cadastre cartões em Cartões de crédito.");
      return;
    }
    startTransition(async () => {
      const result = editing
        ? await updateAccount(editing.id, form)
        : await createAccount(form);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Conta atualizada" : "Conta criada");
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
      toast.success("Conta excluída");
      setPendingDelete(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas</h1>
        </div>
        <Button
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={openCreate}
          aria-label="Nova conta"
        >
          <Plus className="h-5 w-5" />
        </Button>
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
              Nova conta
            </span>
          </button>

          {accountViews.map(({ account, current, projected }) => (
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
                      <p className="truncate text-xs text-muted-foreground">
                        {account.bank_name || accountTypeLabels[account.type]}
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

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo atual</p>
                    <MoneyAmount
                      value={current}
                      currency={account.currency}
                      tone="auto"
                      className="text-xl tracking-tight"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Saldo previsto
                    </p>
                    <MoneyAmount
                      value={projected}
                      currency={account.currency}
                      tone="auto"
                      className="text-xl tracking-tight"
                    />
                  </div>
                </div>

                <div className="mt-auto border-t border-border/70 pt-4">
                  <button
                    type="button"
                    onClick={() => openCreateExpense("expense")}
                    className="w-full text-center text-xs font-bold uppercase tracking-wide text-primary hover:underline"
                  >
                    Adicionar despesa
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <SummaryTile
            icon={Wallet}
            label="Saldo atual"
            value={
              <MoneyAmount
                value={totalCurrent}
                tone="auto"
                className="text-lg"
              />
            }
          />
          <SummaryTile
            icon={Banknote}
            label="Saldo previsto"
            value={
              <MoneyAmount
                value={totalProjected}
                tone="auto"
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
              {editing ? "Editar conta" : "Nova conta"}
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
              <Label htmlFor="name">Nome da conta</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Nubank Roxinho"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  id="type"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as AccountInput["type"],
                    })
                  }
                >
                  {cashAccountTypes.map((type) => (
                    <option key={type} value={type}>
                      {accountTypeLabels[type]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select
                  id="currency"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial_balance">Saldo inicial</Label>
              <CurrencyInput
                id="initial_balance"
                currency={form.currency}
                value={form.initial_balance}
                onValueChange={(value) =>
                  setForm({ ...form, initial_balance: value })
                }
                placeholder="R$ 0,00"
              />
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(openState) => {
          if (!openState) setPendingDelete(null);
        }}
        title="Excluir conta?"
        description={
          pendingDelete
            ? `Tem certeza que deseja excluir "${pendingDelete.name}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir conta"
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
  icon: typeof Wallet;
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
