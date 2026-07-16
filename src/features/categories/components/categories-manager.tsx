"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ACCOUNT_COLORS, categoryTypeLabels } from "@/lib/labels";
import { formatCurrency } from "@/utils/format";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/features/categories/actions";
import type { Category } from "@/types";
import type { CategoryInput } from "@/lib/validations/finance";

const emptyForm: CategoryInput = {
  name: "",
  type: "expense",
  color: ACCOUNT_COLORS[4],
  monthly_limit: null,
  icon: null,
};

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return categories;
    return categories.filter((category) => category.type === filter);
  }, [categories, filter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      type: category.type,
      color: category.color,
      monthly_limit: category.monthly_limit,
      icon: category.icon,
    });
    setOpen(true);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const payload = {
        ...form,
        monthly_limit:
          form.monthly_limit === null || form.monthly_limit === undefined
            ? null
            : Number(form.monthly_limit),
      };
      const result = editing
        ? await updateCategory(editing.id, payload)
        : await createCategory(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Categoria atualizada" : "Categoria criada");
      setOpen(false);
      router.refresh();
    });
  }

  function onDelete(category: Category) {
    if (!confirm(`Excluir a categoria "${category.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoria excluída");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Categorias</h1>
          <p className="mt-1 text-muted-foreground">
            Organize receitas e despesas. Categorias padrão já vêm no cadastro.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todas"],
            ["income", "Receitas"],
            ["expense", "Despesas"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria"
          description="Crie categorias para classificar suas movimentações."
          actionLabel="Criar categoria"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <Card key={category.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-9 w-9 shrink-0 rounded-xl"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{category.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          category.type === "income" ? "success" : "secondary"
                        }
                      >
                        {categoryTypeLabels[category.type]}
                      </Badge>
                      {category.monthly_limit != null && (
                        <span className="text-xs text-muted-foreground">
                          Limite {formatCurrency(Number(category.monthly_limit))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(category)}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar categoria" : "Nova categoria"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Mercado"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                id="type"
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as CategoryInput["type"],
                  })
                }
              >
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_limit">Limite mensal (opcional)</Label>
              <Input
                id="monthly_limit"
                type="number"
                step="0.01"
                value={form.monthly_limit ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    monthly_limit:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Ex.: 800"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-background ${
                      form.color === color ? "ring-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, color })}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
