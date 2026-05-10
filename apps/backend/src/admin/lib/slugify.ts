/**
 * Lightweight slugify for page titles. Lowercases, normalizes accents,
 * replaces non-alphanumeric runs with a single hyphen, trims leading/
 * trailing hyphens. Matches the kebab-case regex enforced server-side
 * (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
