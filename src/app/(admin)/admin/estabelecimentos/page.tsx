import { FormMessage } from "@/components/admin/form-message";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createEstablishmentAction } from "@/lib/admin/actions";
import { getCatalogOptions, getEstablishmentSummaries } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

type AdminEstablishmentsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminEstablishmentsPage({ searchParams }: AdminEstablishmentsPageProps) {
  const [params, options, establishments] = await Promise.all([
    searchParams,
    getCatalogOptions(),
    getEstablishmentSummaries(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Estabelecimentos</h1>
        <p className="text-muted-foreground">Cadastre lojas e mantenha a cobertura de ofertas por região.</p>
      </div>
      <FormMessage error={params.error} success={params.success} />
      <Card>
        <CardHeader>
          <CardTitle>Novo estabelecimento</CardTitle>
          <CardDescription>Use esta base para vincular fontes, lotes de ingestão e ofertas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createEstablishmentAction}>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="nome">Nome</FieldLabel>
                  <Input id="nome" name="nome" placeholder="Cooper" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tipo">Tipo</FieldLabel>
                  <NativeSelect id="tipo" name="tipo" defaultValue="supermercado">
                    <option value="supermercado">Supermercado</option>
                    <option value="farmacia">Farmácia</option>
                    <option value="posto_combustivel">Posto de combustível</option>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="id_cidade">Cidade</FieldLabel>
                  <NativeSelect id="id_cidade" name="id_cidade" required>
                    <option value="">Selecione</option>
                    {options.cidades.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="id_bairro">Bairro</FieldLabel>
                  <NativeSelect id="id_bairro" name="id_bairro">
                    <option value="">Sem bairro</option>
                    {options.bairros.map((neighborhood) => (
                      <option key={neighborhood.id} value={neighborhood.id}>
                        {neighborhood.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="logradouro">Endereço</FieldLabel>
                <Input id="logradouro" name="logradouro" placeholder="Rua, número" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input name="ativo" type="checkbox" defaultChecked />
                Ativo para novas ofertas
              </label>
              <Button className="w-fit" type="submit">
                Cadastrar estabelecimento
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Estabelecimentos cadastrados</CardTitle>
          <CardDescription>Resumo de cobertura e ofertas ativas por loja.</CardDescription>
        </CardHeader>
        <CardContent>
          {establishments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ofertas ativas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {establishments.map((establishment) => (
                  <TableRow key={establishment.id}>
                    <TableCell className="font-medium">{establishment.nome}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{establishment.cidade}</span>
                        <span className="text-muted-foreground">{establishment.bairro ?? establishment.logradouro ?? "Sem bairro"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{establishment.tipo}</TableCell>
                    <TableCell>{establishment.ofertasAtivas}</TableCell>
                    <TableCell>
                      <StatusBadge status={establishment.ativo ? "ativo" : "inativo"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nenhum estabelecimento cadastrado</EmptyTitle>
                <EmptyDescription>Cadastre a primeira loja para criar ofertas e fontes.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
