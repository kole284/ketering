import { z } from "zod";

const optionalUrl = z.string().trim().url().optional().or(z.literal("").transform(() => undefined));
const optionalString = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalInteger = z.coerce.number().int().positive().optional();

const envSchema = z.object({
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL je obavezan."),
  APP_URL: optionalUrl,
  CORS_ALLOWED_ORIGINS: z.string().trim().optional().default(""),
  ORDER_NOTIFICATION_PHONE: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
  EMAILJS_SERVICE_ID: optionalString,
  EMAILJS_TEMPLATE_ID: optionalString,
  EMAILJS_PUBLIC_KEY: optionalString,
  EMAILJS_PRIVATE_KEY: optionalString,
  TWILIO_ACCOUNT_SID: optionalString,
  TWILIO_AUTH_TOKEN: optionalString,
  TWILIO_FROM_NUMBER: optionalString,
  ORDER_RATE_LIMIT_WINDOW_MS: optionalInteger.default(60_000),
  ORDER_RATE_LIMIT_MAX: optionalInteger.default(20),
  ORDER_REQUEST_MAX_BYTES: optionalInteger.default(16_384),
  DEFAULT_ORDER_LEAD_TIME_MINUTES: optionalInteger.default(60),
  NEXT_ALLOWED_DEV_ORIGINS: z.string().trim().optional().default(""),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Neispravna server konfiguracija: ${message}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getOptionalServerEnv(): Partial<ServerEnv> {
  const parsed = envSchema.partial().safeParse(process.env);
  return parsed.success ? parsed.data : {};
}
