import { createSupabaseClient } from "@/supabase";
import type { Database } from "@/supabase/database.types";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export type OfferResult = Database["public"]["Functions"]["buscar_ofertas"]["Returns"][number];
export type ProductSuggestionResult = Database["public"]["Functions"]["buscar_produtos_sugeridos"]["Returns"][number];

export async function searchOffers(term: string, limit = 5) {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase.rpc("buscar_ofertas", {
        p_termo: term,
        p_limite: limit,
    });

    if (error) {
        throw error;
    }

    return (data ?? []) as OfferResult[];
}

export async function searchProductSuggestions(term: string, limit = 5) {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase.rpc("buscar_produtos_sugeridos", {
        p_termo: term,
        p_limite: limit,
    });

    if (error) {
        throw error;
    }

    return (data ?? []) as ProductSuggestionResult[];
}

function getStoreTypeEmoji(storeType?: string | null) {
    if (storeType === "farmacia") {
        return "\u{1F48A}";
    }

    if (storeType === "posto_combustivel") {
        return "\u26FD";
    }

    return "\u{1F6D2}";
}

function getPositionEmoji(index: number) {
    const positions = ["1\uFE0F\u20E3", "2\uFE0F\u20E3", "3\uFE0F\u20E3", "4\uFE0F\u20E3", "5\uFE0F\u20E3", "6\uFE0F\u20E3", "7\uFE0F\u20E3", "8\uFE0F\u20E3", "9\uFE0F\u20E3", "\u{1F51F}"];
    return positions[index] ?? `${index + 1}.`;
}

export function buildOffersResponse(searchTerm: string, offers: OfferResult[], suggestions: ProductSuggestionResult[] = []) {
    if (offers.length === 0) {
        if (suggestions.length === 0) {
            return `\u{1F50E} N\u00e3o encontrei ofertas para \"${searchTerm}\".`;
        }

        return [
            `\u{1F50E} N\u00e3o encontrei ofertas para \"${searchTerm}\".`,
            "",
            "Talvez voc\u00ea encontre algo buscando por:",
            ...suggestions.map((suggestion) => `\u2022 ${suggestion.produto}`),
        ].join("\n");
    }

    const uniqueCities = [...new Set(offers.map((offer) => offer.cidade).filter(Boolean))];
    const locationSuffix = uniqueCities.length === 1 ? ` em ${uniqueCities[0]}` : "";
    const resultLabel = offers.length === 1 ? "oferta" : "ofertas";

    const lines = [`\u{1F50E} Encontrei ${offers.length} ${resultLabel} para *\"${searchTerm}\"*${locationSuffix}:`];

    offers.forEach((offer, index) => {
        const position = getPositionEmoji(index);
        const storeEmoji = getStoreTypeEmoji(offer.tipo_estabelecimento);
        const location = offer.bairro ? `${offer.bairro}` : offer.cidade;

        lines.push(
            "",
            `${position} ${offer.produto} - *${formatCurrency(offer.preco)}*`,
            `${storeEmoji} ${offer.estabelecimento}${location ? ` (${location})` : ""}`,
        );

        if (offer.logradouro) {
            lines.push(`\u{1F4CD} ${offer.logradouro}`);
        }

        if (offer.observacao) {
            lines.push(`\u{1F4A1} ${offer.observacao}`);
        }

        if (offer.validade_fim) {
            lines.push(`\u{1F4C5} Valido at\u00e9: ${formatDate(offer.validade_fim)}`);
        }
    });

    return lines.join("\n");
}
