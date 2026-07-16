"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/features/auth/actions";

type HeaderUser = {
  email: string;
  name: string;
  initials: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setUser({
        email: "modo preview",
        name: "Gabriel",
        initials: "GD",
      });
      return;
    }

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      const current = data.user;
      if (!current) {
        setUser(null);
        return;
      }

      const name =
        (current.user_metadata?.full_name as string | undefined) ||
        current.email?.split("@")[0] ||
        "Usuário";

      setUser({
        email: current.email ?? "",
        name,
        initials: getInitials(name) || "GD",
      });
    });
  }, []);

  async function handleSignOut() {
    if (!isSupabaseConfigured()) {
      router.push("/login");
      return;
    }

    await signOut();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.initials ?? "GD"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.name ?? "Conta"}</p>
            <p className="text-xs text-muted-foreground">
              {user?.email ?? "…"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Configurações</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
