import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
                <p className="mt-2 text-slate-600">Resumo operacional para manter ofertas e busca saudáveis.</p>
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
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Buscas sem resultado</CardTitle>
                            <CardDescription>Use estes termos para criar aliases ou cobrir lacunas de catálogo.</CardDescription>
                        </div>
                        <Badge variant={searchGaps.length > 0 ? "warning" : "success"}>{searchGaps.length} termos</Badge>
                    </div>
                </CardHeader>
                <CardContent>
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
                            {searchGaps.length === 0 ? (
                                <TableRow>
                                    <TableCell className="text-slate-500" colSpan={3}>
                                        Nenhuma busca sem resultado encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
