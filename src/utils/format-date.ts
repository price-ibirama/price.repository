export function formatDate(value?: string | null) {
    if (!value) {
        return "—";
    }

    const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
    }).format(date);
}
