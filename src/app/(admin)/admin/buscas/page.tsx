import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSearchGaps } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminSearchesPage() {
    const searchGaps = await getSearchGaps(40);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Buscas sem resultado</CardTitle>
                <CardDescription>Fila para melhorar aliases, categorias e cobertura de ofertas.</CardDescription>
            </CardHeader>
            <CardContent>
                {searchGaps.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Termo</TableHead>
                                <TableHead>Buscas</TableHead>
                                <TableHead>Falhas</TableHead>
                                <TableHead>Prioridade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {searchGaps.map((item) => (
                                <TableRow key={item.termo}>
                                    <TableCell className="font-medium">{item.termo}</TableCell>
                                    <TableCell>{item.buscas}</TableCell>
                                    <TableCell>{item.semResultado}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.semResultado >= 3 ? "destructive" : "secondary"}>
                                            {item.semResultado >= 3 ? "alta" : "média"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>Nenhuma busca sem resultado</EmptyTitle>
                            <EmptyDescription>Os termos recentes estão encontrando ofertas compatíveis.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </CardContent>
        </Card>
    );
}
