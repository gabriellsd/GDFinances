import { type CurrencyCode } from "@/lib/constants";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: CurrencyCode, locale = "pt-BR") {
  const key = `${locale}:${currency}`;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(
      key,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      })
    );
  }
  return currencyFormatters.get(key)!;
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode = "BRL",
  locale = "pt-BR"
) {
  return getCurrencyFormatter(currency, locale).format(value);
}

export function formatPercent(value: number, locale = "pt-BR") {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
  locale = "pt-BR"
) {
  return new Intl.DateTimeFormat(locale, options).format(
    typeof value === "string" ? new Date(value) : value
  );
}
