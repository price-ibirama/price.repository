export const SOURCE_TYPES = ["site", "rede_social", "panfleto", "pdf", "imagem", "texto", "outro"] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

type SourcePayloadInput = {
  nome: string;
  tipo: SourceType;
  id_estabelecimento: string | null;
  url: string | null;
  ativo: boolean;
};

function normalizeOptionalText(value: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function buildSourcePayload(input: SourcePayloadInput) {
  return {
    nome: input.nome.trim(),
    tipo: input.tipo,
    id_estabelecimento: normalizeOptionalText(input.id_estabelecimento),
    url: normalizeOptionalText(input.url),
    ativo: input.ativo,
  };
}
