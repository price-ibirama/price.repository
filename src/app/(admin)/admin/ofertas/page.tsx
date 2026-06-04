import { FormMessage } from "@/components/admin/form-message";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createOfferAction, updateOfferStatusAction } from "@/lib/admin/actions";
import { getCatalogOptions, getOfferSummaries } from "@/lib/admin/data";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export const dynamic = "force-dynamic";

type AdminOffersPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminOffersPage({ searchParams }: AdminOffersPageProps) {
  const [params, offers, options] = await Promise.all([
    searchParams,
    getOfferSummaries(),
    getCatalogOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Ofertas</h1>
        <p className="text-muted-foreground">Cadastre ofertas manualmente ou revise publicações vindas da ingestão.</p>
      </div>
      <FormMessage error={params.error} success={params.success} />
      <Card>
        <CardHeader>
          <CardTitle>Nova oferta</CardTitle>
          <CardDescription>Publicação manual com bloqueio de preço inválido, validade invertida e duplicidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createOfferAction}>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel htmlFor="id_estabelecimento">Estabelecimento</FieldLabel>
                  <NativeSelect id="id_estabelecimento" name="id_estabelecimento" required>
                    <option value="">Selecione</option>
                    {options.estabelecimentos.map((establishment) => (
                      <option key={establishment.id} value={establishment.id}>
                        {establishment.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="id_produto">Produto</FieldLabel>
                  <NativeSelect id="id_produto" name="id_produto" required>
                    <option value="">Selecione</option>
                    {options.produtos.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="preco">Preço</FieldLabel>
                  <Input id="preco" name="preco" inputMode="decimal" placeholder="9,99" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <NativeSelect id="status" name="status" defaultValue="rascunho">
                    <option value="rascunho">Salvar rascunho</option>
                    <option value="publicada">Publicar agora</option>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="validade_inicio">Início</FieldLabel>
                  <Input id="validade_inicio" name="validade_inicio" type="date" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="validade_fim">Fim</FieldLabel>
                  <Input id="validade_fim" name="validade_fim" type="date" />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="observacao">Observação</FieldLabel>
                <Textarea id="observacao" name="observacao" placeholder="Ex.: enquanto durarem os estoques" />
              </Field>
              <Button className="w-fit" type="submit">
                Salvar oferta
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ofertas cadastradas</CardTitle>
          <CardDescription>Histórico, origem e status das ofertas publicadas, rascunhos e arquivadas.</CardDescription>
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
                  <TableHead>Qualidade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{offer.produto}</span>
                        <span className="text-xs text-muted-foreground">{offer.origem}</span>
                      </div>
                    </TableCell>
                    <TableCell>{offer.estabelecimento}</TableCell>
                    <TableCell>{formatCurrency(offer.preco)}</TableCell>
                    <TableCell>{offer.validadeFim ? formatDate(offer.validadeFim) : "Sem validade"}</TableCell>
                    <TableCell>
                      <StatusBadge status={offer.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {offer.issues.length > 0 ? (
                          offer.issues.map((issue) => (
                            <Badge key={issue.reason} variant={issue.severity === "erro" ? "destructive" : "secondary"}>
                              {issue.label}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">ok</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {offer.status !== "publicada" ? (
                          <form action={updateOfferStatusAction}>
                            <input name="offer_id" type="hidden" value={offer.id} />
                            <input name="status" type="hidden" value="publicada" />
                            <Button size="sm" type="submit">
                              Publicar
                            </Button>
                          </form>
                        ) : null}
                        {offer.status !== "arquivada" ? (
                          <form action={updateOfferStatusAction}>
                            <input name="offer_id" type="hidden" value={offer.id} />
                            <input name="status" type="hidden" value="arquivada" />
                            <Button size="sm" type="submit" variant="outline">
                              Arquivar
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nenhuma oferta cadastrada</EmptyTitle>
                <EmptyDescription>Cadastre uma oferta manual ou publique um item de ingestão.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
