/**
 * Schema.org Recipe — used on /[countryCode]/recettes/[slug] pages
 * (Phase 10). Optional structured fields (ingredients, instructions,
 * nutrition) are pulled from `page.metadata.recipe` when present;
 * otherwise the schema falls back to a minimal but still-valid shape
 * Google accepts.
 */

export interface RecipeSchemaInput {
  url: string
  name: string
  description?: string | null
  image?: string | null
  date_published?: string | null
  /** "PT30M" ISO 8601 duration; left as-is if already in that form. */
  prep_time?: string | null
  cook_time?: string | null
  total_time?: string | null
  /** Number of servings, e.g. "4 personnes". */
  recipe_yield?: string | null
  recipe_category?: string | null
  recipe_cuisine?: string | null
  /** Ordered ingredient strings — Google requires plain strings. */
  ingredients?: string[]
  /** Ordered step strings — Google accepts HowToStep with `text`. */
  steps?: string[]
  author?: { name: string; url?: string } | null
}

export function recipeSchema(input: RecipeSchemaInput) {
  const steps = input.steps && input.steps.length > 0 ? input.steps : null
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: input.name,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    url: input.url,
    datePublished: input.date_published ?? undefined,
    prepTime: input.prep_time ?? undefined,
    cookTime: input.cook_time ?? undefined,
    totalTime: input.total_time ?? undefined,
    recipeYield: input.recipe_yield ?? undefined,
    recipeCategory: input.recipe_category ?? "Charcuterie & accompagnements",
    recipeCuisine: input.recipe_cuisine ?? "Basque",
    recipeIngredient:
      input.ingredients && input.ingredients.length > 0
        ? input.ingredients
        : undefined,
    recipeInstructions: steps
      ? steps.map((text, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text,
        }))
      : undefined,
    author: input.author
      ? {
          "@type": "Person",
          name: input.author.name,
          url: input.author.url,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Maison Lehena",
      logo: {
        "@type": "ImageObject",
        url: "https://lehena.fr/logo.png",
      },
    },
  }
}
