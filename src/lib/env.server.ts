import "server-only";

/** Server-only secrets. Never import this file from a client component. */
export const serverEnv = {
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ipHashSalt: process.env.IP_HASH_SALT || "",
  cronSecret: process.env.CRON_SECRET || "",
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || "",
  amazon: {
    credentialId: process.env.AMAZON_CREATORS_CREDENTIAL_ID || "",
    credentialSecret: process.env.AMAZON_CREATORS_CREDENTIAL_SECRET || "",
    credentialVersion: process.env.AMAZON_CREATORS_CREDENTIAL_VERSION || "3.2",
    tokenUrl: process.env.AMAZON_CREATORS_TOKEN_URL || "https://api.amazon.co.uk/auth/o2/token",
    apiBaseUrl: (process.env.AMAZON_CREATORS_API_BASE_URL || "https://creatorsapi.amazon").replace(/\/+$/, ""),
    marketplace: process.env.AMAZON_CREATORS_MARKETPLACE || "www.amazon.in",
    partnerTag: process.env.AMAZON_PARTNER_TAG || "",
  },
  flipkart: {
    affiliateId: process.env.FLIPKART_AFFILIATE_ID || "",
    affiliateToken: process.env.FLIPKART_AFFILIATE_TOKEN || "",
    apiBaseUrl: (process.env.FLIPKART_API_BASE_URL || "https://affiliate-api.flipkart.net").replace(/\/+$/, ""),
  },
  newsletter: {
    provider: (process.env.NEWSLETTER_PROVIDER || "none") as "none" | "brevo" | "mailchimp",
    brevoApiKey: process.env.BREVO_API_KEY || "",
    brevoListId: process.env.BREVO_LIST_ID || "",
    mailchimpApiKey: process.env.MAILCHIMP_API_KEY || "",
    mailchimpServerPrefix: process.env.MAILCHIMP_SERVER_PREFIX || "",
    mailchimpAudienceId: process.env.MAILCHIMP_AUDIENCE_ID || "",
  },
};

export function isServiceRoleConfigured(): boolean {
  return Boolean(serverEnv.supabaseSecretKey);
}
