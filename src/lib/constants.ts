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
