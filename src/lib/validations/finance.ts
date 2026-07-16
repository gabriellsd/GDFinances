import { z } from "zod";
import {
  accountTypes,
  currencies,
  paymentMethods,
} from "@/lib/constants";

export const accountSchema = z.object({
  name: z.string().min(2, "Informe o nome da conta"),
  bank_name: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  type: z.enum(accountTypes),
  color: z.string().min(4),
  currency: z.enum(currencies),
  initial_balance: z.coerce.number(),
  is_active: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria"),
  type: z.enum(["income", "expense"]),
  color: z.string().min(4),
  monthly_limit: z.coerce.number().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
  account_id: z.string().uuid("Selecione uma conta"),
  category_id: z.string().uuid().nullable().optional(),
  date: z.string().min(1, "Informe a data"),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  payment_method: z.enum(paymentMethods).nullable().optional(),
  is_paid: z.boolean().default(true),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
