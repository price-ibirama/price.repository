import { buildOffersResponse, searchOffers } from "@/services/offers-service";
import { parseMessageIntent } from "@/services/message-classifier";
import { wrapBetaMessage } from "@/services/message-template";
import { registerIntentLog, registerResponseLog } from "@/services/logging-service";
import { WhatsappClient } from "@/services/whatsapp-client";
import type { IncomingWhatsappStatus, IncomingWhatsappTextMessage } from "@/services/webhook-types";
import { env } from "@/config/env";

const USAGE_EXAMPLE = [
    "Envie o nome de um produto e eu busco as melhores ofertas para você.",
    "",
    "Exemplo: ",
    "> cerveja",
    "> churrasco",
    "> arroz",
]

const INCOMING_MESSAGE_MAX_AGE_MS = 15 * 60 * 1000;
const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

type BuildFinalResultOutput = {
    message: string,
    results: any[],
}

type BuildFinalResultInput = {
    searchTerm: string,
    classification: 'saudacao' | 'desconhecido' | 'busca'
}

function isIncomingMessageExpired(timestamp: string) {
    const receivedAt = Number(timestamp) * 1000;

    if (!Number.isFinite(receivedAt)) {
        return false;
    }

    return Date.now() - receivedAt > INCOMING_MESSAGE_MAX_AGE_MS;
}

function isUniqueViolationError(error: unknown) {
    return typeof error === "object"
        && error !== null
        && "code" in error
        && error.code === POSTGRES_UNIQUE_VIOLATION_CODE;
}

async function buildFinalResult({ searchTerm, classification }: BuildFinalResultInput): Promise<BuildFinalResultOutput> {
    if (classification === 'saudacao') {
        return {
            results: [],
            message: wrapBetaMessage(
                "Olá 👋",
                "",
                ...USAGE_EXAMPLE
            )
        }
    }

    if (classification === 'busca') {
        try {
            const offers = await searchOffers(searchTerm);
            return {
                results: offers.map((offer) => ({
                    produto: offer.produto,
                    preco: offer.preco,
                    estabelecimento: offer.estabelecimento,
                    tipo_estabelecimento: offer.tipo_estabelecimento,
                    bairro: offer.bairro,
                    cidade: offer.cidade,
                    validade_fim: offer.validade_fim,
                })),
                message: wrapBetaMessage(buildOffersResponse(searchTerm, offers))
            }
        } catch (error) {
            console.error(error);
            return {
                results: [],
                message: wrapBetaMessage(
                    "Nao consegui consultar as ofertas agora.",
                    "",
                    "Tente novamente em instantes."
                )
            }
        }
    }

    return {
        results: [],
        message: wrapBetaMessage(
            "Nao consegui identificar um produto na sua mensagem.",
            "",
            ...USAGE_EXAMPLE
        )
    }
}

export async function processIncomingWhatsappMessage(message: IncomingWhatsappTextMessage) {
    if (isIncomingMessageExpired(message.timestamp)) {
        console.info(`[${env.NODE_ENV}] expired message ignored`, {
            id: message.id,
            timestamp: message.timestamp,
        });
        return;
    }

    const whatsappClient = new WhatsappClient();

    const rawText = message.type === "text" ? message.text?.body ?? "" : `Mensagem do tipo ${message.type}`;
    const parsedIntent = message.type === "text"
        ? parseMessageIntent(rawText)
        : {
            normalizedMessage: "",
            extractedSearchTerm: null,
            classification: "desconhecido" as const,
        };
    const { normalizedMessage, extractedSearchTerm, classification } = parsedIntent;
    const finalClassification = classification;
    const identifiedTerm = finalClassification === "busca" ? extractedSearchTerm : null;

    let intentId: string;

    try {
        intentId = await registerIntentLog({
            classification: finalClassification,
            whatsappMessageId: message.id,
            normalizedMessage,
            receivedMessage: rawText,
            userPhone: message.from,
            identifiedTerm,
        });
    }
    catch (e) {
        if (isUniqueViolationError(e)) {
            console.info(`duplicate message ignored`, { id: message.id });
            return;
        }

        console.error(e);
        await whatsappClient.sendText({
            to: message.from,
            content: wrapBetaMessage(
                "Opss, tive um problema ao processar a mensagem.",
                "",
                "Tente novamente em instantes."
            ),
        });
        return;
    }

    await whatsappClient.markAsRead(message.id);
    await whatsappClient.sendTypingIndicator(message.id);

    /**
     * Somente mensagens de texto são permitidas no momento.
     */
    if (message.type !== "text") {
        await whatsappClient.sendText({
            to: message.from,
            content: wrapBetaMessage(
                "Formato invalido. Envie apenas mensagens de texto com o nome do produto.",
                "",
                ...USAGE_EXAMPLE
            ),
        });
        return
    }

    try {
        const {
            message: finalMessage,
            results
        } = await buildFinalResult({
            searchTerm: identifiedTerm ?? normalizedMessage,
            classification
        })

        await whatsappClient.sendText({
            to: message.from,
            content: finalMessage,
        });

        await registerResponseLog({
            intentId,
            totalResults: results.length,
            results,
        });
    }
    catch (e) {
        console.error(e);
        await whatsappClient.sendText({
            to: message.from,
            content: wrapBetaMessage(
                "Opss, tive um problema ao processar a mensagem.",
                "",
                "Tente novamente em instantes."
            ),
        });
    }
}

export async function processIncomingWhatsappStatus(status: IncomingWhatsappStatus) {
    console.info(`[${env.NODE_ENV}] status received`, status);
}
