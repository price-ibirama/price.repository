import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProductSummaries } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
    const products = await getProductSummaries();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Produtos</CardTitle>
                <CardDescription>Catálogo canônico usado no matching sem SKU.</CardDescription>
            </CardHeader>
            <CardContent>
                {products.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Unidade</TableHead>
                                <TableHead>Aliases</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.nome}</TableCell>
                                    <TableCell>{product.categoria ?? "Sem categoria"}</TableCell>
                                    <TableCell>{product.unidade ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.sinonimos > 1 ? "secondary" : "outline"}>
                                            {product.sinonimos}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>Nenhum produto cadastrado</EmptyTitle>
                            <EmptyDescription>Produtos canônicos aparecerão após a ingestão ou cadastro manual.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </CardContent>
        </Card>
    );
}
