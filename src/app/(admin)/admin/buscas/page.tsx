import { FormDialog } from "@/components/admin/form-dialog";
import { FormMessage } from "@/components/admin/form-message";
import { FormSelect } from "@/components/admin/form-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSearchTermAction } from "@/lib/admin/actions";
import { getCatalogOptions, getSearchGaps } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

type AdminSearchesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminSearchesPage({ searchParams }: AdminSearchesPageProps) {
  const [params, searchGaps, options] = await Promise.all([
    searchParams,
    getSearchGaps(40),
    getCatalogOptions(),
  ]);
  const targetTypeOptions = [
    { value: "produto", label: "Produto" },
    { value: "categoria", label: "Categoria" },
    { value: "estabelecimento", label: "Estabelecimento" },
    { value: "marca", label: "Marca" },
  ];
  const productOptions = options.produtos.map((product) => ({ value: product.id, label: product.label }));
  const categoryOptions = options.categorias.map((category) => ({ value: category.id, label: category.label }));
  const establishmentOptions = options.estabelecimentos.map((establishment) => ({
    value: establishment.id,
    label: establishment.label,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Buscas</h1>
        <p className="text-muted-foreground">Transforme termos sem resultado em aliases e regras de busca.</p>
      </div>
      <FormMessage error={params.error} success={params.success} />
      <Card>
        <CardHeader>
          <CardTitle>Buscas sem resultado</CardTitle>
          <CardDescription>Fila para melhorar aliases, categorias e cobertura de ofertas.</CardDescription>
          <CardAction>
            <FormDialog
              title="Novo termo de busca"
              description="Use quando sinônimos simples não forem suficientes para encontrar a oferta certa."
              triggerLabel="Novo termo"
            >
              <form action={createSearchTermAction}>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="termo">Termo</FieldLabel>
                      <Input id="termo" name="termo" placeholder="rancho" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tipo_alvo">Tipo de alvo</FieldLabel>
                      <FormSelect
                        id="tipo_alvo"
                        name="tipo_alvo"
                        options={targetTypeOptions}
                        placeholder="Selecione um tipo"
                        defaultValue="produto"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="peso">Peso</FieldLabel>
                      <Input id="peso" name="peso" type="number" min="0" max="1" step="0.1" defaultValue="0.7" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="marca">Marca</FieldLabel>
                      <Input id="marca" name="marca" placeholder="Somente para tipo marca" />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="id_produto">Produto</FieldLabel>
                      <FormSelect id="id_produto" name="id_produto" options={productOptions} placeholder="Sem produto" />
                      <FieldDescription>Obrigatório quando o tipo for produto.</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="id_categoria">Categoria</FieldLabel>
                      <FormSelect id="id_categoria" name="id_categoria" options={categoryOptions} placeholder="Sem categoria" />
                      <FieldDescription>Obrigatório quando o tipo for categoria.</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="id_estabelecimento">Estabelecimento</FieldLabel>
                      <FormSelect
                        id="id_estabelecimento"
                        name="id_estabelecimento"
                        options={establishmentOptions}
                        placeholder="Sem estabelecimento"
                      />
                      <FieldDescription>Obrigatório quando o tipo for estabelecimento.</FieldDescription>
                    </Field>
                  </div>
                  <Button className="w-fit" type="submit">
                    Cadastrar termo
                  </Button>
                </FieldGroup>
              </form>
            </FormDialog>
          </CardAction>
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
    </div>
  );
}
