import type { GenericOAuthConfig } from "better-auth/plugins";
import { default as webPush } from "web-push";
import { z } from "zod";
const defaultSecret = "test-secret-hello-world-insecure";

export const IS_PROD = process.env["NODE_ENV"] === "production";

const ZOAuthConfig = z.array(
  z.object({
    /** display name */
    name: z.string(),

    /** Unique identifier for the OAuth provider */
    providerId: z.string(),
    /**
     * URL to fetch OAuth 2.0 configuration.
     * If provided, the authorization and token endpoints will be fetched from this URL.
     */
    discoveryUrl: z.string().optional(),
    /**
     * The expected issuer identifier for validation.
     * If not provided but discoveryUrl is set, it will be fetched from the discovery document.
     * When set, the callback validates that the `iss` parameter matches this value.
     * @see https://datatracker.ietf.org/doc/html/rfc9207
     */
    issuer: z.string().optional(),
    /**
     * When true, requires the `iss` parameter in callbacks if an issuer is configured.
     * This provides stricter security but may break with older OAuth servers
     * that don't support issuer identification.
     * @default false
     */
    requireIssuerValidation: z.boolean().optional(),
    /**
     * URL for the authorization endpoint.
     * Optional if using discoveryUrl.
     */
    authorizationUrl: z.string().optional(),
    /**
     * URL for the token endpoint.
     * Optional if using discoveryUrl.
     */
    tokenUrl: z.string().optional(),
    /**
     * URL for the user info endpoint.
     * Optional if using discoveryUrl.
     */
    userInfoUrl: z.string().optional(),
    /** OAuth client ID */
    clientId: z.string(),
    /** OAuth client secret */
    clientSecret: z.string().optional(),
    /**
     * Array of OAuth scopes to request.
     * @default []
     */
    scopes: z.array(z.string()).optional(),
    /**
     * Custom redirect URI.
     * If not provided, a default URI will be constructed.
     */
    redirectURI: z.string().optional(),
    /**
     * OAuth response type.
     * @default "code"
     */
    responseType: z.string().optional(),
    /**
     * The response mode to use for the authorization code request.
     */
    responseMode: z.enum(["query", "form_post"]).optional(),
    /**
     * Prompt parameter for the authorization request.
     * Controls the authentication experience for the user.
     */
    prompt: z
      .enum([
        "none",
        "login",
        "create",
        "consent",
        "select_account",
        "select_account consent",
        "login consent",
      ])
      .optional(),
    /**
     * Whether to use PKCE (Proof Key for Code Exchange)
     * @default false
     */
    pkce: z.boolean().optional(),
    /**
     * Access type for the authorization request.
     * Use "offline" to request a refresh token.
     */
    accessType: z.string().optional(),
    /**
     * Disable implicit sign up for new users. When set to true for the provider,
     * sign-in need to be called with with requestSignUp as true to create new users.
     */
    disableImplicitSignUp: z.boolean().optional(),
    /**
     * Disable sign up for new users.
     */
    disableSignUp: z.boolean().optional(),
    /**
     * Authentication method for token requests.
     * @default "post"
     */
    authentication: z.enum(["basic", "post"]).optional(),
    /**
     * Custom headers to include in the discovery request.
     * Useful for providers like Epic that require specific headers (e.g., Epic-Client-ID).
     */
    discoveryHeaders: z.record(z.string(), z.string()).optional(),
    /**
     * Custom headers to include in the authorization request.
     * Useful for providers like Qonto that require specific headers (e.g., X-Qonto-Staging-Token for local development).
     */
    authorizationHeaders: z.record(z.string(), z.string()).optional(),
    /**
     * Override user info with the provider info.
     *
     * This will update the user info with the provider info,
     * when the user signs in with the provider.
     * @default false
     */
    overrideUserInfo: z.boolean().optional(),
  }),
);

// @ts-expect-error type validation only
// oxlint-disable-next-line no-unused-vars
const testTypeIsValid = (
  input: Required<z.infer<typeof ZOAuthConfig>[number]>,
): Omit<
  Required<GenericOAuthConfig>,
  | "getToken"
  | "getUserInfo"
  | "mapProfileToUser"
  | "authorizationUrlParams"
  | "tokenUrlParams"
> => input;

const devOnlyDefault = <T extends z.ZodType>(
  type: T,
  defaultValue: z.output<T> extends undefined ? never : z.output<T>,
) => (IS_PROD ? type : type.default(defaultValue));

const DEV_VAPID_KEYS = webPush.generateVAPIDKeys();

const ZEnv = z.object({
  GIT_COMMIT_SHA: z.string().default("unknown"),

  LISTEN_HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().default(5174),
  PUBLIC_ORIGIN: devOnlyDefault(
    z.url({ protocol: /^https?$/ }),
    "http://localhost:5173",
  ),
  APP_NAME: z.string().default("Expenses"),

  BETTER_AUTH_CLI: IS_PROD ? z.undefined() : z.coerce.boolean().default(false),

  SMTP_HOST: devOnlyDefault(z.string(), "localhost"),
  SMTP_PORT: devOnlyDefault(z.coerce.number(), 1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: devOnlyDefault(z.email(), "expenses@example.com"),

  SECURE: z.coerce.boolean().default(IS_PROD),
  JWT_SECRET: devOnlyDefault(z.string().min(1), defaultSecret),
  OAUTH_PROVIDER_CONFIG: z
    .string()
    .pipe(
      z.preprocess((input, ctx) => {
        try {
          return JSON.parse(input);
        } catch (_) {
          ctx.issues.push({ code: "custom", message: "Invalid JSON", input });
          return z.NEVER;
        }
      }, ZOAuthConfig),
    )
    .default([]),
  VAPID_EMAIL: devOnlyDefault(z.email(), "nobody@example.com"),
  VAPID_PRIVATE_KEY: devOnlyDefault(
    z.string().min(1),
    DEV_VAPID_KEYS.privateKey,
  ),
  VAPID_PUBLIC_KEY: devOnlyDefault(z.string().min(1), DEV_VAPID_KEYS.publicKey),

  DATABASE_URL: devOnlyDefault(
    z.url(),
    "postgresql://postgres:postgres@localhost:5432/postgres",
  ),
  REDIS_URL: devOnlyDefault(z.url(), "redis://localhost:6379/0"),
  FRANKFURTER_BASE_URL: devOnlyDefault(
    z.url({ protocol: /^https?$/ }),
    "http://localhost:5200/",
  ),

  ENABLE_ADMIN: z.coerce.boolean().default(!IS_PROD),

  SENTRY_DSN: z.string().optional(),
});

export const NOTIFICATION_BULLMQ_QUEUE = "notifications";
export const TRANSACTION_SCHEDULE_BULLMQ_QUEUE = "transaction-schedules";
export const EMAIL_BULLMQ_QUEUE = "emails";

export const config = ZEnv.parse(process.env);
