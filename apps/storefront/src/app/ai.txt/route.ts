/**
 * ai.txt — Spawning's opt-in/opt-out standard (spawning.ai/ai-txt) for AI
 * training crawlers. Static, fixed policy.
 *
 * Lehena deliberately OPENS: being cited by ChatGPT / Perplexity for
 * "meilleur jambon sans nitrite" and cousin queries is a visibility asset,
 * so we allow crawling and training rather than blocking AI bots.
 */
export const dynamic = "force-static"
export const revalidate = false

const BODY = `# ai.txt — Maison Lehena (lehena.fr)
# Politique d'usage IA : ouverte. Voir /llms.txt pour la carte du site.

User-Agent: *
Allow: /

Content-Usage: crawl
Content-Usage: train-ai
Content-Usage: train-genai
`

export function GET(): Response {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
    },
  })
}
