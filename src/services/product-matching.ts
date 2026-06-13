export type ExtractedOfferProduct = {
    nomeOriginal: string;
    marca?: string | null;
    quantidade?: number | null;
    unidade?: string | null;
    embalagem?: string | null;
    categoria?: string | null;
};

export type ProductCandidate = {
    id: string;
    nome: string;
    marca?: string | null;
    quantidade?: number | null;
    unidade?: string | null;
    embalagem?: string | null;
    categoria?: string | null;
    aliases?: string[];
};

export type ProductMatch = {
    candidate: ProductCandidate;
    confidence: number;
    reasons: string[];
};

const HIGH_CONFIDENCE = 0.86;
const MEDIUM_CONFIDENCE = 0.62;

function normalizeText(value?: string | null) {
    return (value ?? "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(value?: string | null) {
    return new Set(normalizeText(value).split(" ").filter((token) => token.length > 1));
}

function jaccardSimilarity(left: Set<string>, right: Set<string>) {
    if (left.size === 0 || right.size === 0) {
        return 0;
    }

    const intersection = [...left].filter((token) => right.has(token)).length;
    const union = new Set([...left, ...right]).size;

    return intersection / union;
}

function exactNormalizedMatch(left?: string | null, right?: string | null) {
    const normalizedLeft = normalizeText(left);
    const normalizedRight = normalizeText(right);

    return normalizedLeft.length > 0 && normalizedLeft === normalizedRight;
}

function quantityScore(input?: number | null, candidate?: number | null) {
    if (!input || !candidate) {
        return 0;
    }

    const diff = Math.abs(input - candidate);
    const maxValue = Math.max(input, candidate);

    return Math.max(0, 1 - diff / maxValue);
}

export function scoreProductCandidate(input: ExtractedOfferProduct, candidate: ProductCandidate): ProductMatch {
    const inputNameTokens = tokenize(input.nomeOriginal);
    const candidateNameTokens = tokenize(candidate.nome);
    const aliasScore = Math.max(
        0,
        ...(candidate.aliases ?? []).map((alias) => jaccardSimilarity(inputNameTokens, tokenize(alias)))
    );
    const nameScore = Math.max(jaccardSimilarity(inputNameTokens, candidateNameTokens), aliasScore);
    const brandScore = exactNormalizedMatch(input.marca, candidate.marca) ? 1 : 0;
    const unitScore = exactNormalizedMatch(input.unidade, candidate.unidade) ? 1 : 0;
    const packageScore = exactNormalizedMatch(input.embalagem, candidate.embalagem) ? 1 : 0;
    const categoryScore = exactNormalizedMatch(input.categoria, candidate.categoria) ? 1 : 0;
    const amountScore = quantityScore(input.quantidade, candidate.quantidade);

    const confidence = Number(
        (
            nameScore * 0.48
            + brandScore * 0.18
            + amountScore * 0.12
            + unitScore * 0.08
            + packageScore * 0.07
            + categoryScore * 0.07
        ).toFixed(3)
    );

    const reasons = [
        nameScore >= 0.7 ? "nome semelhante" : null,
        brandScore === 1 ? "marca igual" : null,
        amountScore >= 0.9 ? "quantidade compatível" : null,
        unitScore === 1 ? "unidade igual" : null,
        packageScore === 1 ? "embalagem igual" : null,
        categoryScore === 1 ? "categoria igual" : null,
    ].filter((reason): reason is string => Boolean(reason));

    return {
        candidate,
        confidence,
        reasons,
    };
}

export function rankProductCandidates(input: ExtractedOfferProduct, candidates: ProductCandidate[]) {
    return candidates
        .map((candidate) => scoreProductCandidate(input, candidate))
        .sort((left, right) => right.confidence - left.confidence);
}

export function classifyMatchConfidence(confidence: number) {
    if (confidence >= HIGH_CONFIDENCE) {
        return "alta" as const;
    }

    if (confidence >= MEDIUM_CONFIDENCE) {
        return "media" as const;
    }

    return "baixa" as const;
}
