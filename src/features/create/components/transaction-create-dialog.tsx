"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bookmark,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Info,
  Landmark,
  Loader2,
  Paperclip,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, Textarea } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BankIcon } from "@/components/shared/bank-icon";
import {
  getDefaultPaymentMethod,
  getPaymentMethodsForAccountType,
} from "@/lib/constants";
import { parseCurrencyDigits } from "@/components/ui/currency-input";
import {
  ACCOUNT_COLORS,
  getUnusedColor,
  paymentMethodLabels,
  transactionRecurrenceLabels,
} from "@/lib/labels";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  createTransaction,
  updateTransaction,
} from "@/features/transactions/actions";
import { listAccounts } from "@/features/accounts/actions";
import {
  createCategory,
  listCategories,
} from "@/features/categories/actions";
import { MiniMonthCalendar } from "@/features/create/components/mini-month-calendar";
import { cn } from "@/lib/utils";
import type { Account, Category, Transaction } from "@/types";
import type { TransactionInput } from "@/lib/validations/finance";

export type EditableTransaction = Pick<
  Transaction,
  | "id"
  | "type"
  | "amount"
  | "account_id"
  | "category_id"
  | "date"
  | "description"
  | "notes"
  | "payment_method"
  | "is_paid"
  | "is_recurring"
  | "installment_count"
  | "installment_current"
>;

function todayISO() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function shiftISO(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formFromTransaction(tx: EditableTransaction): TransactionInput {
  return {
    type: tx.type as "income" | "expense",
    amount: Number(tx.amount),
    account_id: tx.account_id,
    category_id: tx.category_id,
    date: tx.date.slice(0, 10),
    description: tx.description ?? "",
    notes: tx.notes ?? "",
    payment_method: tx.payment_method,
    is_paid: tx.is_paid,
    recurrence: tx.is_recurring ? "fixed" : "once",
    installment_count: tx.installment_count ?? 1,
    installment_current: tx.installment_current ?? 1,
  };
}

function defaultForm(
  type: "income" | "expense",
  account: Account | undefined
): TransactionInput {
  const isCreditAccount = account?.type === "credit";
  return {
    type,
    amount: 0,
    account_id: account?.id ?? "",
    category_id: null,
    date: todayISO(),
    description: "",
    notes: "",
    payment_method: getDefaultPaymentMethod(
      account?.type,
      isCreditAccount ? "credit" : type === "expense" ? "pix" : null
    ),
    is_paid: isCreditAccount && type === "expense" ? false : true,
    recurrence: "once",
    installment_count: isCreditAccount ? 1 : 2,
    installment_current: 1,
  };
}

type DatePreset = "today" | "yesterday" | "dayBefore" | "other";

function resolveDatePreset(iso: string): DatePreset {
  if (iso === todayISO()) return "today";
  if (iso === shiftISO(-1)) return "yesterday";
  if (iso === shiftISO(-2)) return "dayBefore";
  return "other";
}

function firstFreeCategoryColor(existing: Category[]) {
  return getUnusedColor(existing.map((category) => category.color));
}

export function TransactionCreateDialog({
  open,
  type,
  onOpenChange,
  transaction = null,
}: {
  open: boolean;
  type: "income" | "expense";
  onOpenChange: (open: boolean) => void;
  /** Quando informado, o modal entra em modo edição. */
  transaction?: EditableTransaction | null;
}) {
  const router = useRouter();
  const amountRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<TransactionInput>(() =>
    defaultForm(type, undefined)
  );
  const [amountDigits, setAmountDigits] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [showDetails, setShowDetails] = useState(false);
  const [showAmountError, setShowAmountError] = useState(false);
  const [keepOpenAfterSave, setKeepOpenAfterSave] = useState(false);
  const [quickCategoryOpen, setQuickCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState<string>(
    ACCOUNT_COLORS[4]
  );
  const [creatingCategory, setCreatingCategory] = useState(false);

  const isEditing = Boolean(transaction);
  const accent =
    type === "expense"
      ? {
          text: "text-destructive",
          bg: "bg-destructive",
          soft: "bg-destructive/10",
          border: "border-destructive",
          ring: "ring-destructive",
          switch:
            "data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input",
        }
      : {
          text: "text-success",
          bg: "bg-success",
          soft: "bg-success/10",
          border: "border-success",
          ring: "ring-success",
          switch:
            "data-[state=checked]:bg-success data-[state=unchecked]:bg-input",
        };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setShowDetails(isEditing);
    setShowAmountError(false);
    setAmountDigits("");
    setKeepOpenAfterSave(false);
    setQuickCategoryOpen(false);
    setNewCategoryName("");

    void Promise.all([listAccounts(), listCategories()]).then(
      ([nextAccounts, nextCategories]) => {
        if (cancelled) return;
        setAccounts(nextAccounts);
        setCategories(nextCategories);
        if (transaction) {
          const nextForm = formFromTransaction(transaction);
          setForm(nextForm);
          setDatePreset(resolveDatePreset(nextForm.date));
        } else {
          setForm(defaultForm(type, nextAccounts[0]));
          setDatePreset("today");
        }
        setNewCategoryColor(firstFreeCategoryColor(nextCategories));
        setLoading(false);
        requestAnimationFrame(() => amountRef.current?.focus());
      }
    );

    return () => {
      cancelled = true;
    };
  }, [open, type, transaction?.id, isEditing]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === form.account_id),
    [accounts, form.account_id]
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.category_id),
    [categories, form.category_id]
  );
  const isCreditFlow = selectedAccount?.type === "credit";
  const availablePaymentMethods = useMemo(
    () => getPaymentMethodsForAccountType(selectedAccount?.type),
    [selectedAccount?.type]
  );
  const creditInstallmentCount = Number(form.installment_count) || 1;
  const willSplitInstallments =
    !isEditing &&
    ((isCreditFlow && creditInstallmentCount >= 2) ||
      form.recurrence === "installment");

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type]
  );

  const usedCategoryColors = useMemo(() => {
    const used = new Set(
      categories.map((category) => category.color.toLowerCase())
    );
    return used;
  }, [categories]);

  const availableCategoryColors = useMemo(() => {
    const freeFromPalette = ACCOUNT_COLORS.filter(
      (color) => !usedCategoryColors.has(color.toLowerCase())
    );
    // Se a cor atual foi gerada fora da paleta e ainda está livre, inclui
    if (
      newCategoryColor &&
      !usedCategoryColors.has(newCategoryColor.toLowerCase()) &&
      !freeFromPalette.some(
        (color) => color.toLowerCase() === newCategoryColor.toLowerCase()
      )
    ) {
      return [newCategoryColor, ...freeFromPalette];
    }
    return [...freeFromPalette];
  }, [usedCategoryColors, newCategoryColor]);

  const installmentPreview = useMemo(() => {
    if (!willSplitInstallments) return null;
    const count =
      form.recurrence === "installment" && !isCreditFlow
        ? Number(form.installment_count) || 0
        : creditInstallmentCount;
    if (count < 2 || !form.amount) return null;
    return {
      count,
      parcel: form.amount / count,
      total: form.amount,
    };
  }, [
    willSplitInstallments,
    form.recurrence,
    form.installment_count,
    form.amount,
    isCreditFlow,
    creditInstallmentCount,
  ]);

  const canSave = form.amount > 0 && Boolean(form.account_id) && !pending;

  function setDateFromPreset(preset: Exclude<DatePreset, "other">) {
    setDatePreset(preset);
    if (preset === "today")
      setForm((current) => ({ ...current, date: todayISO() }));
    if (preset === "yesterday")
      setForm((current) => ({ ...current, date: shiftISO(-1) }));
    if (preset === "dayBefore")
      setForm((current) => ({ ...current, date: shiftISO(-2) }));
  }

  function pickFreeCategoryColor() {
    return firstFreeCategoryColor(categories);
  }

  function resetForNew() {
    setForm(defaultForm(type, accounts[0]));
    setAmountDigits("");
    setDatePreset("today");
    setShowDetails(false);
    setShowAmountError(false);
    setQuickCategoryOpen(false);
    setNewCategoryName("");
    setNewCategoryColor(pickFreeCategoryColor());
    requestAnimationFrame(() => amountRef.current?.focus());
  }

  async function saveQuickCategory() {
    const name = newCategoryName.trim();
    if (name.length < 2) {
      toast.error("Informe o nome da categoria");
      return;
    }

    if (usedCategoryColors.has(newCategoryColor.toLowerCase())) {
      toast.error("Escolha uma cor que ainda não esteja em uso");
      return;
    }

    setCreatingCategory(true);
    try {
      const result = await createCategory({
        name,
        type: form.type,
        color: newCategoryColor,
        monthly_limit: null,
        icon: null,
      });

      if (result.error || !result.data) {
        toast.error(result.error ?? "Erro ao criar categoria");
        return;
      }

      setCategories((current) =>
        [...current, result.data!].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR")
        )
      );
      setForm((current) => ({
        ...current,
        category_id: result.data!.id,
      }));
      setQuickCategoryOpen(false);
      setNewCategoryName("");
      setNewCategoryColor(pickFreeCategoryColor());
      toast.success("Categoria criada");
      router.refresh();
    } finally {
      setCreatingCategory(false);
    }
  }

  function submit(createAnother: boolean) {
    if (!accounts.length) {
      toast.error("Cadastre uma conta antes de lançar transações.");
      return;
    }
    if (form.amount <= 0) {
      setShowAmountError(true);
      amountRef.current?.focus();
      return;
    }

    setKeepOpenAfterSave(createAnother);
    startTransition(async () => {
      if (transaction) {
        const result = await updateTransaction(transaction.id, {
          ...form,
          type,
          category_id: form.category_id || null,
          payment_method: form.payment_method || null,
          recurrence: form.recurrence === "installment" ? "once" : form.recurrence,
          installment_count: null,
          installment_current: null,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success(
          type === "income" ? "Receita atualizada" : "Despesa atualizada"
        );
        router.refresh();
        onOpenChange(false);
        return;
      }

      const splitByCredit = isCreditFlow && creditInstallmentCount >= 2;
      const splitByNature = form.recurrence === "installment";
      const shouldSplit = splitByCredit || splitByNature;
      const installmentCount = shouldSplit
        ? splitByCredit
          ? creditInstallmentCount
          : Number(form.installment_count)
        : null;

      const result = await createTransaction({
        ...form,
        type,
        category_id: form.category_id || null,
        payment_method: form.payment_method || null,
        recurrence: shouldSplit ? "installment" : form.recurrence,
        installment_count: installmentCount,
        installment_current: shouldSplit ? 1 : null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (shouldSplit) {
        toast.success(`${installmentCount} parcelas criadas`);
      } else {
        toast.success(
          type === "income" ? "Receita registrada" : "Despesa registrada"
        );
      }

      router.refresh();

      if (createAnother) {
        resetForNew();
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle className="text-xl font-bold">
            {isEditing
              ? type === "income"
                ? "Editar Receita"
                : "Editar Despesa"
              : type === "income"
                ? "Nova Receita"
                : "Nova Despesa"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="px-5 pb-5 pt-2">
            {/* Valor */}
            <div
              className={cn(
                "border-b pb-3",
                showAmountError ? accent.border : "border-border/70"
              )}
            >
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  ref={amountRef}
                  inputMode="numeric"
                  className={cn(
                    "min-w-0 flex-1 bg-transparent text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50",
                    accent.text
                  )}
                  placeholder="R$ 0,00"
                  value={
                    amountDigits
                      ? formatCurrency(parseCurrencyDigits(amountDigits))
                      : form.amount
                        ? formatCurrency(form.amount)
                        : ""
                  }
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                    setAmountDigits(digits);
                    const amount = parseCurrencyDigits(digits);
                    setForm((current) => ({ ...current, amount }));
                    if (amount > 0) setShowAmountError(false);
                  }}
                  onBlur={() => {
                    if (form.amount <= 0) setShowAmountError(true);
                  }}
                />
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  BRL
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </div>
              {showAmountError ? (
                <p className={cn("mt-1.5 pl-8 text-xs", accent.text)}>
                  Deve ter um valor diferente de 0
                </p>
              ) : null}
            </div>

            {/* Foi paga */}
            <div className="flex items-center justify-between border-b border-border/70 py-3.5">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {type === "income"
                    ? form.is_paid
                      ? "Foi recebida"
                      : "A receber"
                    : isCreditFlow
                      ? form.is_paid
                        ? "Quitada na fatura"
                        : "Na fatura (a pagar)"
                      : form.is_paid
                        ? "Foi paga"
                        : "A pagar"}
                </span>
              </div>
              <Switch
                checked={form.is_paid}
                onCheckedChange={(is_paid) =>
                  setForm((current) => ({ ...current, is_paid }))
                }
                className={accent.switch}
              />
            </div>

            {/* Data */}
            <div className="border-b border-border/70">
              <div className="flex items-center gap-3 py-3.5">
                <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex flex-1 flex-wrap gap-2">
                  {(
                    [
                      ["today", "Hoje"],
                      ["yesterday", "Ontem"],
                      ["dayBefore", "Anteontem"],
                      ["other", "Outros"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        if (value === "other") {
                          setDatePreset("other");
                          return;
                        }
                        setDateFromPreset(value);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-medium transition",
                        datePreset === value
                          ? cn(accent.bg, "text-white")
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {datePreset === "other" ? (
                <div className="space-y-3 pb-4 pl-8 pr-1">
                  <p className="text-sm font-medium capitalize text-foreground">
                    {formatDate(form.date, {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <MiniMonthCalendar
                    value={form.date}
                    accentClassName={cn(accent.bg, "text-white")}
                    onChange={(iso) => {
                      setForm((current) => ({ ...current, date: iso }));
                      setDatePreset(resolveDatePreset(iso));
                    }}
                  />
                </div>
              ) : null}
            </div>

            {/* Descrição */}
            <div className="flex items-center gap-3 border-b border-border/70 py-3.5">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Descrição"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Categoria */}
            <div className="border-b border-border/70">
              <div className="flex items-center gap-3 py-3.5">
                <Bookmark className="h-5 w-5 shrink-0 text-muted-foreground" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left outline-none"
                    >
                      {selectedCategory ? (
                        <span className="inline-flex max-w-[85%] items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm font-medium text-foreground">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: selectedCategory.color }}
                          />
                          <span className="truncate">
                            {selectedCategory.name}
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Categoria
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[240px] overflow-y-auto"
                  >
                    <DropdownMenuItem
                      onSelect={() =>
                        setForm((current) => ({
                          ...current,
                          category_id: null,
                        }))
                      }
                      className={cn(!form.category_id && "bg-accent")}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                      Sem categoria
                      {!form.category_id ? (
                        <Check className="ml-auto h-4 w-4 text-primary" />
                      ) : null}
                    </DropdownMenuItem>
                    {filteredCategories.map((category) => (
                      <DropdownMenuItem
                        key={category.id}
                        onSelect={() =>
                          setForm((current) => ({
                            ...current,
                            category_id: category.id,
                          }))
                        }
                        className={cn(
                          form.category_id === category.id && "bg-accent"
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="truncate">{category.name}</span>
                        {form.category_id === category.id ? (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => {
                        setQuickCategoryOpen(true);
                        setNewCategoryName("");
                        setNewCategoryColor(pickFreeCategoryColor());
                      }}
                      className="text-primary focus:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      Nova categoria
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {quickCategoryOpen ? (
                <div className="mb-3 space-y-3 rounded-xl border border-border bg-secondary/40 p-3 pl-8">
                  <div className="space-y-1.5">
                    <Label htmlFor="quick-category-name" className="text-xs">
                      Nome da categoria
                    </Label>
                    <Input
                      id="quick-category-name"
                      autoFocus
                      placeholder={
                        form.type === "income"
                          ? "Ex.: Freelance"
                          : "Ex.: Delivery"
                      }
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void saveQuickCategory();
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cor</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {availableCategoryColors.slice(0, 24).map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "h-7 w-7 rounded-full ring-offset-2 ring-offset-background",
                            newCategoryColor.toLowerCase() ===
                              color.toLowerCase() && "ring-2 ring-primary"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewCategoryColor(color)}
                          aria-label={`Cor ${color}`}
                        />
                      ))}
                      <label
                        className="relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-card"
                        title="Cor personalizada"
                      >
                        <span className="text-[10px] font-medium text-muted-foreground">
                          +
                        </span>
                        <input
                          type="color"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          value={
                            /^#[0-9A-Fa-f]{6}$/.test(newCategoryColor)
                              ? newCategoryColor
                              : "#7C3AED"
                          }
                          onChange={(e) => {
                            const color = e.target.value.toUpperCase();
                            if (usedCategoryColors.has(color.toLowerCase())) {
                              toast.error("Essa cor já está em uso");
                              return;
                            }
                            setNewCategoryColor(color);
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Cores já usadas ficam ocultas. Use + para uma cor
                      personalizada.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuickCategoryOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={creatingCategory}
                      onClick={() => void saveQuickCategory()}
                    >
                      {creatingCategory ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Criar
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Conta */}
            <div className="flex items-center gap-3 border-b border-border/70 py-3.5">
              <Landmark className="h-5 w-5 shrink-0 text-muted-foreground" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left outline-none"
                  >
                    {selectedAccount ? (
                      <span className="inline-flex max-w-[85%] items-center gap-2 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-sm font-medium">
                        <BankIcon
                          bank={selectedAccount.icon}
                          bankName={selectedAccount.bank_name}
                          size={20}
                          rounded="full"
                        />
                        <span className="truncate">{selectedAccount.name}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Conta</span>
                    )}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[240px] overflow-y-auto"
                >
                  {accounts.length === 0 ? (
                    <DropdownMenuItem disabled>
                      Nenhuma conta cadastrada
                    </DropdownMenuItem>
                  ) : (
                    accounts.map((account) => (
                      <DropdownMenuItem
                        key={account.id}
                        onSelect={() => {
                          const isCredit = account.type === "credit";
                          setForm((current) => ({
                            ...current,
                            account_id: account.id,
                            // No crédito, "a pagar" = na fatura; "paga" = quitada.
                            is_paid: isCredit ? false : current.is_paid,
                            payment_method: getDefaultPaymentMethod(
                              account.type,
                              current.payment_method
                            ),
                            installment_count: isCredit
                              ? current.installment_count || 1
                              : current.recurrence === "installment"
                                ? current.installment_count || 2
                                : current.installment_count,
                            recurrence:
                              isCredit && current.recurrence === "installment"
                                ? "once"
                                : current.recurrence,
                          }));
                        }}
                        className={cn(
                          form.account_id === account.id && "bg-accent"
                        )}
                      >
                        <BankIcon
                          bank={account.icon}
                          bankName={account.bank_name}
                          size={22}
                          rounded="full"
                        />
                        <span className="truncate">{account.name}</span>
                        {form.account_id === account.id ? (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        ) : null}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Anexar (visual) */}
            <button
              type="button"
              className="flex w-full items-center gap-3 border-b border-border/70 py-3.5 text-left text-sm text-muted-foreground"
              onClick={() => toast.message("Anexos em breve")}
            >
              <Paperclip className="h-5 w-5" />
              Anexar Arquivo
            </button>

            {/* Ignorar (visual / notes hint) */}
            <div className="flex items-center justify-between border-b border-border/70 py-3.5">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Ignorar transação
                </span>
              </div>
              <Switch
                checked={false}
                onCheckedChange={() =>
                  toast.message("Em breve: ignorar em relatórios")
                }
              />
            </div>

            {/* Mais detalhes */}
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              className="mt-3 flex w-full items-center justify-end gap-1 text-sm font-medium text-primary"
            >
              Mais detalhes
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition",
                  showDetails && "rotate-90"
                )}
              />
            </button>

            {showDetails ? (
              <div className="mt-3 space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
                <div className="space-y-2">
                  <Label>Natureza</Label>
                  <Select
                    value={
                      isCreditFlow && form.recurrence === "installment"
                        ? "once"
                        : (form.recurrence ?? "once")
                    }
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        recurrence: e.target
                          .value as TransactionInput["recurrence"],
                        installment_count:
                          e.target.value === "installment"
                            ? current.installment_count || 2
                            : isCreditFlow
                              ? current.installment_count || 1
                              : null,
                      }))
                    }
                  >
                    <option value="once">
                      {transactionRecurrenceLabels.once}
                    </option>
                    <option value="fixed">
                      {transactionRecurrenceLabels.fixed}
                    </option>
                    {!isEditing && !isCreditFlow ? (
                      <option value="installment">
                        {transactionRecurrenceLabels.installment}
                      </option>
                    ) : null}
                  </Select>
                </div>

                {!isEditing &&
                !isCreditFlow &&
                form.recurrence === "installment" ? (
                  <div className="space-y-2">
                    <Label>Parcelas</Label>
                    <Select
                      value={String(form.installment_count ?? 2)}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          installment_count: Number(e.target.value),
                        }))
                      }
                    >
                      {Array.from({ length: 47 }, (_, i) => i + 2).map((n) => (
                        <option key={n} value={n}>
                          {n}x
                        </option>
                      ))}
                    </Select>
                    {installmentPreview ? (
                      <p className="text-xs text-muted-foreground">
                        {installmentPreview.count}x de{" "}
                        {formatCurrency(installmentPreview.parcel)} · total{" "}
                        {formatCurrency(installmentPreview.total)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {!isEditing && isCreditFlow ? (
                  <div className="space-y-2">
                    <Label>Parcelas no crédito</Label>
                    <Select
                      value={String(form.installment_count ?? 1)}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          installment_count: Number(e.target.value),
                          payment_method: "credit",
                        }))
                      }
                    >
                      {Array.from({ length: 48 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? "1x (à vista)" : `${n}x`}
                        </option>
                      ))}
                    </Select>
                    {installmentPreview ? (
                      <p className="text-xs text-muted-foreground">
                        {installmentPreview.count}x de{" "}
                        {formatCurrency(installmentPreview.parcel)} · total{" "}
                        {formatCurrency(installmentPreview.total)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={
                      form.payment_method &&
                      availablePaymentMethods.includes(form.payment_method)
                        ? form.payment_method
                        : (availablePaymentMethods[0] ?? "")
                    }
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        payment_method:
                          (e.target
                            .value as TransactionInput["payment_method"]) ||
                          null,
                      }))
                    }
                  >
                    {availablePaymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {paymentMethodLabels[method]}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea
                    value={form.notes ?? ""}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-4">
              {!isEditing ? (
                <button
                  type="button"
                  disabled={!canSave && !keepOpenAfterSave}
                  onClick={() => submit(true)}
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground disabled:opacity-40"
                >
                  Salvar e criar nova
                </button>
              ) : null}
              <Button
                type="button"
                disabled={!canSave}
                onClick={() => submit(false)}
                className={cn(
                  "min-w-[110px] rounded-full uppercase tracking-wide",
                  type === "expense"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-success text-success-foreground hover:bg-success/90"
                )}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
