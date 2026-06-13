import z4 from "zod/v4";

export const baseEnvSchema = z4.object({
    PORT: z4.coerce.number().default(3000),
    META_WHATSAPP_WEBHOOK_VERIFY_TOKEN: z4.string(),
    META_WHATSAPP_PHONE_NUMBER_ID: z4.string(),
    META_GRAPH_API_VERSION: z4.string().default('25.0'),
    META_GRAPH_ACCESS_TOKEN: z4.string(),
    SUPABASE_URL: z4.url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z4.string().optional(),
    SUPABASE_SECRET_KEY: z4.string().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z4.url().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z4.string().optional(),
    MOCK_DELIVERY: z4.boolean().default(false),
});

const envSchema = z4.discriminatedUnion('NODE_ENV', [
    baseEnvSchema.partial({
        META_GRAPH_ACCESS_TOKEN: true,
        META_WHATSAPP_WEBHOOK_VERIFY_TOKEN: true,
        META_GRAPH_API_VERSION: true,
        SUPABASE_SERVICE_ROLE_KEY: true,
        SUPABASE_SECRET_KEY: true,
    }).extend({
        NODE_ENV: z4.literal('development')
    }),
    baseEnvSchema.extend({
        NODE_ENV: z4.literal('test')
    }),
    baseEnvSchema.extend({
        NODE_ENV: z4.literal('production')
    }),
]).transform((input) => {
    const supabaseUrl = input.SUPABASE_URL ?? input.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = input.SUPABASE_SERVICE_ROLE_KEY ?? input.SUPABASE_SECRET_KEY;

    if (!supabaseUrl) {
        throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
    }

    if (!supabaseServiceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required");
    }

    return {
        ...input,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
    };
})

export const env = envSchema.parse(process.env);

export type Env = z4.infer<typeof envSchema>;
