/**
 * <JsonLd> injects a schema.org JSON-LD `<script>` tag.
 *
 * Pure server component — never include this from a Client Component to keep
 * the script tag out of the React hydration mismatch path.
 */
interface JsonLdProps {
  schema: Record<string, unknown> | Record<string, unknown>[]
  /** Optional id for the script element (helpful when debugging). */
  id?: string
}

export function JsonLd({ schema, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      // Schemas are produced server-side from typed helpers; the payload never
      // contains user input, so the XSS surface is the same as inlining JSON.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
