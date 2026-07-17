import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { CurrencyCode } from "@/lib/constants";

export type MoneyTone = "income" | "expense" | "neutral" | "auto";

export function moneyToneClass(
  value: number,
  tone: MoneyTone = "auto"
): string {
  if (tone === "income") return "text-success";
  if (tone === "expense") return "text-destructive";
  if (tone === "neutral") return "text-foreground";

  if (value > 0) return "text-success";
  if (value < 0) return "text-destructive";
  return "text-muted-foreground";
}

type MoneyAmountProps = {
  value: number;
  currency?: CurrencyCode;
  tone?: MoneyTone;
  /** Prefixo +/− e valor absoluto */
  signed?: boolean;
  className?: string;
};

export function MoneyAmount({
  value,
  currency = "BRL",
  tone = "auto",
  signed = false,
  className,
}: MoneyAmountProps) {
  const colorValue =
    tone === "income" ? 1 : tone === "expense" ? -1 : value;

  const display = signed ? Math.abs(value) : value;
  const sign = signed
    ? tone === "expense" || (tone === "auto" && value < 0)
      ? "−"
      : tone === "income" || (tone === "auto" && value > 0)
        ? "+"
        : value < 0
          ? "−"
          : value > 0
            ? "+"
            : ""
    : "";

  return (
    <span
      className={cn(
        "tabular-nums font-semibold",
        moneyToneClass(colorValue, tone),
        className
      )}
    >
      {sign}
      {formatCurrency(display, currency)}
    </span>
  );
}
