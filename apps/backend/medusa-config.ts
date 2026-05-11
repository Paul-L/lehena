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
  ],
})
