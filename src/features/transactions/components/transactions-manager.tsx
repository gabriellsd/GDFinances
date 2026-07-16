"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, Textarea } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { paymentMethods } from "@/lib/constants";
import { paymentMethodLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  createTransaction,
  deleteTransaction,
  type TransactionWithRelations,
} from "@/features/transactions/actions";
import type { Account, Category } from "@/types";
import type { TransactionInput } from "@/lib/validations/finance";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionsManager({
  transactions,
  accounts,
  categories,
  defaultType = "expense",
}: {
  transactions: TransactionWithRelations[];
  accounts: Account[];
  categories: Category[];
  defaultType?: "income" | "expense";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<TransactionInput>({
    type: defaultType,
    amount: 0,
    account_id: accounts[0]?.id ?? "",
    category_id: null,
    date: todayISO(),
    description: "",
    notes: "",
    payment_method: "pix",
    is_paid: true,
  });

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type]
  );

  function openCreate(type: "income" | "expense" = defaultType) {
    setForm({
      type,
      amount: 0,
      account_id: accounts[0]?.id ?? "",
      category_id: null,
      date: todayISO(),
      description: "",
      notes: "",
      payment_method: type === "expense" ? "pix" : null,
      is_paid: true,
    });
    setOpen(true);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accounts.length) {
      toast.error("Cadastre uma conta antes de lançar transações.");
      return;
    }

    startTransition(async () => {
      const result = await createTransaction({
        ...form,
        category_id: form.category_id || null,
        payment_method: form.payment_method || null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        form.type === "income" ? "Receita registrada" : "Despesa registrada"
      );
      setOpen(false);
      router.refresh();
    });
  }

  function onDelete(tx: TransactionWithRelations) {
    if (!confirm("Excluir esta transação?")) return;
    startTransition(async () => {
      const result = await deleteTransaction(tx.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Transação excluída");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Transações</h1>
          <p className="mt-1 text-muted-foreground">
            Lance receitas e despesas. O saldo da conta atualiza automaticamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openCreate("income")}>
            <Plus className="h-4 w-4" />
            Receita
          </Button>
          <Button onClick={() => openCreate("expense")}>
            <Plus className="h-4 w-4" />
            Despesa
          </Button>
        </div>
      </div>

      {!accounts.length ? (
        <EmptyState
          title="Cadastre uma conta primeiro"
          description="Sem conta não dá para lançar movimentações. Crie uma em Contas."
          actionLabel="Ir para Contas"
          onAction={() => router.push("/accounts")}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Nenhuma transação"
          description="Registre seu salário, mercado, PIX… e acompanhe tudo aqui."
          actionLabel="Nova despesa"
          onAction={() => openCreate("expense")}
        />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {transactions.map((tx) => {
              const positive = tx.type === "income";
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">
                        {tx.description ||
                          tx.categories?.name ||
                          (positive ? "Receita" : "Despesa")}
                      </p>
                      <Badge variant={positive ? "success" : "secondary"}>
                        {positive ? "Receita" : "Despesa"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(tx.date)}
                      {tx.accounts?.name ? ` · ${tx.accounts.name}` : ""}
                      {tx.categories?.name ? ` · ${tx.categories.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={
                        positive
                          ? "font-semibold text-success"
                          : "font-semibold text-destructive"
                      }
                    >
                      {positive ? "+" : "-"}
                      {formatCurrency(Number(tx.amount))}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(tx)}
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.type === "income" ? "Nova receita" : "Nova despesa"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  id="type"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as "income" | "expense",
                      category_id: null,
                    })
                  }
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount || ""}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_id">Conta</Label>
              <Select
                id="account_id"
                value={form.account_id}
                onChange={(e) =>
                  setForm({ ...form, account_id: e.target.value })
                }
                required
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria</Label>
              <Select
                id="category_id"
                value={form.category_id ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category_id: e.target.value || null,
                  })
                }
              >
                <option value="">Sem categoria</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma de pagamento</Label>
                <Select
                  id="payment_method"
                  value={form.payment_method ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_method:
                        (e.target.value as TransactionInput["payment_method"]) ||
                        null,
                    })
                  }
                >
                  <option value="">—</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Ex.: Mercado do mês"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observação</Label>
              <Textarea
                id="notes"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Opcional"
              />
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
