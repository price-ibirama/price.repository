import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardMetrics, getIngestionMetrics, getQualityIssueSummaries, getSearchGaps } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const metricLabels = [
  ["estabelecimentos", "Estabelecimentos"],
  ["produtos", "Produtos"],
  ["ofertasAtivas", "Ofertas ativas"],
  ["ofertasInvalidas", "Ofertas inválidas"],
  ["ofertasSemValidade", "Sem validade"],
  ["itensBaixaConfianca", "Baixa confiança"],
  ["lotesPendentes", "Lotes pendentes"],
  ["buscasSemResultado", "Buscas sem resultado"],
  ["taxaSemResultado", "Taxa sem resultado"],
] as const;

export default async function AdminDashboardPage() {
  const [metrics, searchGaps, qualityIssues, ingestionMetrics] = await Promise.all([
    getDashboardMetrics(),
    getSearchGaps(8),
    getQualityIssueSummaries(8),
    getIngestionMetrics(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumo operacional para manter ofertas, ingestão e busca saudáveis.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricLabels.map(([key, label]) => (
          <Card key={key}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">
                {key === "taxaSemResultado" ? `${metrics[key]}%` : metrics[key]}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Qualidade das ofertas</CardTitle>
            <CardDescription>Principais problemas que exigem correção ou arquivamento.</CardDescription>
            <CardAction>
              <Badge variant={qualityIssues.length > 0 ? "destructive" : "outline"}>{qualityIssues.length} alertas</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {qualityIssues.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oferta</TableHead>
                    <TableHead>Problemas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualityIssues.map((item) => (
                    <TableRow key={item.offerId}>
                      <TableCell className="font-medium">{item.produto}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.issues.map((issue) => (
                            <Badge key={issue.reason} variant={issue.severity === "erro" ? "destructive" : "secondary"}>
                              {issue.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nenhum problema encontrado</EmptyTitle>
                  <EmptyDescription>As ofertas cadastradas passaram pelas validações atuais.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ingestão</CardTitle>
            <CardDescription>Distribuição dos itens extraídos por status de revisão.</CardDescription>
          </CardHeader>
          <CardContent>
            {ingestionMetrics.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingestionMetrics.map((item) => (
                    <TableRow key={item.status}>
                      <TableCell className="font-medium">{item.status}</TableCell>
                      <TableCell>{item.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nenhum item extraído</EmptyTitle>
                  <EmptyDescription>Crie um lote de ingestão para acompanhar a conversão.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Buscas sem resultado</CardTitle>
          <CardDescription>Use estes termos para criar aliases ou cobrir lacunas de catálogo.</CardDescription>
          <CardAction>
            <Badge variant={searchGaps.length > 0 ? "secondary" : "outline"}>{searchGaps.length} termos</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {searchGaps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Termo</TableHead>
                  <TableHead>Buscas</TableHead>
                  <TableHead>Sem resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchGaps.map((item) => (
                  <TableRow key={item.termo}>
                    <TableCell className="font-medium">{item.termo}</TableCell>
                    <TableCell>{item.buscas}</TableCell>
                    <TableCell>{item.semResultado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nenhuma lacuna encontrada</EmptyTitle>
                <EmptyDescription>As buscas recentes encontraram ofertas compatíveis.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
