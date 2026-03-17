import { env } from "@/config/env";

type WhatsappChatMessagePayload = {
    content: string
}
export class WhatsappChat {
    constructor(
        private appPhoneId: string,
        private phoneId: string
    ) { }

    async message({ content }: WhatsappChatMessagePayload) {
        const url = new URL(`https://graph.facebook.com/v24.0/${this.appPhoneId}/messages`);

        console.info(JSON.stringify({
            url,
            token: env.META_WHATSAPP_TOKEN,
            body: {
                messaging_product: "whatsapp",
                to: this.phoneId,
                type: "text",
                text: { body: content }
            }
        }))

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.META_WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: this.phoneId,
                type: "text",
                text: { body: content }
            })
        });

        if (!res.ok) {
            console.info({
                res
            })
        }
    }
}