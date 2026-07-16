"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { BankIcon } from "@/components/shared/bank-icon";
import { accountTypes, currencies } from "@/lib/constants";
import { accountTypeLabels, ACCOUNT_COLORS } from "@/lib/labels";
import { BANK_OPTIONS, getBankBrandColor } from "@/lib/banks";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/features/accounts/actions";
import type { Account } from "@/types";
import type { AccountInput } from "@/lib/validations/finance";

const emptyForm: AccountInput = {
  name: "",
  bank_name: "",
  icon: null,
  type: "checking",
  color: ACCOUNT_COLORS[0],
  currency: "BRL",
  initial_balance: 0,
  is_active: true,
};

export function AccountsManager({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountInput>(emptyForm);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(account: Account) {
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

  function onDelete(account: Account) {
    if (!confirm(`Excluir a conta "${account.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteAccount(account.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Conta excluída");
      router.refresh();
    });
  }

  const total = accounts.reduce(
    (sum, account) => sum + Number(account.current_balance),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Contas</h1>
          <p className="mt-1 text-muted-foreground">
            Saldo total:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(total)}
            </span>
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova conta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="Nenhuma conta ainda"
          description="Cadastre sua primeira conta (Nubank, Inter, Itaú…) com o ícone oficial do banco."
          actionLabel="Criar conta"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BankIcon
                      bank={account.icon}
                      bankName={account.bank_name}
                      size={40}
                    />
                    <div>
                      <p className="font-semibold">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.bank_name || accountTypeLabels[account.type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={account.is_active ? "success" : "secondary"}>
                      {account.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    {account.type === "credit" ? (
                      <Badge variant="warning">Crédito</Badge>
                    ) : null}
                  </div>
                </div>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatCurrency(
                    Number(account.current_balance),
                    account.currency
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {accountTypeLabels[account.type]} · {account.currency}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(account)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(account)}
                    disabled={pending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                placeholder="Ex.: Nubank principal"
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
                  {accountTypes.map((type) => (
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
              <Label htmlFor="initial_balance">
                {form.type === "credit"
                  ? "Limite / saldo inicial (negativo = dívida)"
                  : "Saldo inicial"}
              </Label>
              <Input
                id="initial_balance"
                type="number"
                step="0.01"
                value={form.initial_balance}
                onChange={(e) =>
                  setForm({
                    ...form,
                    initial_balance: Number(e.target.value),
                  })
                }
              />
              {form.type === "credit" ? (
                <p className="text-xs text-muted-foreground">
                  Ex.: saldo da fatura em aberto como valor negativo (−500), ou
                  0 se estiver zerada.
                </p>
              ) : null}
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
    </div>
  );
}
