import { randomUUID } from "node:crypto";
import { cancel, isCancel, outro, spinner, text } from "@clack/prompts";

import { env } from "@/config/env";
import { startApp } from "@/app";
import { processIncomingWhatsappMessage } from "@/services/webhook-processor";

async function main() {
    const app = await startApp();
    let shuttingDown = false;

    const shutdown = async () => {
        if (shuttingDown) {
            return;
        }

        shuttingDown = true;
        outro("Modo local encerrado.");
        await app.close();
        process.exit(0);
    };

    process.once("SIGINT", () => {
        shutdown().catch((error) => {
            console.error(error);
            process.exit(1);
        });
    });

    console.info("Digite a mensagem para simular o webhook da Meta.");

    let messageCount = 0;
    while (true) {
        const body = await text({
            message: "Mensagem recebida",
            placeholder: "ex.: cerveja",
            validate(value) {
                if (!value.trim()) {
                    return "Digite algum texto para processar.";
                }
            },
        });

        if (isCancel(body)) {
            cancel("Encerrando modo local.");
            await shutdown();
        }

        if (typeof body !== "string") {
            continue;
        }

        const trimmedBody = body.trim();

        if (!trimmedBody) {
            continue;
        }

        messageCount += 1;
        const processing = spinner();
        processing.start("Processando mensagem...");

        try {
            await processIncomingWhatsappMessage({
                id: `local-message-${Date.now()}-${messageCount}-${randomUUID()}`,
                from: env.META_WHATSAPP_PHONE_NUMBER_ID,
                timestamp: String(Date.now()),
                type: "text",
                text: {
                    body: trimmedBody,
                },
            });

            processing.stop("Mensagem processada.");
        } catch (error) {
            processing.stop("Falha ao processar mensagem.");
            console.error(error);
        }
    }
}

main().catch((error) => {
    outro("Modo local encerrado com erro.");
    console.error(error);
    process.exit(1);
});
