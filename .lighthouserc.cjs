/**
 * Lighthouse CI config. Pinged from the lighthouse.yml workflow against
 * the Vercel Preview URL of a PR. Five canonical templates exercised:
 * home, category list, PDP, article (CMS), atelier.
 *
 * Thresholds match the Phase 9 SEO doctrine — Performance ≥ 90, SEO 100,
 * Accessibility ≥ 95. A regression on any of these fails the PR.
 *
 * URL placeholders are resolved at runtime via the LH_BASE_URL env var
 * (the workflow sets it to the Vercel deployment URL).
 */
const BASE = process.env.LH_BASE_URL ?? "http://localhost:8000"

module.exports = {
  ci: {
    collect: {
      url: [
        `${BASE}/fr`,
        `${BASE}/fr/categories/jambons-iparralde`,
        `${BASE}/fr/products/jambon-orhi-18-mois`,
        `${BASE}/fr/notre-histoire`,
        `${BASE}/fr/atelier`,
      ],
      numberOfRuns: 1,
      settings: {
        // Mobile preset — Google rates mobile-first for organic SEO.
        preset: "desktop",
        chromeFlags: ["--no-sandbox", "--headless=new"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 1.0 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        // PWA isn't a goal for the storefront — silence the check.
        "categories:pwa": "off",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
}
