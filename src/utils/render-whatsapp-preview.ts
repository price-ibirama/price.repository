const ansi = {
    reset: "\u001B[0m",
    bold: "\u001B[1m",
    italic: "\u001B[3m",
    strike: "\u001B[9m",
    dim: "\u001B[2m",
    cyan: "\u001B[36m",
    gray: "\u001B[90m",
};

function applyInlineFormatting(line: string) {
    return line
        .replace(/```([^`]+)```/g, `${ansi.cyan}$1${ansi.reset}`)
        .replace(/\*([^*]+)\*/g, `${ansi.bold}$1${ansi.reset}`)
        .replace(/_([^_]+)_/g, `${ansi.italic}$1${ansi.reset}`)
        .replace(/~([^~]+)~/g, `${ansi.strike}$1${ansi.reset}`);
}

export function renderWhatsappPreview(message: string) {
    const lines = message.split("\n");
    const renderedLines = lines.map((line) => `  ${applyInlineFormatting(line)}`);

    return [
        `${ansi.gray}Preview da resposta${ansi.reset}`,
        `${ansi.dim}-------------------${ansi.reset}`,
        ...renderedLines,
    ].join("\n");
}
