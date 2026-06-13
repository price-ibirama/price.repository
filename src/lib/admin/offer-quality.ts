export type OfferQualitySeverity = "erro" | "alerta";

export type OfferQualityReason =
  | "preco_invalido"
  | "validade_invertida"
  | "ativa_vencida"
  | "duplicada"
  | "sem_validade"
  | "publicada_sem_origem";

export type OfferQualityIssue = {
  reason: OfferQualityReason;
  severity: OfferQualitySeverity;
  label: string;
};

export type OfferQualityInput = {
  status: string;
  preco: number;
  validadeInicio?: string | null;
  validadeFim?: string | null;
  idLoteIngestao?: string | null;
  idItemIngestao?: string | null;
  fingerprintOrigem?: string | null;
};

export const offerQualityReasonLabels: Record<OfferQualityReason, string> = {
  preco_invalido: "Preço inválido",
  validade_invertida: "Validade invertida",
  ativa_vencida: "Oferta publicada vencida",
  duplicada: "Oferta duplicada",
  sem_validade: "Sem validade",
  publicada_sem_origem: "Publicada sem origem",
};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isPublished(status: string) {
  return status === "publicada" || status === "publicado";
}

function issue(reason: OfferQualityReason, severity: OfferQualitySeverity): OfferQualityIssue {
  return {
    reason,
    severity,
    label: offerQualityReasonLabels[reason],
  };
}

export function evaluateOfferQuality(input: OfferQualityInput, duplicateCount = 1) {
  const issues: OfferQualityIssue[] = [];
  const published = isPublished(input.status);

  if (!Number.isFinite(input.preco) || input.preco <= 0) {
    issues.push(issue("preco_invalido", "erro"));
  }

  if (input.validadeInicio && input.validadeFim && input.validadeFim < input.validadeInicio) {
    issues.push(issue("validade_invertida", "erro"));
  }

  if (published && input.validadeFim && input.validadeFim < getTodayIsoDate()) {
    issues.push(issue("ativa_vencida", "erro"));
  }

  if (published && duplicateCount > 1) {
    issues.push(issue("duplicada", "erro"));
  }

  if (published && !input.validadeFim) {
    issues.push(issue("sem_validade", "alerta"));
  }

  if (published && !input.idLoteIngestao && !input.idItemIngestao && !input.fingerprintOrigem) {
    issues.push(issue("publicada_sem_origem", "alerta"));
  }

  return issues;
}

export function hasBlockingOfferIssue(issues: OfferQualityIssue[]) {
  return issues.some((item) => item.severity === "erro");
}
