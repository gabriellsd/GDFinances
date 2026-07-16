import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.12),_transparent_50%)]" />
      <Card className="relative z-10 w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle>Entrar no {APP_NAME}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {configured
              ? "Use seu e-mail ou Google para acessar suas finanças."
              : "Configure o Supabase para ativar o login real."}
          </p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <LoginForm configured={configured} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
