import { z } from "zod";
import {
  accountTypes,
  currencies,
  paymentMethods,
} from "@/lib/constants";

export const accountSchema = z
  .object({
    name: z.string().min(2, "Informe o nome da conta"),
    bank_name: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    type: z.enum(accountTypes),
    color: z.string().min(4),
    currency: z.enum(currencies),
    initial_balance: z.coerce.number().default(0),
    is_active: z.boolean().default(true),
    card_number: z.string().optional().nullable(),
    credit_limit: z.coerce.number().optional().nullable(),
    closing_day: z.coerce.number().int().min(1).max(31).optional().nullable(),
    due_day: z.coerce.number().int().min(1).max(31).optional().nullable(),
    used_amount: z.coerce.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "credit") return;

    if (data.credit_limit == null || Number.isNaN(Number(data.credit_limit))) {
      ctx.addIssue({
        code: "custom",
        path: ["credit_limit"],
        message: "Informe o limite do cartão",
      });
    } else if (Number(data.credit_limit) < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["credit_limit"],
        message: "Limite não pode ser negativo",
      });
    }

    if (data.closing_day == null || Number.isNaN(Number(data.closing_day))) {
      ctx.addIssue({
        code: "custom",
        path: ["closing_day"],
        message: "Informe o dia de fechamento",
      });
    }

    if (data.due_day == null || Number.isNaN(Number(data.due_day))) {
      ctx.addIssue({
        code: "custom",
        path: ["due_day"],
        message: "Informe o dia de vencimento",
      });
    }

    const digits = (data.card_number ?? "").replace(/\D/g, "");
    if (digits.length > 0 && digits.length < 4) {
      ctx.addIssue({
        code: "custom",
        path: ["card_number"],
        message: "Informe ao menos os 4 últimos dígitos",
      });
    }
  });

export const categorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria"),
  type: z.enum(["income", "expense"]),
  color: z.string().min(4),
  monthly_limit: z.coerce.number().nullable().optional(),
  icon: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    amount: z.coerce.number().positive("Informe um valor maior que zero"),
    account_id: z.string().uuid("Selecione uma conta"),
    category_id: z.string().uuid().nullable().optional(),
    date: z.string().min(1, "Informe a data"),
    description: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    payment_method: z.enum(paymentMethods).nullable().optional(),
    is_paid: z.boolean().default(true),
    recurrence: z.enum(["once", "fixed", "installment"]).default("once"),
    installment_count: z.coerce.number().int().min(2).max(48).optional().nullable(),
    installment_current: z.coerce.number().int().min(1).max(48).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.recurrence === "installment") {
      if (!data.installment_count || data.installment_count < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["installment_count"],
          message: "Informe a quantidade de parcelas (mín. 2)",
        });
      }
    }
  });

export type AccountInput = z.infer<typeof accountSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;

export function extractCardLastFour(cardNumber?: string | null) {
  const digits = (cardNumber ?? "").replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

export function formatCardNumberInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
