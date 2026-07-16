import type { AccountType, PaymentMethod } from "@/types";

export const accountTypeLabels: Record<AccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  wallet: "Carteira",
  cash: "Dinheiro",
  credit: "Cartão / crédito",
  investment: "Investimento",
  international: "Conta internacional",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: "PIX",
  debit: "Débito",
  credit: "Crédito",
  cash: "Dinheiro",
  boleto: "Boleto",
  ted: "TED",
  doc: "DOC",
};

export const categoryTypeLabels = {
  income: "Receita",
  expense: "Despesa",
} as const;

export const ACCOUNT_COLORS = [
  "#4F46E5",
  "#7C6CFF",
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#06B6D4",
  "#EC4899",
  "#8B5CF6",
] as const;
