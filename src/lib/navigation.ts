import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  CreditCard,
  Target,
  TrendingUp,
  Repeat,
  HandCoins,
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
  { title: "Categorias", href: "/categories", icon: Tags },
  { title: "Cartões", href: "/cards", icon: CreditCard },
  { title: "Metas", href: "/goals", icon: Target },
  { title: "Investimentos", href: "/investments", icon: TrendingUp },
  { title: "Assinaturas", href: "/subscriptions", icon: Repeat },
  { title: "Empréstimos", href: "/loans", icon: HandCoins },
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
