import { FormMessage } from "@/components/admin/form-message";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateOfferStatusAction } from "@/lib/admin/actions";
import { getQualityIssueSummaries } from "@/lib/admin/data";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export const dynamic = "force-dynamic";

type AdminQualityPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminQualityPage({ searchParams }: AdminQualityPageProps) {
  const [params, issues] = await Promise.all([searchParams, getQualityIssueSummaries(200)]);
  const blockingIssues = issues.filter((item) => item.issues.some((issue) => issue.severity === "erro"));
  const warningIssues = issues.filter((item) => item.issues.every((issue) => issue.severity === "alerta"));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Qualidade</h1>
        <p className="text-muted-foreground">Identifique ofertas inválidas, vencidas, duplicadas ou com rastreabilidade fraca.</p>
      </div>
      <FormMessage error={params.error} success={params.success} />
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Erros bloqueantes</CardDescription>
            <CardTitle className="text-3xl">{blockingIssues.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Alertas revisáveis</CardDescription>
            <CardTitle className="text-3xl">{warningIssues.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Ofertas com problemas</CardTitle>
          <CardDescription>Arquive rapidamente itens vencidos/duplicados ou volte para Ofertas para corrigir dados.</CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Estabelecimento</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Problemas</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((item) => (
                  <TableRow key={item.offerId}>
                    <TableCell className="font-medium">{item.produto}</TableCell>
                    <TableCell>{item.estabelecimento}</TableCell>
                    <TableCell>{formatCurrency(item.preco)}</TableCell>
                    <TableCell>{item.validadeFim ? formatDate(item.validadeFim) : "Sem validade"}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.issues.map((issue) => (
                          <Badge key={issue.reason} variant={issue.severity === "erro" ? "destructive" : "secondary"}>
                            {issue.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.status !== "arquivada" ? (
                        <form action={updateOfferStatusAction}>
                          <input name="offer_id" type="hidden" value={item.offerId} />
                          <input name="status" type="hidden" value="arquivada" />
                          <Button size="sm" type="submit" variant="outline">
                            Arquivar
                          </Button>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nenhuma oferta inválida</EmptyTitle>
                <EmptyDescription>As regras atuais não encontraram problemas de qualidade.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
