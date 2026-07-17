"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ACCOUNT_COLORS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  CATEGORY_ICON_OPTIONS,
  CategoryIcon,
} from "@/lib/category-icons";
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
  icon: "receipt",
  parent_id: null,
};

type CategoryRow = Category & { depth: number };

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [filter, setFilter] = useState<"expense" | "income">("expense");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const rows = useMemo(() => {
    const ofType = categories.filter((category) => category.type === filter);
    const query = search.trim().toLowerCase();
    const matched = query
      ? ofType.filter((category) =>
          category.name.toLowerCase().includes(query)
        )
      : ofType;

    const byParent = new Map<string | null, Category[]>();
    for (const category of matched) {
      const key = category.parent_id;
      const list = byParent.get(key) ?? [];
      list.push(category);
      byParent.set(key, list);
    }

    for (const list of byParent.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }

    const result: CategoryRow[] = [];
    const walk = (parentId: string | null, depth: number) => {
      const children = byParent.get(parentId) ?? [];
      for (const child of children) {
        result.push({ ...child, depth });
        walk(child.id, depth + 1);
      }
    };

    // Pais sem filtro de busca + órfãos cujo pai não está na lista filtrada
    const matchedIds = new Set(matched.map((item) => item.id));
    walk(null, 0);

    for (const category of matched) {
      if (
        category.parent_id &&
        !matchedIds.has(category.parent_id) &&
        !result.some((row) => row.id === category.id)
      ) {
        result.push({ ...category, depth: 1 });
      }
    }

    // Se a busca não pegou pais, ainda mostra os filhos encontrados
    if (query) {
      const seen = new Set(result.map((row) => row.id));
      for (const category of matched) {
        if (!seen.has(category.id)) {
          result.push({
            ...category,
            depth: category.parent_id ? 1 : 0,
          });
        }
      }
      result.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }

    return result;
  }, [categories, filter, search]);

  const parentOptions = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === form.type &&
          !category.parent_id &&
          category.id !== editing?.id
      ),
    [categories, form.type, editing?.id]
  );

  function openCreate(parentId: string | null = null) {
    setEditing(null);
    setForm({
      ...emptyForm,
      type: filter,
      parent_id: parentId,
      color:
        parentId
          ? categories.find((item) => item.id === parentId)?.color ??
            emptyForm.color
          : emptyForm.color,
    });
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
      parent_id: category.parent_id,
    });
    setOpen(true);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const payload: CategoryInput = {
        ...form,
        monthly_limit:
          form.monthly_limit === null || form.monthly_limit === undefined
            ? null
            : Number(form.monthly_limit),
        parent_id: form.parent_id || null,
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

  function confirmDelete() {
    if (!pendingDelete) return;
    const category = pendingDelete;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoria excluída");
      setPendingDelete(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize receitas e despesas como no Mobills.
          </p>
        </div>
        <Button onClick={() => openCreate(null)}>
          <Plus className="h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-border/70 bg-card p-1 shadow-soft">
          {(
            [
              ["expense", "Despesas"],
              ["income", "Receitas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar categoria"
            className="pl-9"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria"
          description="Crie categorias para classificar suas movimentações."
          actionLabel="Criar categoria"
          onAction={() => openCreate(null)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border/70 bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Ícone</th>
                  <th className="px-4 py-3 font-medium">Cor</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-2 font-medium"
                        style={{ paddingLeft: category.depth * 20 }}
                      >
                        {category.depth > 0 ? (
                          <span className="text-muted-foreground">↳</span>
                        ) : null}
                        {category.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/70">
                        <CategoryIcon
                          icon={category.icon}
                          color={category.color}
                          size={18}
                        />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full ring-2 ring-border/60"
                        style={{ backgroundColor: category.color }}
                        title={category.color}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!category.parent_id ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Adicionar subcategoria"
                            onClick={() => openCreate(category.id)}
                          >
                            <Plus className="h-4 w-4 text-primary" />
                          </Button>
                        ) : null}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Editar"
                          onClick={() => openEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir"
                          onClick={() => setPendingDelete(category)}
                          disabled={pending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Editar categoria"
                : form.parent_id
                  ? "Nova subcategoria"
                  : "Nova categoria"}
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
                    parent_id: null,
                  })
                }
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_id">Categoria pai (opcional)</Label>
              <Select
                id="parent_id"
                value={form.parent_id ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    parent_id: e.target.value || null,
                  })
                }
              >
                <option value="">Nenhuma (categoria principal)</option>
                {parentOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-border/70 p-2">
                {CATEGORY_ICON_OPTIONS.map((option) => {
                  const selected = form.icon === option.slug;
                  return (
                    <button
                      key={option.slug}
                      type="button"
                      title={option.label}
                      onClick={() => setForm({ ...form, icon: option.slug })}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-lg transition-colors",
                        selected
                          ? "bg-primary/15 ring-2 ring-primary"
                          : "hover:bg-secondary"
                      )}
                    >
                      <option.Icon
                        className="h-4 w-4"
                        style={{ color: form.color }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full ring-offset-2 ring-offset-background",
                      form.color === color ? "ring-2 ring-primary" : ""
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, color })}
                  />
                ))}
              </div>
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(openState) => {
          if (!openState) setPendingDelete(null);
        }}
        title="Excluir categoria?"
        description={
          pendingDelete
            ? `Tem certeza que deseja excluir "${pendingDelete.name}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir categoria"
        loading={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
