import { FormMessage } from "@/components/admin/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCategoryAction, createProductAction, createSynonymAction } from "@/lib/admin/actions";
import { getCatalogOptions, getProductSummaries } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

type AdminProductsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const units = ["kg", "g", "L", "ml", "un", "cx", "pct", "dz"];

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const [params, products, options] = await Promise.all([
    searchParams,
    getProductSummaries(),
    getCatalogOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
        <p className="text-muted-foreground">Catálogo canônico usado no matching sem SKU.</p>
      </div>
      <FormMessage error={params.error} success={params.success} />
      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Nova categoria</CardTitle>
            <CardDescription>Organiza busca e ranking por grupo de produto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCategoryAction}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="categoria_nome">Nome</FieldLabel>
                  <Input id="categoria_nome" name="nome" placeholder="Mercearia" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="categoria_slug">Slug opcional</FieldLabel>
                  <Input id="categoria_slug" name="slug" placeholder="mercearia" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="categoria_ordem">Ordem</FieldLabel>
                  <Input id="categoria_ordem" name="ordem" type="number" defaultValue="0" />
                </Field>
                <Button className="w-fit" type="submit">
                  Cadastrar categoria
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Novo produto</CardTitle>
            <CardDescription>Crie o item canônico usado pelas ofertas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createProductAction}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="produto_nome">Nome</FieldLabel>
                  <Input id="produto_nome" name="nome" placeholder="Arroz parboilizado 5kg" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="id_categoria">Categoria</FieldLabel>
                  <NativeSelect id="id_categoria" name="id_categoria">
                    <option value="">Sem categoria</option>
                    {options.categorias.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="unidade">Unidade</FieldLabel>
                  <NativeSelect id="unidade" name="unidade">
                    <option value="">Sem unidade</option>
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Button className="w-fit" type="submit">
                  Cadastrar produto
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Novo alias</CardTitle>
            <CardDescription>Ajuda o bot a entender como o usuário chama o produto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createSynonymAction}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="alias_id_produto">Produto</FieldLabel>
                  <NativeSelect id="alias_id_produto" name="id_produto" required>
                    <option value="">Selecione</option>
                    {options.produtos.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="termo">Termo</FieldLabel>
                  <Input id="termo" name="termo" placeholder="arroz 5kg" required />
                </Field>
                <Button className="w-fit" type="submit">
                  Cadastrar alias
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Produtos cadastrados</CardTitle>
          <CardDescription>Revise cobertura de aliases antes de depender do matching.</CardDescription>
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
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{product.nome}</span>
                        {product.aliases.length > 0 ? (
                          <span className="text-xs text-muted-foreground">{product.aliases.slice(0, 4).join(", ")}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{product.categoria ?? "Sem categoria"}</TableCell>
                    <TableCell>{product.unidade ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={product.sinonimos > 1 ? "secondary" : "outline"}>{product.sinonimos}</Badge>
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
    </div>
  );
}
