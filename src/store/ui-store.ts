import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CreateIntent =
  | "income"
  | "expense"
  | "account"
  | "category"
  | null;

type FinanceMonth = {
  year: number;
  month: number; // 0-11
};

function currentFinanceMonth(): FinanceMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

interface UIState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandOpen: boolean;
  createIntent: CreateIntent;
  financeMonth: FinanceMonth;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  setMobileNavOpen: (value: boolean) => void;
  setCommandOpen: (value: boolean) => void;
  openCreate: (intent: Exclude<CreateIntent, null>) => void;
  closeCreate: () => void;
  setFinanceMonth: (year: number, month: number) => void;
  shiftFinanceMonth: (delta: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      commandOpen: false,
      createIntent: null,
      financeMonth: currentFinanceMonth(),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setMobileNavOpen: (value) => set({ mobileNavOpen: value }),
      setCommandOpen: (value) => set({ commandOpen: value }),
      openCreate: (intent) => set({ createIntent: intent }),
      closeCreate: () => set({ createIntent: null }),
      setFinanceMonth: (year, month) => set({ financeMonth: { year, month } }),
      shiftFinanceMonth: (delta) =>
        set((state) => {
          const date = new Date(state.financeMonth.year, state.financeMonth.month + delta, 1);
          return {
            financeMonth: {
              year: date.getFullYear(),
              month: date.getMonth(),
            },
          };
        }),
    }),
    {
      name: "gdfinances-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        financeMonth: state.financeMonth,
      }),
    }
  )
);

export const MONTH_LABELS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

export function financeMonthLabel(year: number, month: number, capitalized = false) {
  const label = MONTH_LABELS[month] ?? "";
  const text = `${label} ${year}`;
  return capitalized ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
