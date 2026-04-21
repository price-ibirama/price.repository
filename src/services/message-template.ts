export function wrapBetaMessage(...content: string[]) {
    const year = new Date().getFullYear();

    return [
        "_[Ferramenta em fase BETA]_",
        "",
        ...content,
        "",
        `_${"~ Price, " + year}_`,
    ].join("\n");
}
