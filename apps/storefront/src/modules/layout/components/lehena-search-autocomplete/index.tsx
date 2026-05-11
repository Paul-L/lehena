"use client"

import { LhArrow, LhSearch } from "@modules/common/components/lehena/icons"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"

interface SearchHit {
  id: string
  handle: string
  title?: string
  name?: string
  subtitle?: string
}

interface AutocompletePayload {
  products: SearchHit[]
  categories: SearchHit[]
}

interface Props {
  /** Called when the user confirms/picks anything — useful to close the drawer. */
  onPick?: () => void
}

const DEFAULT_SUGGESTIONS = [
  "Jambon Orhi",
  "Patxaran",
  "Coffret cadeau",
  "Chorizo",
  "Piment d'Espelette",
  "Axoa",
]

export function LehenaSearchAutocomplete({ onPick }: Props) {
  const router = useRouter()
  const params = useParams<{ countryCode?: string }>()
  const countryCode = params?.countryCode ?? "fr"

  const [value, setValue] = useState("")
  const [data, setData] = useState<AutocompletePayload | null>(null)
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const q = value.trim()
    if (debounce.current) clearTimeout(debounce.current)
    if (q.length < 2) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const json = (await res.json()) as AutocompletePayload
        setData(json)
      } catch {
        setData({ products: [], categories: [] })
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [value])

  const navigate = (path: string) => {
    onPick?.()
    router.push(path)
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = value.trim()
    if (q.length === 0) return
    navigate(`/${countryCode}/recherche?q=${encodeURIComponent(q)}`)
  }

  const showResults =
    data !== null && (data.products.length > 0 || data.categories.length > 0)
  const showEmpty =
    data !== null &&
    data.products.length === 0 &&
    data.categories.length === 0 &&
    value.trim().length >= 2 &&
    !loading

  return (
    <div>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", alignItems: "center", gap: 16 }}
      >
        <LhSearch size={22} />
        <input
          /* eslint-disable-next-line jsx-a11y/no-autofocus */
          autoFocus
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Jambon Orhi, patxaran, axoa…"
          aria-label="Recherche dans toute la maison"
          style={{
            flex: 1,
            border: 0,
            background: "transparent",
            fontFamily: "var(--serif-display)",
            fontSize: "clamp(20px, 4.5vw, 28px)",
            outline: "none",
            color: "var(--ink)",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          aria-label="Voir tous les résultats"
          className="mono"
          style={{
            color: "var(--ink-mute)",
            fontSize: 11,
            letterSpacing: "0.1em",
          }}
        >
          Tous les résultats →
        </button>
      </form>

      {/* Default suggestions when input is empty */}
      {value.trim().length < 2 ? (
        <div
          className="lh-no-scrollbar"
          style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {DEFAULT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              onClick={() => setValue(s)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {/* Live results */}
      {showResults ? (
        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 32,
            alignItems: "start",
          }}
        >
          {data!.products.length > 0 ? (
            <div>
              <div
                className="eyebrow"
                style={{ color: "var(--ink-mute)", marginBottom: 10 }}
              >
                Produits
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {data!.products.slice(0, 5).map((p) => (
                  <li
                    key={p.id}
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/${countryCode}/products/${p.handle}`)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        padding: "12px 0",
                        fontFamily: "var(--serif)",
                        fontSize: 16,
                        color: "var(--ink)",
                        textAlign: "left",
                        background: "transparent",
                      }}
                    >
                      <span>{p.title}</span>
                      <LhArrow size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data!.categories.length > 0 ? (
            <div>
              <div
                className="eyebrow"
                style={{ color: "var(--ink-mute)", marginBottom: 10 }}
              >
                Catégories
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {data!.categories.slice(0, 3).map((c) => (
                  <li
                    key={c.id}
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/${countryCode}/categories/${c.handle}`)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 0",
                        fontFamily: "var(--serif)",
                        fontSize: 15,
                        color: "var(--ink)",
                        textAlign: "left",
                        background: "transparent",
                      }}
                    >
                      <span>{c.name}</span>
                      <LhArrow size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {showEmpty ? (
        <div
          style={{
            marginTop: 22,
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            color: "var(--ink-mute)",
            fontSize: 15,
          }}
        >
          Rien à cette adresse. Essayez « jambon » ou « patxaran ».
        </div>
      ) : null}
    </div>
  )
}
