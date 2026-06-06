import { FormDialog } from "@/components/admin/form-dialog";
import { FormMessage } from "@/components/admin/form-message";
import { FormSelect } from "@/components/admin/form-select";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createFlyerIngestionBatchAction,
  createManualIngestionBatchAction,
  createSourceAction,
  publishIngestionItemAction,
  rejectIngestionItemAction,
} from "@/lib/admin/actions";
import { getCatalogOptions, getIngestionBatches, getIngestionItems, getSourceSummaries } from "@/lib/admin/data";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export const dynamic = "force-dynamic";

type AdminIngestionPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const sourceTypes = ["site", "rede_social", "panfleto", "pdf", "imagem", "texto", "outro"];

export default async function AdminIngestionPage({ searchParams }: AdminIngestionPageProps) {
  const [params, options, batches, items, sources] = await Promise.all([
    searchParams,
    getCatalogOptions(),
    getIngestionBatches(),
    getIngestionItems(),
    getSourceSummaries(),
  ]);
  const reviewItems = items.filter((item) => ["pendente", "aprovado"].includes(item.status));
  const establishmentOptions = options.estabelecimentos.map((establishment) => ({
    value: establishment.id,
    label: establishment.label,
  }));
  const sourceOptions = options.fontes.map((source) => ({ value: source.id, label: source.label }));
  const sourceTypeOptions = sourceTypes.map((type) => ({ value: type, label: type }));
  const productOptions = options.produtos.map((product) => ({ value: product.id, label: product.label }));
  const reviewProductOptions = [{ value: "__create__", label: "Criar produto novo" }, ...productOptions];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Ingestão</h1>
        <p className="text-muted-foreground">Crie fontes, cole ofertas extraídas e publique somente após revisão humana.</p>
      </div>
      <FormMessage error={params.error} success={params.success} />
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de ingestão</CardTitle>
          <CardDescription>Cadastre fontes, processe panfletos com Groq e revise os itens antes de publicar.</CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <FormDialog title="Nova fonte" description="Mapeia de onde as ofertas foram coletadas." triggerLabel="Nova fonte">
              <form action={createSourceAction}>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="fonte_nome">Nome</FieldLabel>
                      <Input id="fonte_nome" name="nome" placeholder="Ofertas Cooper Ibirama" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="fonte_tipo">Tipo</FieldLabel>
                      <FormSelect id="fonte_tipo" name="tipo" options={sourceTypeOptions} placeholder="Selecione um tipo" defaultValue="texto" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="fonte_estabelecimento">Estabelecimento</FieldLabel>
                      <FormSelect
                        id="fonte_estabelecimento"
                        name="id_estabelecimento"
                        options={establishmentOptions}
                        placeholder="Sem vínculo"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="fonte_url">URL</FieldLabel>
                      <Input id="fonte_url" name="url" placeholder="https://..." />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input name="ativo" type="checkbox" defaultChecked />
                    Fonte ativa
                  </label>
                  <Button className="w-fit" type="submit">
                    Cadastrar fonte
                  </Button>
                </FieldGroup>
              </form>
            </FormDialog>
            <FormDialog
              title="Processar panfleto"
              description="Envie uma imagem JPG, PNG ou WEBP. A Groq extrai os itens e cria um lote para revisão."
              triggerLabel="Processar panfleto"
            >
              <form action={createFlyerIngestionBatchAction}>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="panfleto_estabelecimento">Estabelecimento</FieldLabel>
                      <FormSelect
                        id="panfleto_estabelecimento"
                        name="id_estabelecimento"
                        options={establishmentOptions}
                        placeholder="Selecione um estabelecimento"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="panfleto_fonte">Fonte</FieldLabel>
                      <FormSelect id="panfleto_fonte" name="id_fonte" options={sourceOptions} placeholder="Sem fonte" />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="panfleto">Panfleto digital</FieldLabel>
                    <label
                      htmlFor="panfleto"
                      className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-6 text-center transition hover:bg-muted/50"
                    >
                      <span className="text-sm font-medium">Arraste uma imagem ou clique para selecionar</span>
                      <span className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP até 3MB.</span>
                    </label>
                    <Input id="panfleto" name="panfleto" type="file" accept="image/png,image/jpeg,image/webp" required />
                    <FieldDescription>O arquivo é processado em memória e os itens extraídos entram na fila de revisão.</FieldDescription>
                  </Field>
                  <Button className="w-fit" type="submit">
                    Enviar e processar
                  </Button>
                </FieldGroup>
              </form>
            </FormDialog>
            <FormDialog
              title="Novo lote manual"
              description="V1 sem IA: cole uma linha por produto e revise antes de publicar."
              triggerLabel="Novo lote manual"
            >
              <form action={createManualIngestionBatchAction}>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="lote_estabelecimento">Estabelecimento</FieldLabel>
                      <FormSelect
                        id="lote_estabelecimento"
                        name="id_estabelecimento"
                        options={establishmentOptions}
                        placeholder="Selecione um estabelecimento"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="lote_fonte">Fonte</FieldLabel>
                      <FormSelect id="lote_fonte" name="id_fonte" options={sourceOptions} placeholder="Sem fonte" />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="conteudo_original">Itens extraídos</FieldLabel>
                    <Textarea
                      id="conteudo_original"
                      name="conteudo_original"
                      placeholder={
                        "Arroz parboilizado 5kg; 21,90; 15/06/2026; pct; Tio João; oferta do panfleto\nLeite integral 1L; 4,59; 10/06/2026; L"
                      }
                      required
                      rows={8}
                    />
                    <FieldDescription>Formato: nome; preço; validade final; unidade; marca; observação.</FieldDescription>
                  </Field>
                  <Button className="w-fit" type="submit">
                    Criar lote para revisão
                  </Button>
                </FieldGroup>
              </form>
            </FormDialog>
          </CardAction>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Itens para revisão</CardTitle>
          <CardDescription>Confirme o produto sugerido, crie produto novo quando necessário e publique a oferta.</CardDescription>
        </CardHeader>
        <CardContent>
          {reviewItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Matching</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{item.nomeOriginal}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.validadeFim ? `Validade ${formatDate(item.validadeFim)}` : "Sem validade"} · {item.unidade ?? "sem unidade"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{item.estabelecimento ?? "Sem estabelecimento"}</span>
                        <span className="text-xs text-muted-foreground">{item.fonte ?? "Fonte manual"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.preco === null ? "Sem preço" : formatCurrency(item.preco)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={(item.confidence ?? 0) >= 0.65 ? "secondary" : "destructive"}>
                          {item.confidence === null ? "sem score" : `${Math.round(item.confidence * 100)}%`}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.produto ?? "Sem produto vinculado"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <FormDialog title="Publicar item" description="Confirme o produto vinculado antes de criar a oferta." triggerLabel="Publicar">
                          <form action={publishIngestionItemAction}>
                            <FieldGroup>
                              <input name="item_id" type="hidden" value={item.id} />
                              <Field>
                                <FieldLabel htmlFor={`product_mode_${item.id}`}>Produto</FieldLabel>
                                <FormSelect
                                  id={`product_mode_${item.id}`}
                                  name="product_mode"
                                  options={reviewProductOptions}
                                  placeholder="Selecione um produto"
                                  defaultValue={item.produtoId ?? item.candidatos[0]?.id ?? "__create__"}
                                />
                              </Field>
                              <Button className="w-fit" type="submit">
                                Publicar oferta
                              </Button>
                            </FieldGroup>
                          </form>
                        </FormDialog>
                        <FormDialog title="Rejeitar item" description="Informe o motivo para manter a auditoria da revisão." triggerLabel="Rejeitar">
                          <form action={rejectIngestionItemAction}>
                            <FieldGroup>
                              <input name="item_id" type="hidden" value={item.id} />
                              <Field>
                                <FieldLabel htmlFor={`reason_${item.id}`}>Motivo</FieldLabel>
                                <Input id={`reason_${item.id}`} name="reason" placeholder="Motivo" />
                              </Field>
                              <Button className="w-fit" type="submit" variant="outline">
                                Rejeitar item
                              </Button>
                            </FieldGroup>
                          </form>
                        </FormDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nenhum item pendente</EmptyTitle>
                <EmptyDescription>Novos lotes manuais aparecerão aqui para revisão.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lotes recentes</CardTitle>
            <CardDescription>Histórico de extrações por fonte e estabelecimento.</CardDescription>
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
                        <StatusBadge status={batch.status} />
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
        <Card>
          <CardHeader>
            <CardTitle>Fontes cadastradas</CardTitle>
            <CardDescription>Sites, panfletos e textos usados como origem das ofertas.</CardDescription>
          </CardHeader>
          <CardContent>
            {sources.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estabelecimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium">{source.nome}</TableCell>
                      <TableCell>{source.tipo}</TableCell>
                      <TableCell>{source.estabelecimento ?? "Sem vínculo"}</TableCell>
                      <TableCell>
                        <StatusBadge status={source.ativo ? "ativa" : "inativa"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nenhuma fonte cadastrada</EmptyTitle>
                  <EmptyDescription>Cadastre uma fonte para rastrear a origem das ofertas.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
