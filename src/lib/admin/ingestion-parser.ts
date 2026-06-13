export type ParsedIngestionItem = {
  nomeOriginal: string;
  preco: number | null;
  validadeInicio: string | null;
  validadeFim: string | null;
  unidade: string | null;
  marca: string | null;
  observacao: string | null;
};

function normalizeBlank(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeDate(value?: string | null) {
  const normalized = normalizeBlank(value);

  if (!normalized) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const match = normalized.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const fullYear = year ?? String(new Date().getFullYear());
  return `${fullYear}-${month}-${day}`;
}

function normalizePrice(value?: string | null) {
  const normalized = normalizeBlank(value);

  if (!normalized) {
    return null;
  }

  const priceMatch = normalized.match(/(\d{1,4}(?:[.,]\d{2})?)/);

  if (!priceMatch) {
    return null;
  }

  const price = Number(priceMatch[1].replace(".", "").replace(",", "."));
  return Number.isFinite(price) ? price : null;
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripPriceFromName(value: string) {
  return value.replace(/\s+R?\$?\s*\d{1,4}(?:[.,]\d{2})?\s*$/i, "").trim();
}

export function normalizeProductName(value: string) {
  return normalizeName(value);
}

export function parseManualIngestionText(content: string): ParsedIngestionItem[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [rawName, rawPrice, rawValidity, rawUnit, rawBrand, rawObservation] = line
        .split(";")
        .map((part) => part.trim());
      const price = normalizePrice(rawPrice ?? line);
      const fallbackName = stripPriceFromName(rawName || line);

      return {
        nomeOriginal: fallbackName,
        preco: price,
        validadeInicio: null,
        validadeFim: normalizeDate(rawValidity),
        unidade: normalizeBlank(rawUnit),
        marca: normalizeBlank(rawBrand),
        observacao: normalizeBlank(rawObservation),
      };
    })
    .filter((item) => item.nomeOriginal.length > 0);
}
