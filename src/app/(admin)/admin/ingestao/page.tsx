import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getIngestionBatches } from "@/lib/admin/data";
import { formatDate } from "@/utils/format-date";

export const dynamic = "force-dynamic";

export default async function AdminIngestionPage() {
    const batches = await getIngestionBatches();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ingestão</CardTitle>
                <CardDescription>Lotes extraídos de sites, panfletos, PDFs, imagens ou texto.</CardDescription>
            </CardHeader>
            <CardContent>
                {batches.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fonte</TableHead>
                                <TableHead>Estabelecimento</TableHead>
                                <TableHead>Itens</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Criado em</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batches.map((batch) => (
                                <TableRow key={batch.id}>
                                    <TableCell className="font-medium">{batch.fonte ?? "Fonte manual"}</TableCell>
                                    <TableCell>{batch.estabelecimento ?? "Sem estabelecimento"}</TableCell>
                                    <TableCell>{batch.totalItens}</TableCell>
                                    <TableCell>
                                        <Badge variant={batch.status === "publicado" ? "default" : "secondary"}>
                                            {batch.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(batch.criadoEm)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>Nenhum lote cadastrado</EmptyTitle>
                            <EmptyDescription>Fontes, panfletos e páginas coletadas aparecerão nesta fila.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </CardContent>
        </Card>
    );
}
