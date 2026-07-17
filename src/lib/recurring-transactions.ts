export type RecurringExpandableTransaction = {
  id: string;
  type: string;
  amount: number | string;
  account_id: string;
  category_id: string | null;
  description: string | null;
  date: string;
  is_paid: boolean;
  is_recurring: boolean;
  created_at?: string;
};

export type DisplayTransaction<
  T extends RecurringExpandableTransaction = RecurringExpandableTransaction,
> = T & {
  is_projected?: boolean;
  source_id?: string;
};

function monthKeyFromParts(year: number, monthIndex0: number) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

function lastDayOfMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function occurrenceDateISO(
  templateDateISO: string,
  year: number,
  monthIndex0: number
) {
  const day = Number(templateDateISO.slice(8, 10)) || 1;
  const capped = Math.min(day, lastDayOfMonth(year, monthIndex0));
  return `${monthKeyFromParts(year, monthIndex0)}-${String(capped).padStart(2, "0")}`;
}

function recurringFingerprint(tx: {
  type: string;
  account_id: string;
  category_id: string | null;
  amount: number | string;
  description: string | null;
}) {
  return [
    tx.type,
    tx.account_id,
    tx.category_id ?? "",
    Number(tx.amount).toFixed(2),
    (tx.description ?? "").trim().toLowerCase(),
  ].join("|");
}

/**
 * Inclui lançamentos do mês + projeções de receitas/despesas fixas
 * a partir da data original, nos meses seguintes.
 */
export function expandRecurringForMonth<T extends RecurringExpandableTransaction>(
  transactions: T[],
  year: number,
  monthIndex0: number
): Array<T & { is_projected?: boolean; source_id?: string }> {
  const monthKey = monthKeyFromParts(year, monthIndex0);
  const realInMonth = transactions.filter(
    (tx) => tx.date.slice(0, 7) === monthKey
  );

  const fingerprintsInMonth = new Set(
    realInMonth.map((tx) => recurringFingerprint(tx))
  );

  const projected: Array<T & { is_projected?: boolean; source_id?: string }> =
    [];

  const templates = new Map<string, T>();
  for (const tx of transactions) {
    if (!tx.is_recurring) continue;
    if (tx.type !== "income" && tx.type !== "expense") continue;
    const fingerprint = recurringFingerprint(tx);
    const current = templates.get(fingerprint);
    if (!current || tx.date.slice(0, 10) < current.date.slice(0, 10)) {
      templates.set(fingerprint, tx);
    }
  }

  for (const tx of templates.values()) {
    const startKey = tx.date.slice(0, 7);
    if (monthKey < startKey) continue;
    if (monthKey === startKey) continue;

    const fingerprint = recurringFingerprint(tx);
    if (fingerprintsInMonth.has(fingerprint)) continue;

    const date = occurrenceDateISO(tx.date, year, monthIndex0);

    projected.push({
      ...tx,
      id: `projected:${tx.id}:${monthKey}`,
      date,
      is_paid: false,
      is_projected: true,
      source_id: tx.id,
    });
  }

  return [...realInMonth, ...projected].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
}

export function isProjectedTransactionId(id: string) {
  return id.startsWith("projected:");
}

export function parseProjectedTransactionId(id: string) {
  const match = /^projected:([0-9a-f-]{36}):(\d{4}-\d{2})$/i.exec(id);
  if (!match) return null;
  return { sourceId: match[1], monthKey: match[2] };
}
