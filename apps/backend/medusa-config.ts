import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.length === 0) {
    throw new Error(
      `[medusa-config] Missing required environment variable: ${name}. ` +
        `Copy apps/backend/.env.example to apps/backend/.env and fill it in.`
    )
  }
  return value
}

function meilisearchPluginConfig() {
  return {
    resolve: "@rokmohar/medusa-plugin-meilisearch",
    options: {
      config: {
        host: process.env.MEILISEARCH_HOST ?? "http://localhost:7700",
        apiKey: process.env.MEILISEARCH_API_KEY ?? "",
      },
      settings: {
        products: {
          type: "products",
          enabled: true,
          fields: [
            "id",
            "title",
            "subtitle",
            "description",
            "handle",
            "thumbnail",
            "variant_sku",
            "tags",
            "categories.id",
            "categories.handle",
            "categories.name",
          ],
          indexSettings: {
            searchableAttributes: [
              "title",
              "subtitle",
              "description",
              "variant_sku",
            ],
            displayedAttributes: [
              "id",
              "handle",
              "title",
              "subtitle",
              "description",
              "thumbnail",
              "categories",
            ],
            filterableAttributes: ["id", "handle", "categories.handle", "tags"],
            rankingRules: [
              "words",
              "typo",
              "proximity",
              "attribute",
              "sort",
              "exactness",
            ],
          },
          primaryKey: "id",
        },
        categories: {
          type: "categories",
          enabled: true,
          fields: [
            "id",
            "name",
            "description",
            "handle",
            "is_active",
            "parent_category_id",
          ],
          indexSettings: {
            searchableAttributes: ["name", "description"],
            displayedAttributes: [
              "id",
              "name",
              "description",
              "handle",
              "parent_category_id",
            ],
            filterableAttributes: [
              "id",
              "handle",
              "is_active",
              "parent_category_id",
            ],
          },
          primaryKey: "id",
        },
      },
    },
  }
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: requireEnv("DATABASE_URL"),
    http: {
      storeCors: requireEnv("STORE_CORS"),
      adminCors: requireEnv("ADMIN_CORS"),
      authCors: requireEnv("AUTH_CORS"),
      jwtSecret: requireEnv("JWT_SECRET"),
      cookieSecret: requireEnv("COOKIE_SECRET"),
    },
  },
  modules: [
    { resolve: "./src/modules/pages" },
    { resolve: "./src/modules/catalog" },
    { resolve: "./src/modules/redirects" },
    { resolve: "./src/modules/faq" },
    { resolve: "./src/modules/contact" },
    { resolve: "./src/modules/wishlist" },
    { resolve: "./src/modules/invoice" },
    { resolve: "./src/modules/gdpr" },
    // Payment module: registers the Stripe provider when STRIPE_API_KEY is
    // set. Without the env var we keep the default provider so dev / CI
    // doesn't break — checkout will surface "no payment method available".
    ...(process.env.STRIPE_API_KEY
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: process.env.STRIPE_API_KEY,
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                    capture: true,
                    automatic_payment_methods: true,
                  },
                },
              ],
            },
          },
        ]
      : []),
    // Custom fulfillment providers: Chronofresh (cold chain) + Colissimo
    // (ambient). Both ship in mock mode by default (env CHRONOFRESH_API_KEY
    // / COLISSIMO_API_KEY unset → grille tarifaire locale only, no external
    // API calls). Wiring real APIs is post-launch when commercial contracts
    // are signed.
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          { resolve: "@medusajs/medusa/fulfillment-manual", id: "manual" },
          {
            resolve: "./src/modules/fulfillment-chronofresh",
            id: "chronofresh",
          },
          {
            resolve: "./src/modules/fulfillment-colissimo",
            id: "colissimo",
          },
        ],
      },
    },
  ],
  plugins: [
    {
      resolve: "medusa-ai-assistant",
      options: {
        defaultModel:
          process.env.ASSISTANT_DEFAULT_MODEL ?? "claude-sonnet-4-6",
        maxTokens: process.env.ASSISTANT_MAX_TOKENS
          ? Number(process.env.ASSISTANT_MAX_TOKENS)
          : 4096,
      },
    },
    // MeiliSearch plugin only registered when a host is configured. This
    // keeps CI (and any env without Meili running) from crashing on every
    // product save. The plugin auto-indexes via its own subscribers.
    ...(process.env.MEILISEARCH_HOST ? [meilisearchPluginConfig()] : []),
  ],
})
