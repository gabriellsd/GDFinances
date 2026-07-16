import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.16),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(124,108,255,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,rgba(107,114,128,0.08)_50%,transparent_51%,transparent_100%)] bg-[size:64px_64px] opacity-40" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Abrir app</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-16">
        <section className="max-w-3xl">
          <p className="mb-4 text-sm font-medium text-primary">
            Gabriel Dias Finances
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Clareza financeira com a elegância de um produto Apple.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
            Contas, cartões, metas, investimentos e IA em uma experiência rápida,
            limpa e extremamente intuitiva — web e PWA.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Explorar dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Criar conta</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "UX em 2–3 cliques",
              text: "Modais, autosave e navegação pensada para reduzir atrito.",
            },
            {
              icon: Sparkles,
              title: "IA financeira",
              text: "Pergunte sobre gastos, metas e onde economizar.",
            },
            {
              icon: Shield,
              title: "Supabase Auth",
              text: "Segurança com JWT, OAuth e RLS no PostgreSQL.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-soft backdrop-blur"
            >
              <item.icon className="mb-4 h-5 w-5 text-primary" />
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
