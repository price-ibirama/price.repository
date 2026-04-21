import { env } from "@/config/env";
import type { ChannelContext } from "@/services/channel-context";
import { renderWhatsappPreview } from "@/utils/render-whatsapp-preview";

type SendTextMessageOptions = {
    to: string;
    content: string;
};

export class WhatsappClient {
    constructor(private readonly context: ChannelContext) {}

    async markAsRead(messageId: string) {
        await this.dispatch({
            messaging_product: "whatsapp",
            status: "read",
            message_id: messageId,
        }, "markAsRead");
    }

    async sendTypingIndicator(messageId: string) {
        await this.dispatch({
            messaging_product: "whatsapp",
            status: "read",
            message_id: messageId,
            typing_indicator: {
                type: "text",
            },
        }, "sendTypingIndicator");
    }

    async sendText({ to, content }: SendTextMessageOptions) {
        await this.dispatch({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: content },
        }, "sendText");
    }

    private async dispatch(body: Record<string, unknown>, action: string) {
        if (this.context.deliveryMode === "mock") {
            console.info(`[mock:${this.context.channel}] ${action}`, JSON.stringify(body, null, 2));

            if (action === "sendText") {
                const content = typeof body.text === "object" && body.text && "body" in body.text
                    ? body.text.body
                    : "";

                if (typeof content === "string") {
                    console.info(renderWhatsappPreview(content));
                }
            }

            return;
        }

        if (!this.context.whatsappAccessToken) {
            throw new Error(`Missing WhatsApp access token for channel ${this.context.channel}`);
        }

        const url = new URL(`https://graph.facebook.com/v${env.META_WHATSAPP_API_VERSION}/${this.context.phoneNumberId}/messages`);
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.context.whatsappAccessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`WhatsApp API request failed (${res.status}): ${errorBody}`);
        }
    }
}
