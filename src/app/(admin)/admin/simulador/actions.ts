"use server";

import { randomUUID } from "node:crypto";
import { isLocalDevelopment } from "@/lib/admin/development";
import { requireAdmin } from "@/lib/admin/auth";
import {
  processIncomingWhatsappMessage,
  type WhatsappMessageClient,
} from "@/services/webhook-processor";
import type { IncomingWhatsappTextMessage } from "@/services/webhook-types";
import z4 from "zod/v4";

const simulateWhatsappMessageSchema = z4.object({
  message: z4.string().trim().min(1, "Digite uma mensagem.").max(500, "Digite no máximo 500 caracteres."),
});

export type CapturedSimulatorEvent = {
  type: "read" | "typing" | "sendText";
  label: string;
  content?: string;
};

export type SimulateWhatsappMessageResult =
  | {
      ok: true;
      data: {
        events: CapturedSimulatorEvent[];
        messageId: string;
        responseText: string;
        timestamp: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

export async function simulateWhatsappMessage(input: {
  message: string;
}): Promise<SimulateWhatsappMessageResult> {
  await requireAdmin();

  if (!isLocalDevelopment()) {
    return {
      ok: false,
      error: "Simulador disponível apenas em desenvolvimento local.",
    };
  }

  const parsedInput = simulateWhatsappMessageSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      ok: false,
      error: parsedInput.error.issues[0]?.message ?? "Mensagem inválida.",
    };
  }

  const events: CapturedSimulatorEvent[] = [];
  const messageId = `admin-simulator-${Date.now()}-${randomUUID()}`;
  const timestamp = new Date().toISOString();

  const whatsappClient: WhatsappMessageClient = {
    async markAsRead() {
      events.push({
        type: "read",
        label: "Mensagem marcada como lida",
      });
    },
    async sendTypingIndicator() {
      events.push({
        type: "typing",
        label: "Indicador de digitação enviado",
      });
    },
    async sendText({ content }) {
      events.push({
        type: "sendText",
        label: "Resposta enviada",
        content,
      });
    },
  };

  const message: IncomingWhatsappTextMessage = {
    id: messageId,
    from: "admin-simulator",
    timestamp: String(Math.floor(Date.now() / 1000)),
    type: "text",
    text: {
      body: parsedInput.data.message,
    },
  };

  await processIncomingWhatsappMessage(message, { whatsappClient });

  const responseText = [...events].reverse().find((event) => event.type === "sendText")?.content;

  return {
    ok: true,
    data: {
      events,
      messageId,
      responseText: responseText ?? "Nenhuma resposta foi capturada.",
      timestamp,
    },
  };
}
