import {
  accountTypes,
  paymentMethods,
  transactionTypes,
  type CurrencyCode,
} from "@/lib/constants";

export type AccountType = (typeof accountTypes)[number];
export type TransactionType = (typeof transactionTypes)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type { CurrencyCode };

export type Plan = "free" | "premium";
export type Role = "user" | "admin";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  role: Role;
  locale: string;
  currency: CurrencyCode;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  bank_name: string | null;
  type: AccountType;
  color: string;
  icon: string | null;
  currency: CurrencyCode;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string;
  monthly_limit: number | null;
  parent_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  notes: string | null;
  date: string;
  payment_method: PaymentMethod | null;
  is_paid: boolean;
  is_recurring: boolean;
  installment_count: number | null;
  installment_current: number | null;
  credit_card_id: string | null;
  transfer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  account_id: string | null;
  name: string;
  bank_name: string | null;
  brand: string | null;
  color: string;
  credit_limit: number;
  available_limit: number;
  closing_day: number;
  due_day: number;
  best_day: number | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string | null;
  color: string;
  created_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  amount: number;
  profitability: number | null;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  user_id: string;
  widget_key: string;
  position: number;
  visible: boolean;
  config: Record<string, unknown>;
}

export interface AiInsight {
  id: string;
  title: string;
  message: string;
  tone: "info" | "success" | "warning" | "danger";
}
