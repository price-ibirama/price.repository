import { env } from "@/config/env";
import { processIncomingWhatsappMessage, processIncomingWhatsappStatus } from "@/services/webhook-processor";
import { StatusCodes } from "http-status-codes";
import { NextResponse, type NextRequest } from "next/server";
import z4 from "zod/v4";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const messageSchema = z4.looseObject({
    from: z4.string(),
    id: z4.string(),
    timestamp: z4.string(),
    type: z4.string(),
    text: z4.object({
        body: z4.string(),
    }).optional(),
});

const statusSchema = z4.looseObject({
    id: z4.string(),
    status: z4.string(),
    recipient_id: z4.string().optional(),
});

const whatsappWebhookPayloadSchema = z4.object({
    object: z4.literal("whatsapp_business_account"),
    entry: z4.array(
        z4.looseObject({
            id: z4.string(),
            changes: z4.array(
                z4.looseObject({
                    field: z4.string(),
                    value: z4.looseObject({
                        messaging_product: z4.literal("whatsapp").optional(),
                        metadata: z4.object({
                            display_phone_number: z4.string().optional(),
                            phone_number_id: z4.string(),
                        }),
                        contacts: z4.array(
                            z4.looseObject({
                                profile: z4.object({ name: z4.string() }).optional(),
                                wa_id: z4.string(),
                            })
                        ).optional(),
                        messages: z4.array(messageSchema).optional(),
                        statuses: z4.array(statusSchema).optional(),
                    }),
                })
            ),
        })
    ),
});

export async function GET(request: NextRequest) {
    const mode = request.nextUrl.searchParams.get("hub.mode");
    const challenge = request.nextUrl.searchParams.get("hub.challenge");
    const verifyToken = request.nextUrl.searchParams.get("hub.verify_token");

    if (mode !== "subscribe" || !challenge || verifyToken !== env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        console.error("WEBHOOK VERIFICATION FAIL");
        return new NextResponse(null, { status: StatusCodes.FORBIDDEN });
    }

    console.info("WEBHOOK VERIFIED");
    return new NextResponse(challenge, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const payload = whatsappWebhookPayloadSchema.safeParse(await request.json());

    if (!payload.success) {
        return NextResponse.json(
            {
                error: "Invalid WhatsApp webhook payload",
                issues: payload.error.issues,
            },
            { status: StatusCodes.BAD_REQUEST }
        );
    }

    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    console.info(`Webhook received ${timestamp} with payload`, JSON.stringify(payload.data, null, 4));

    for (const entry of payload.data.entry) {
        for (const change of entry.changes) {
            const value = change.value;
            const phoneNumberId = value.metadata.phone_number_id;

            if (phoneNumberId !== env.META_WHATSAPP_PHONE_NUMBER_ID) {
                console.info(`Phone number id received (${phoneNumberId}) is unrecognized, skipping.`);
                continue;
            }

            for (const status of value.statuses ?? []) {
                await processIncomingWhatsappStatus(status);
            }

            for (const message of value.messages ?? []) {
                await processIncomingWhatsappMessage(message);
            }
        }
    }

    return new NextResponse(null, { status: StatusCodes.OK });
}
