"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { BankIcon } from "@/components/shared/bank-icon";
import { accountTypes, currencies } from "@/lib/constants";
import { accountTypeLabels, ACCOUNT_COLORS } from "@/lib/labels";
import { BANK_OPTIONS, getBankBrandColor } from "@/lib/banks";
import { cn } from "@/lib/utils";
import { createAccount } from "@/features/accounts/actions";
import type { AccountInput } from "@/lib/validations/finance";

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

export function AccountCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<AccountInput>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open]);

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
      const result = await createAccount(form);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Conta criada");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova conta</DialogTitle>
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
            <Label htmlFor="g-acc-name">Nome da conta</Label>
            <Input
              id="g-acc-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Nubank Roxinho"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="g-acc-type">Tipo</Label>
              <Select
                id="g-acc-type"
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
              <Label htmlFor="g-acc-currency">Moeda</Label>
              <Select
                id="g-acc-currency"
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
            <Label htmlFor="g-balance">Saldo inicial</Label>
            <CurrencyInput
              id="g-balance"
              currency={form.currency}
              value={form.initial_balance}
              onValueChange={(value) =>
                setForm({ ...form, initial_balance: value })
              }
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
              onClick={() => onOpenChange(false)}
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
  );
}
