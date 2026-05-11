import { LehenaSkeleton } from "@modules/common/components/lehena"
import { Frieze } from "@modules/common/components/lehena/primitives"

/**
 * Default Lehena loading state for routes under `(main)` that don't declare
 * their own loading.tsx. Per-route skeletons (cart, account, order) keep
 * priority. Phase 3+ will swap the cart/account/order skeletons to Lehena
 * tones as those screens get redesigned.
 */
export default function Loading() {
  return (
    <main
      className="lh-wrap"
      style={{
        padding: "80px 0",
        display: "flex",
        flexDirection: "column",
        gap: 48,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <LehenaSkeleton
          tone="paper"
          height={12}
          width={140}
          aria-label="Chargement de l'eyebrow"
        />
        <LehenaSkeleton
          tone="kraft"
          height={72}
          width="70%"
          aria-label="Chargement du titre"
        />
        <LehenaSkeleton
          tone="paper"
          height={18}
          width="50%"
          aria-label="Chargement du sous-titre"
        />
      </div>
      <Frieze color="var(--line-strong)" size={8} opacity={0.4} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 32,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <LehenaSkeleton
              tone={i % 2 === 0 ? "argile" : "kraft"}
              style={{ aspectRatio: "4 / 5" }}
              aria-label="Chargement d'un visuel"
            />
            <LehenaSkeleton tone="paper" height={14} width="60%" />
            <LehenaSkeleton tone="paper" height={22} width="80%" />
            <LehenaSkeleton tone="paper" height={14} width="40%" />
          </div>
        ))}
      </div>
    </main>
  )
}
