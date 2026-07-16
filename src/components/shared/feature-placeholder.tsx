import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FeaturePlaceholder({
  title,
  description,
  stage,
}: {
  title: string;
  description: string;
  stage: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary" className="mb-3">
          {stage}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta área já está roteada e pronta para receber os módulos da próxima
          etapa do roadmap. Layout, tema e navegação já estão integrados.
        </CardContent>
      </Card>
    </div>
  );
}
