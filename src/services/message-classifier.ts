export type MessageClassification = "saudacao" | "busca" | "desconhecido";

export type ParsedMessageIntent = {
    normalizedMessage: string;
    extractedSearchTerm: string | null;
    classification: MessageClassification;
};

const greetings = new Set([
    "oi",
    "oii",
    "ola",
    "olaa",
    "bom dia",
    "boa tarde",
    "boa noite",
    "e ai",
    "opa",
    "hello",
]);

const openQuestionPrefixes = [
    "quem",
    "qual",
    "quais",
    "quando",
    "onde",
    "como",
    "porque",
    "por que",
    "pq",
];

const unsupportedConversationPrefixes = [
    "me ajuda",
    "me explique",
    "explica",
    "explique",
    "me fala",
    "fala sobre",
    "conte sobre",
];

const searchIntentPrefixes = [
    /^qual o preco d[aeo]s?\s+/,
    /^qual o valor d[aeo]s?\s+/,
    /^quanto custa\s+/,
    /^preco d[aeo]s?\s+/,
    /^preco\s+/,
    /^valor d[aeo]s?\s+/,
    /^valor\s+/,
    /^o preco d[aeo]s?\s+/,
    /^o preco\s+/,
    /^o valor d[aeo]s?\s+/,
    /^o valor\s+/,
    /^tem\s+/,
    /^tem ai\s+/,
    /^tem aqui\s+/,
    /^quero\s+/,
    /^procuro\s+/,
    /^buscar\s+/,
    /^busca\s+/,
    /^me veja\s+/,
    /^me mostra\s+/,
    /^mostra\s+/,
    /^pesquise\s+/,
];

const fillerWords = new Set([
    "o",
    "a",
    "os",
    "as",
    "um",
    "uma",
    "uns",
    "umas",
    "de",
    "do",
    "da",
    "dos",
    "das",
    "no",
    "na",
    "nos",
    "nas",
    "por",
    "para",
    "pra",
    "com",
    "e",
    "me",
    "ai",
    "aqui",
]);

const leadingSearchNoiseWords = new Set([
    "qual",
    "quais",
    "quanto",
    "preco",
    "valor",
    "custa",
    "custa?",
    "tem",
    "buscar",
    "busca",
    "procuro",
    "quero",
    "mostra",
    "mostre",
    "pesquise",
]);

export function normalizeMessage(message: string) {
    return message
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[?!.,;:()[\]{}"'`´]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function startsWithOpenQuestionPrefix(message: string) {
    return openQuestionPrefixes.some((prefix) => message === prefix || message.startsWith(`${prefix} `));
}

function startsWithUnsupportedConversationPrefix(message: string) {
    return unsupportedConversationPrefixes.some((prefix) => message === prefix || message.startsWith(`${prefix} `));
}

function hasSearchIntentPrefix(message: string) {
    return searchIntentPrefixes.some((pattern) => pattern.test(message));
}

function stripSearchIntentPrefixes(message: string) {
    let current = message;

    for (const pattern of searchIntentPrefixes) {
        if (pattern.test(current)) {
            current = current.replace(pattern, "").trim();
        }
    }

    return current;
}

function trimFillerWords(tokens: string[]) {
    let start = 0;
    let end = tokens.length;

    while (start < end && fillerWords.has(tokens[start])) {
        start += 1;
    }

    while (end > start && fillerWords.has(tokens[end - 1])) {
        end -= 1;
    }

    return tokens.slice(start, end);
}

function trimLeadingSearchNoiseWords(tokens: string[]) {
    let start = 0;

    while (start < tokens.length && leadingSearchNoiseWords.has(tokens[start])) {
        start += 1;
    }

    return tokens.slice(start);
}

function extractSearchTerm(message: string) {
    const withoutIntentPrefix = stripSearchIntentPrefixes(message);
    const cleaned = withoutIntentPrefix.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const tokens = trimFillerWords(trimLeadingSearchNoiseWords(cleaned.split(" ").filter(Boolean)));

    if (tokens.length === 0) {
        return null;
    }

    const candidate = tokens.join(" ").trim();
    return candidate.length >= 2 ? candidate : null;
}

export function classifyMessage(message: string): MessageClassification {
    if (!message) {
        return "desconhecido";
    }

    if (greetings.has(message)) {
        return "saudacao";
    }

    if (startsWithUnsupportedConversationPrefix(message)) {
        return "desconhecido";
    }

    const extractedSearchTerm = extractSearchTerm(message);
    if (!extractedSearchTerm) {
        return "desconhecido";
    }

    if (startsWithOpenQuestionPrefix(message) && !hasSearchIntentPrefix(message)) {
        return "desconhecido";
    }

    const lettersAndNumbers = extractedSearchTerm.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
    if (lettersAndNumbers.length < 2) {
        return "desconhecido";
    }

    return "busca";
}

export function parseMessageIntent(rawMessage: string): ParsedMessageIntent {
    const normalizedMessage = normalizeMessage(rawMessage);
    const classification = classifyMessage(normalizedMessage);

    return {
        normalizedMessage,
        extractedSearchTerm: classification === "busca" ? extractSearchTerm(normalizedMessage) : null,
        classification,
    };
}
