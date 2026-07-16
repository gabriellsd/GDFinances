import { obterPreset } from "@/lib/vendor/bancos-brasil";

export type BankOption = {
  slug: string;
  name: string;
  code: string;
  color: string;
};

/** Bancos mais usados no Brasil (slug = API @edusites/bancos-brasil) */
export const BANK_OPTIONS: BankOption[] = [
  { slug: "nubank", name: "Nubank", code: "260", color: "#820AD1" },
  { slug: "inter", name: "Inter", code: "077", color: "#FF7A00" },
  { slug: "itau", name: "Itaú", code: "341", color: "#EC7000" },
  { slug: "bradesco", name: "Bradesco", code: "237", color: "#CC092F" },
  { slug: "bancodobrasil", name: "Banco do Brasil", code: "001", color: "#003D7A" },
  { slug: "santander", name: "Santander", code: "033", color: "#EC0000" },
  { slug: "c6", name: "C6 Bank", code: "336", color: "#121212" },
  { slug: "caixa", name: "Caixa", code: "104", color: "#0066A1" },
  { slug: "btg", name: "BTG Pactual", code: "208", color: "#001E62" },
  { slug: "xp", name: "XP", code: "348", color: "#111111" },
  { slug: "picpay", name: "PicPay", code: "380", color: "#21C25E" },
  { slug: "pagbank", name: "PagBank", code: "290", color: "#42A936" },
  { slug: "neon", name: "Neon", code: "735", color: "#01C4E0" },
  { slug: "next", name: "Next", code: "237", color: "#00FF5F" },
  { slug: "sicoob", name: "Sicoob", code: "756", color: "#003B43" },
  { slug: "sicredi", name: "Sicredi", code: "748", color: "#3DAE2B" },
  { slug: "safra", name: "Safra", code: "422", color: "#151D43" },
  { slug: "original", name: "Original", code: "212", color: "#00A857" },
  { slug: "mercadopago", name: "Mercado Pago", code: "323", color: "#00BCFF" },
  { slug: "stone", name: "Stone", code: "197", color: "#00A868" },
];

const NAME_ALIASES: Record<string, string> = {
  nubank: "nubank",
  nu: "nubank",
  inter: "inter",
  bancointer: "inter",
  itau: "itau",
  "itaú": "itau",
  bradesco: "bradesco",
  "banco do brasil": "bancodobrasil",
  bb: "bancodobrasil",
  bancodobrasil: "bancodobrasil",
  santander: "santander",
  "c6 bank": "c6",
  c6: "c6",
  caixa: "caixa",
  "caixa econômica": "caixa",
  "caixa economica": "caixa",
  btg: "btg",
  "btg pactual": "btg",
  xp: "xp",
  "xp investimentos": "xp",
  picpay: "picpay",
  pagbank: "pagbank",
  pagseguro: "pagbank",
  neon: "neon",
  next: "next",
  sicoob: "sicoob",
  sicredi: "sicredi",
  safra: "safra",
  original: "original",
  "mercado pago": "mercadopago",
  mercadopago: "mercadopago",
  stone: "stone",
};

export function normalizeBankKey(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function resolveBankSlug(
  iconOrName?: string | null,
  bankName?: string | null
): string | null {
  const direct = normalizeBankKey(iconOrName);
  if (direct && BANK_OPTIONS.some((bank) => bank.slug === direct)) {
    return direct;
  }
  if (direct && NAME_ALIASES[direct]) {
    return NAME_ALIASES[direct];
  }

  const fromName = normalizeBankKey(bankName);
  if (fromName && NAME_ALIASES[fromName]) {
    return NAME_ALIASES[fromName];
  }

  const matched = BANK_OPTIONS.find(
    (bank) => normalizeBankKey(bank.name) === fromName
  );
  return matched?.slug ?? null;
}

export function getBankBySlug(slug?: string | null) {
  if (!slug) return null;
  return BANK_OPTIONS.find((bank) => bank.slug === slug) ?? null;
}

export function getBankBrandColor(slug?: string | null) {
  if (!slug) return null;
  try {
    const preset = obterPreset(slug) as { fundo?: string } | null;
    return preset?.fundo ?? getBankBySlug(slug)?.color ?? null;
  } catch {
    return getBankBySlug(slug)?.color ?? null;
  }
}
