import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardMetrics, getSearchGaps } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const metricLabels = {
    estabelecimentos: "Estabelecimentos",
    produtos: "Produtos",
    ofertasAtivas: "Ofertas ativas",
    ofertasVencidas: "Ofertas vencidas",
    lotesPendentes: "Lotes pendentes",
    buscasSemResultado: "Termos sem resultado",
};

export default async function AdminDashboardPage() {
    const [metrics, searchGaps] = await Promise.all([
        getDashboardMetrics(),
        getSearchGaps(8),
    ]);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Resumo operacional para manter ofertas e busca saudáveis.</p>
            </div>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(metricLabels).map(([key, label]) => (
                    <Card key={key}>
                        <CardHeader>
                            <CardDescription>{label}</CardDescription>
                            <CardTitle className="text-3xl">{metrics[key as keyof typeof metrics]}</CardTitle>
                        </CardHeader>
                    </Card>
                ))}
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
