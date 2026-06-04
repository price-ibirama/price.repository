import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
                                    <Badge variant={batch.status === "publicado" ? "success" : "warning"}>{batch.status}</Badge>
                                </TableCell>
                                <TableCell>{formatDate(batch.criadoEm)}</TableCell>
                            </TableRow>
                        ))}
                        {batches.length === 0 ? (
                            <TableRow>
                                <TableCell className="text-slate-500" colSpan={5}>
                                    Nenhum lote cadastrado ainda.
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
