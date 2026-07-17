"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";
import type { CurrencyCode } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CurrencyInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number | null | undefined;
  onValueChange: (value: number) => void;
  currency?: CurrencyCode;
};

/** Converte dígitos digitados em reais (centavos → valor). Ex.: 100000 → 1000 */
export function parseCurrencyDigits(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

export function CurrencyInput({
  value,
  onValueChange,
  currency = "BRL",
  className,
  onFocus,
  onBlur,
  ...props
}: CurrencyInputProps) {
  const [focused, setFocused] = React.useState(false);
  const [digits, setDigits] = React.useState("");

  const display = focused
    ? digits
      ? formatCurrency(parseCurrencyDigits(digits), currency)
      : ""
    : value == null || Number.isNaN(value)
      ? ""
      : formatCurrency(value, currency);

  return (
    <Input
      {...props}
      inputMode="numeric"
      className={cn("tabular-nums", className)}
      value={display}
      onFocus={(event) => {
        setFocused(true);
        const current = value == null || Number.isNaN(value) ? 0 : value;
        setDigits(current === 0 ? "" : String(Math.round(current * 100)));
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onValueChange(parseCurrencyDigits(digits));
        setDigits("");
        onBlur?.(event);
      }}
      onChange={(event) => {
        const nextDigits = event.target.value.replace(/\D/g, "").slice(0, 15);
        setDigits(nextDigits);
        onValueChange(parseCurrencyDigits(nextDigits));
      }}
    />
  );
}
