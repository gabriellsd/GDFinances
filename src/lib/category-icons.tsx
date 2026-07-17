import {
  Book,
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Gamepad2,
  Gift,
  Heart,
  Home,
  MoreHorizontal,
  Plane,
  PlusCircle,
  Receipt,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Smartphone,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_OPTIONS: {
  slug: string;
  label: string;
  Icon: LucideIcon;
}[] = [
  { slug: "home", label: "Casa", Icon: Home },
  { slug: "shopping-cart", label: "Mercado", Icon: ShoppingCart },
  { slug: "shopping-bag", label: "Compras", Icon: ShoppingBag },
  { slug: "car", label: "Transporte", Icon: Car },
  { slug: "utensils", label: "Alimentação", Icon: Utensils },
  { slug: "coffee", label: "Café", Icon: Coffee },
  { slug: "heart", label: "Saúde", Icon: Heart },
  { slug: "smile", label: "Lazer", Icon: Smile },
  { slug: "gamepad", label: "Games", Icon: Gamepad2 },
  { slug: "book", label: "Educação", Icon: Book },
  { slug: "repeat", label: "Assinatura", Icon: Repeat },
  { slug: "wifi", label: "Internet", Icon: Wifi },
  { slug: "smartphone", label: "Eletrônicos", Icon: Smartphone },
  { slug: "wrench", label: "Ferramentas", Icon: Wrench },
  { slug: "plane", label: "Viagem", Icon: Plane },
  { slug: "gift", label: "Presente", Icon: Gift },
  { slug: "receipt", label: "Contas", Icon: Receipt },
  { slug: "credit-card", label: "Cartão", Icon: CreditCard },
  { slug: "wallet", label: "Salário", Icon: Wallet },
  { slug: "briefcase", label: "Trabalho", Icon: Briefcase },
  { slug: "trending-up", label: "Investimentos", Icon: TrendingUp },
  { slug: "plus-circle", label: "Outras", Icon: PlusCircle },
  { slug: "more-horizontal", label: "Geral", Icon: MoreHorizontal },
];

const iconMap = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((item) => [item.slug, item.Icon])
) as Record<string, LucideIcon>;

export function CategoryIcon({
  icon,
  color,
  size = 18,
  className,
}: {
  icon: string | null | undefined;
  color?: string;
  size?: number;
  className?: string;
}) {
  const Icon = (icon && iconMap[icon]) || Receipt;
  return (
    <span
      className={className}
      style={color ? { color } : undefined}
    >
      <Icon style={{ width: size, height: size }} />
    </span>
  );
}
