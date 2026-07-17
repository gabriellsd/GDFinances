import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  CreditCard,
  PieChart,
  CalendarDays,
  Sparkles,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  premium?: boolean;
};

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Contas", href: "/accounts", icon: Wallet },
  { title: "Transações", href: "/transactions", icon: ArrowLeftRight },
  { title: "Cartões de crédito", href: "/cards", icon: CreditCard },
  { title: "Categorias", href: "/categories", icon: Tags },
  { title: "Relatórios", href: "/reports", icon: PieChart },
  { title: "Calendário", href: "/calendar", icon: CalendarDays },
  { title: "IA Financeira", href: "/ai", icon: Sparkles, premium: true },
];

export const secondaryNav: NavItem[] = [
  { title: "Perfil", href: "/profile", icon: UserRound },
  { title: "Configurações", href: "/settings", icon: Settings },
];

export const mobileNav: NavItem[] = [
  { title: "Início", href: "/dashboard", icon: LayoutDashboard },
  { title: "Transações", href: "/transactions", icon: ArrowLeftRight },
  { title: "Relatórios", href: "/reports", icon: PieChart },
  { title: "Perfil", href: "/profile", icon: UserRound },
];
