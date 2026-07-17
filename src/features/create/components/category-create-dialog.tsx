"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { ACCOUNT_COLORS } from "@/lib/labels";
import { createCategory } from "@/features/categories/actions";
import type { CategoryInput } from "@/lib/validations/finance";

const emptyForm: CategoryInput = {
  name: "",
  type: "expense",
  color: ACCOUNT_COLORS[4],
  monthly_limit: null,
  icon: null,
};

export function CategoryCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<CategoryInput>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createCategory({
        ...form,
        monthly_limit:
          form.monthly_limit === null || form.monthly_limit === undefined
            ? null
            : Number(form.monthly_limit),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoria criada");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="g-cat-name">Nome</Label>
            <Input
              id="g-cat-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Mercado"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-cat-type">Tipo</Label>
            <Select
              id="g-cat-type"
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
            <Label htmlFor="g-cat-limit">Limite mensal (opcional)</Label>
            <Input
              id="g-cat-limit"
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
                  aria-label={`Cor ${color}`}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
  );
}
