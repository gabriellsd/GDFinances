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

export const accountTypeBadgeLabels: Record<AccountType, string> = {
  checking: "Corrente",
  savings: "Poupança",
  wallet: "Carteira",
  cash: "Dinheiro",
  credit: "Crédito",
  investment: "Investimento",
  international: "Internacional",
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

export const transactionRecurrenceLabels = {
  once: "Avulsa",
  fixed: "Fixa / recorrente",
  installment: "Parcelada",
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
  "#0EA5E9",
  "#14B8A6",
  "#84CC16",
  "#EAB308",
  "#F97316",
  "#F43F5E",
  "#D946EF",
  "#A855F7",
  "#6366F1",
  "#3B82F6",
  "#10B981",
  "#64748B",
  "#78716C",
  "#0F766E",
  "#B45309",
  "#BE123C",
  "#7E22CE",
  "#1D4ED8",
  "#15803D",
  "#CA8A04",
  "#C2410C",
  "#9F1239",
  "#6D28D9",
  "#0369A1",
] as const;

function hslToHex(h: number, s: number, l: number) {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/** Primeira cor livre da paleta; se esgotar, gera tons novos. */
export function getUnusedColor(usedColors: Array<string | null | undefined>) {
  const used = new Set(
    usedColors
      .filter(Boolean)
      .map((color) => String(color).toLowerCase())
  );

  const fromPalette = ACCOUNT_COLORS.find(
    (color) => !used.has(color.toLowerCase())
  );
  if (fromPalette) return fromPalette;

  for (let hue = 0; hue < 360; hue += 12) {
    for (const lightness of [42, 52, 32, 62]) {
      const color = hslToHex(hue, 68, lightness);
      if (!used.has(color.toLowerCase())) return color;
    }
  }

  return hslToHex(Math.floor(Math.random() * 360), 70, 45);
}
