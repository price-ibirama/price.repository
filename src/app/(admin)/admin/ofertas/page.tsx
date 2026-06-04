import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOfferSummaries } from "@/lib/admin/data";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
    const offers = await getOfferSummaries();
    const today = new Date().toISOString().slice(0, 10);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ofertas</CardTitle>
                <CardDescription>Histórico e status das ofertas publicadas ou vencidas.</CardDescription>
            </CardHeader>
            <CardContent>
                {offers.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Estabelecimento</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead>Validade</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {offers.map((offer) => {
                                const isExpired = offer.validadeFim ? offer.validadeFim < today : false;
                                return (
                                    <TableRow key={offer.id}>
                                        <TableCell className="font-medium">{offer.produto}</TableCell>
                                        <TableCell>{offer.estabelecimento}</TableCell>
                                        <TableCell>{formatCurrency(offer.preco)}</TableCell>
                                        <TableCell>{offer.validadeFim ? formatDate(offer.validadeFim) : "Sem validade"}</TableCell>
                                        <TableCell>
                                            <Badge variant={isExpired ? "destructive" : "secondary"}>
                                                {isExpired ? "vencida" : offer.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>Nenhuma oferta cadastrada</EmptyTitle>
                            <EmptyDescription>Publique um lote de ingestão para listar ofertas aqui.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </CardContent>
        </Card>
    );
}
