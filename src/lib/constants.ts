export const APP_NAME = "GDFinances";
export const APP_DESCRIPTION =
  "Gabriel Dias Finances — gestão financeira pessoal moderna, premium e inteligente.";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const currencies = ["BRL", "USD", "EUR"] as const;
export type CurrencyCode = (typeof currencies)[number];

export const accountTypes = [
  "checking",
  "savings",
  "wallet",
  "cash",
  "credit",
  "investment",
  "international",
] as const;

export const transactionTypes = [
  "income",
  "expense",
  "transfer",
] as const;

export const paymentMethods = [
  "pix",
  "debit",
  "credit",
  "cash",
  "boleto",
  "ted",
  "doc",
] as const;

/** Formas de pagamento permitidas por tipo de conta. */
export const paymentMethodsByAccountType: Record<
  (typeof accountTypes)[number],
  readonly (typeof paymentMethods)[number][]
> = {
  credit: ["credit"],
  checking: ["pix", "debit", "boleto", "ted", "doc", "cash"],
  savings: ["pix", "ted", "doc"],
  wallet: ["pix", "cash"],
  cash: ["cash"],
  investment: ["pix", "ted", "doc"],
  international: ["pix", "ted", "credit", "debit"],
};

export function getPaymentMethodsForAccountType(
  accountType: (typeof accountTypes)[number] | undefined | null
) {
  if (!accountType) return paymentMethods;
  return paymentMethodsByAccountType[accountType] ?? paymentMethods;
}

export function getDefaultPaymentMethod(
  accountType: (typeof accountTypes)[number] | undefined | null,
  preferred?: (typeof paymentMethods)[number] | null
) {
  const allowed = getPaymentMethodsForAccountType(accountType);
  if (preferred && allowed.includes(preferred)) return preferred;
  return allowed[0] ?? null;
}

export const transactionRecurrences = [
  "once",
  "fixed",
  "installment",
] as const;

export type TransactionRecurrence = (typeof transactionRecurrences)[number];
