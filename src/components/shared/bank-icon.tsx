"use client";

import { useMemo } from "react";
import { svgBanco } from "@/lib/vendor/bancos-brasil";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveBankSlug } from "@/lib/banks";

type BankIconProps = {
  /** Slug da lib (nubank, itau…) ou nome do banco */
  bank?: string | null;
  bankName?: string | null;
  size?: number;
  className?: string;
  rounded?: "xl" | "full" | "lg";
};

export function BankIcon({
  bank,
  bankName,
  size = 40,
  className,
  rounded = "xl",
}: BankIconProps) {
  const slug = resolveBankSlug(bank, bankName);

  const svg = useMemo(() => {
    if (!slug) return "";
    try {
      const result = svgBanco({
        nome: slug,
        formato: "quadrado",
        tamanho: size,
      });
      return typeof result === "string" ? result : "";
    } catch {
      return "";
    }
  }, [slug, size]);

  const radius =
    rounded === "full"
      ? "rounded-full"
      : rounded === "lg"
        ? "rounded-lg"
        : "rounded-xl";

  if (!slug || !svg) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center bg-secondary text-muted-foreground",
          radius,
          className
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Building2 style={{ width: size * 0.45, height: size * 0.45 }} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden shadow-soft [&_svg]:block [&_svg]:h-full [&_svg]:w-full",
        radius,
        className
      )}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
      role="img"
      aria-label={bankName || slug}
    />
  );
}
