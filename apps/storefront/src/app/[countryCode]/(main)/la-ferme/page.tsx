import { LhArrow } from "@modules/common/components/lehena/icons"
import { Photo } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RevealInit from "@modules/home/components/lehena/reveal-init"
import { buildMetadata } from "@lib/seo/metadata"

import type { Metadata } from "next"

export const metadata: Metadata = buildMetadata({
  title: "La ferme — De la ferme à l'assiette",
  description:
    "Bénat Petit, Maître Artisan Charcutier, élève ses porcs Duroc en Pays Basque. Sans nitrite, sans additif — du bon, avec du local.",
})

const partners = [
  {
    kicker: "Porcs Duroc",
    ferme: "Ferme Iratzia",
    lieu: "Lasse · près de Saint-Jean-Pied-de-Port",
    eleveur: "Julien Guénard",
    img: "/images/ferme-iratzia.webp",
    alt: "Porcs Duroc élevés en plein air à la Ferme Iratzia, Pays Basque",
    body: "Naisseur et éleveur de porcs. Nos porcs sont nourris à volonté, exclusivement à base de céréales tracées sans OGM (<0,9 %). Les traitements antibiotiques sont réduits au strict nécessaire, le plus souvent remplacés par de l'homéopathie. Chez nous, ce n'est pas l'âge qui déclenche l'abattage mais le poids : le porc prend le temps de grandir à son rythme.",
    tags: ["Race Duroc", "Sans OGM", "Plein air", "Glands & châtaignes"],
  },
  {
    kicker: "Brebis Manech Bü Beltza",
    ferme: "Ferme Ainty",
    lieu: "Sunharette · vallée d'Orhi",
    eleveur: "Belle-famille Petit",
    img: "/images/ferme-ainty.webp",
    alt: "Pâturage de la Ferme Ainty dans la vallée d'Orhi, Pays Basque",
    body: "Un petit troupeau de brebis Manech Tête Noire (Bü Beltza), race ovine originaire des montagnes du Pays Basque. Le troupeau est transhumant — l'été, elles sont au cayolar d'Ibarrondua au pied du pic d'Orhi. Les agneaux sont nourris exclusivement au lait de brebis, par tétée au pis.",
    tags: ["Manech Tête Noire", "Transhumance", "AOC Ossau-Iraty", "Pâturage 8 mois"],
  },
] as const

const timeline = [
  ["2010", "Reprise de la gérance de HOBERENA"],
  ["2016 → 2018", "Médaillé · Concours Général Agricole de Paris"],
  ["2020", "Prix d'Excellence du Concours Général"],
  ["2025", "Médaillé · Pâté Basque & Terrine Campagnarde Bazkaïa"],
] as const

const steps = [
  { n: "01", t: "Naissance", d: "Ferme Iratzia · Julien Guénard. Race Duroc, sélection rigoureuse." },
  { n: "02", t: "Élevage plein air", d: "Vingt fermes en Iparralde. Céréales sans OGM, glands, châtaignes." },
  { n: "03", t: "Salaison", d: "Atelier de Laguinge. Sel sec, gestes hérités, zéro additif." },
  { n: "04", t: "Affinage 15–24 mois", d: "Séchoir naturel, air des Pyrénées. Maturation lente." },
] as const

const stats = [
  ["0", "Nitrite ajouté"],
  ["0", "Additif chimique"],
  ["100%", "Céréales sans OGM"],
  ["20+", "Fermes partenaires"],
] as const

export default function LaFerme() {
  return (
    <main className="lh">
      <RevealInit />

      {/* HERO — éditorial split */}
      <section style={{ padding: "80px 0 64px", borderBottom: "1px solid var(--line)" }}>
        <div className="lh-wrap">
          <div className="eyebrow" style={{ marginBottom: 24, color: "var(--ink-mute)", display: "flex", gap: 8 }}>
            <LocalizedClientLink href="/" style={{ color: "var(--ink-mute)" }}>
              Maison
            </LocalizedClientLink>
            <span>/</span>
            <span style={{ color: "var(--ink)" }}>La ferme</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 80,
              alignItems: "end",
            }}
          >
            <div>
              <div className="eyebrow" style={{ color: "var(--rouge)", marginBottom: 20 }}>
                Ma devise est de faire
              </div>
              <h1
                className="serif-display"
                style={{
                  fontSize: "clamp(56px, 8vw, 120px)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.025em",
                  margin: 0,
                }}
              >
                Du <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>bon</em>
                <br />
                avec du local.
              </h1>
            </div>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                lineHeight: 1.6,
                color: "var(--ink-soft)",
                paddingBottom: 12,
              }}
            >
              Nichée au cœur du Sud-Ouest, la Maison Lehena regorge de trésors culinaires aux saveurs incomparables.
              L'aventure a démarré pour <em>Bénat Petit</em> en avril 2019. Lassé par la filière de la viande centrée
              sur les profits et l'opacité sur les méthodes de production, Bénat décide de lancer sa propre
              exploitation : <em>Lehena</em>, qui signifie « le Premier » en basque, voit le jour.
            </p>
          </div>
        </div>
      </section>

      {/* IMAGE PLEINE LARGEUR */}
      <section className="reveal">
        <div style={{ width: "100%", height: "clamp(380px, 60vh, 620px)" }}>
          <Photo
            src="/images/ferme-hero.webp"
            alt="Bénat Petit auprès de ses porcs Duroc en plein air, collines du Pays Basque"
            priority
            sizes="100vw"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </section>

      {/* MAÎTRE ARTISAN — portrait éditorial */}
      <section
        className="reveal"
        style={{ padding: "120px 0", borderTop: "1px solid var(--line)" }}
      >
        <div
          className="lh-wrap"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 80, alignItems: "start" }}
        >
          <div style={{ position: "sticky", top: 100 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>01 — Le geste</div>
            <h2
              className="serif-display"
              style={{
                fontSize: "clamp(40px, 5vw, 64px)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Maître artisan
              <br />
              <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>charcutier.</em>
            </h2>
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
              {timeline.map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    gap: 16,
                    padding: "10px 0",
                    borderTop: "1px solid var(--line)",
                    fontSize: 13,
                  }}
                >
                  <span className="mono" style={{ color: "var(--rouge)" }}>{k}</span>
                  <span style={{ fontFamily: "var(--serif)", color: "var(--ink-soft)" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 18,
              lineHeight: 1.65,
              color: "var(--ink)",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <p
              style={{
                fontSize: 26,
                lineHeight: 1.35,
                fontStyle: "italic",
                color: "var(--ink)",
                margin: 0,
                fontFamily: "var(--serif-display)",
              }}
            >
              « J'aime cuisiner sainement, et surtout, j'aime manger ce que je cuisine. »
            </p>
            <p style={{ margin: 0 }}>
              Je fais de la charcuterie en conserves au sein de la société{" "}
              <strong style={{ fontWeight: 500 }}>HOBERENA</strong>, dont j'ai repris la gérance en 2010, après y
              avoir travaillé pendant treize ans. À partir des porcs de Julien, j'ai travaillé de nouvelles recettes
              de pâtés et terrines que je présente au Concours Général Agricole de Paris.
            </p>
            <p style={{ margin: 0 }}>
              Ma démarche se veut naturelle : sans colorant, exhausteur de goût ou additif. Tous ces produits sont
              inutiles si la matière première est de qualité — et c'est bien le cas ici. Le résultat n'a pas tardé :
              nous avons remporté les concours en <strong style={{ fontWeight: 500 }}>2016, 2017, 2018 et 2025</strong>{" "}
              avec notre Pâté Basque et notre Terrine Campagnarde de la gamme <em>Bazkaïa</em>.
            </p>
            <p style={{ margin: 0 }}>
              En 2020, j'ai eu l'honneur de recevoir le{" "}
              <strong style={{ fontWeight: 500 }}>Prix d'Excellence</strong>, qui récompense le savoir-faire du
              charcutier ayant obtenu les meilleurs résultats sur les trois années précédentes.
            </p>
          </div>
        </div>
      </section>

      {/* SANS NITRITE — bloc statement contrasté */}
      <section
        className="reveal"
        style={{ background: "var(--bg-deep)", color: "var(--bg)", padding: "120px 0" }}
      >
        <div
          className="lh-wrap"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80, alignItems: "start" }}
        >
          <div>
            <div className="eyebrow" style={{ color: "var(--argile)", marginBottom: 18 }}>
              02 — Le parti pris
            </div>
            <h2
              className="serif-display"
              style={{
                fontSize: "clamp(40px, 5vw, 64px)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Sans <em style={{ fontStyle: "italic", color: "var(--argile)" }}>nitrite.</em>
              <br />
              Sans compromis.
            </h2>
          </div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 18,
              lineHeight: 1.65,
              color: "rgba(250,249,247,0.85)",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <p style={{ margin: 0 }}>
              J'ai fait le choix de ne pas utiliser de nitrite, nitrate, additif ou conservateur chimique. Je pense
              qu'ils ne sont pas indispensables sous certaines conditions, et surtout, qu'ils présentent un risque non
              négligeable pour la santé.
            </p>
            <p style={{ margin: 0 }}>
              Pour s'en passer, la qualité de la viande est primordiale : il faut impérativement un porc fermier, qui
              a pris le temps de grandir, bien nourri, dans un environnement sans stress. Ce type d'élevage est
              primordial pour obtenir un pH et une composition permettant de se passer des nitrites — et autres E249,
              E250, E251 et E252.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 24,
                marginTop: 24,
                borderTop: "1px solid rgba(250,249,247,0.15)",
                paddingTop: 28,
              }}
            >
              {stats.map(([k, v]) => (
                <div key={v}>
                  <div
                    className="serif-display"
                    style={{ fontSize: 36, color: "var(--bg)", lineHeight: 1 }}
                  >
                    {k}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: "rgba(250,249,247,0.6)", marginTop: 8 }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GALERIE — atelier */}
      <section className="reveal" style={{ padding: "100px 0" }}>
        <div className="lh-wrap">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr",
              gap: 24,
              height: 520,
            }}
          >
            <Photo
              src="/images/ferme-sechoir.webp"
              alt="Jambon Lehena en cours d'affinage"
              sizes="(max-width: 768px) 100vw, 40vw"
              style={{ width: "100%", height: "100%" }}
            />
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 24 }}>
              <Photo
                src="/images/ferme-mains.webp"
                alt="Préparation à la main de la chair à charcuterie à l'atelier Lehena"
                sizes="(max-width: 768px) 100vw, 25vw"
                style={{ width: "100%", height: "100%" }}
              />
              <Photo
                src="/images/ferme-sel.webp"
                alt="Mise en bocal de la préparation, salaison au sel sec"
                sizes="(max-width: 768px) 100vw, 25vw"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 24 }}>
              <Photo
                src="/images/ferme-atelier.webp"
                alt="Hachage de la viande à l'atelier de charcuterie Lehena"
                sizes="(max-width: 768px) 100vw, 25vw"
                style={{ width: "100%", height: "100%" }}
              />
              <Photo
                src="/images/ferme-detail.webp"
                alt="Détail de charcuterie tranchée, gras persillé du porc Duroc"
                sizes="(max-width: 768px) 100vw, 25vw"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* LA MÉTHODE — split inversé */}
      <section
        className="reveal"
        style={{
          padding: "120px 0",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="lh-wrap"
          style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 80, alignItems: "start" }}
        >
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 18,
              lineHeight: 1.65,
              color: "var(--ink)",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <p
              style={{
                fontSize: 26,
                lineHeight: 1.35,
                fontStyle: "italic",
                color: "var(--ink)",
                margin: 0,
                fontFamily: "var(--serif-display)",
              }}
            >
              « Créer des conditions optimales pour une viande d'exception. »
            </p>
            <p style={{ margin: 0 }}>
              Pour réaliser un produit de charcuterie aux qualités gustatives exceptionnelles, Lehena mise sur
              l'élevage de la race porcine <strong style={{ fontWeight: 500 }}>Duroc</strong>. Laissés en liberté dans
              les prairies, les animaux sont traités avec respect — tout est mis en œuvre pour leur garantir un grand
              confort, une santé de fer et un bien-être tout au long de leur vie.
            </p>
            <p style={{ margin: 0 }}>
              Pour assurer la qualité optimale de la viande, les porcs sont nourris avec des céréales non traitées et
              sans OGM, issues de la propre culture d'exploitation : blé, orge et maïs. Ils sont élevés dans une
              vingtaine de fermes situées en Pays Basque Nord (<em>Iparralde</em>). Notre atelier d'affinage, lui, est à Laguinge, en Soule.
            </p>
          </div>
          <div style={{ position: "sticky", top: 100, textAlign: "right" }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>03 — La méthode</div>
            <h2
              className="serif-display"
              style={{
                fontSize: "clamp(40px, 5vw, 64px)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Une production
              <br />
              <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>artisanale.</em>
            </h2>
          </div>
        </div>
      </section>

      {/* LES PARTENAIRES */}
      <section className="reveal" style={{ padding: "120px 0" }}>
        <div className="lh-wrap">
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              marginBottom: 56,
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: 18 }}>04 — Les partenaires</div>
              <h2
                className="serif-display"
                style={{
                  fontSize: "clamp(40px, 5vw, 64px)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                Deux fermes,
                <br />
                <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>une même exigence.</em>
              </h2>
            </div>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 17,
                color: "var(--ink-soft)",
                maxWidth: 380,
                lineHeight: 1.55,
              }}
            >
              Toute la matière première vient de deux exploitations partenaires que nous connaissons depuis l'origine.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            {partners.map((f) => (
              <article
                key={f.ferme}
                style={{
                  border: "1px solid var(--line)",
                  padding: 32,
                  background: "var(--bg-elevated)",
                }}
              >
                <div style={{ marginBottom: 24, height: 280 }}>
                  <Photo
                    src={f.img}
                    alt={f.alt}
                    sizes="(max-width: 768px) 100vw, 45vw"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <div className="eyebrow" style={{ color: "var(--rouge)", marginBottom: 10 }}>
                  {f.kicker}
                </div>
                <h3
                  className="serif-display"
                  style={{
                    fontSize: 30,
                    lineHeight: 1.05,
                    letterSpacing: "-0.01em",
                    margin: "0 0 6px",
                  }}
                >
                  {f.ferme}
                </h3>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: 15,
                    color: "var(--ink-soft)",
                    marginBottom: 6,
                  }}
                >
                  {f.lieu}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--ink-mute)", marginBottom: 20 }}
                >
                  Éleveur · {f.eleveur}
                </div>
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 15.5,
                    lineHeight: 1.6,
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  {f.body}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 20 }}>
                  {f.tags.map((t) => (
                    <span key={t} className="chip" style={{ fontSize: 10 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DE LA FERME À L'ASSIETTE */}
      <section
        className="reveal"
        style={{
          background: "var(--bg-elevated)",
          padding: "120px 0",
          borderTop: "1px solid var(--line)",
        }}
      >
        <div className="lh-wrap-narrow" style={{ textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 24 }}>05 — Le fil rouge</div>
          <h2
            className="serif-display"
            style={{
              fontSize: "clamp(48px, 7vw, 96px)",
              lineHeight: 0.95,
              letterSpacing: "-0.025em",
              margin: "0 0 36px",
            }}
          >
            De la <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>ferme</em>
            <br />
            à l'<em style={{ fontStyle: "italic" }}>assiette.</em>
          </h2>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 19,
              lineHeight: 1.6,
              color: "var(--ink-soft)",
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            Élevés dans le respect des traditions, les porcs Duroc profitent d'une vie en plein air et d'une
            alimentation naturelle faite de glands et de châtaignes. Un mode d'élevage ancestral qui garantit une
            viande de caractère — rouge, persillée, riche en acide oléique reconnu pour ses effets préventifs sur le
            système cardio-vasculaire.
          </p>
        </div>

        <div className="lh-wrap" style={{ marginTop: 80 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
            {steps.map((s) => (
              <div key={s.n} style={{ borderTop: "1px solid var(--ink)", paddingTop: 18 }}>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--rouge)", marginBottom: 14 }}
                >
                  {s.n}
                </div>
                <div
                  className="serif-display"
                  style={{ fontSize: 24, lineHeight: 1.1, marginBottom: 10 }}
                >
                  {s.t}
                </div>
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 14,
                    color: "var(--ink-soft)",
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA boutique */}
      <section
        className="reveal"
        style={{ padding: "100px 0", borderTop: "1px solid var(--line)", textAlign: "center" }}
      >
        <div className="lh-wrap-narrow">
          <div className="eyebrow" style={{ marginBottom: 18, color: "var(--ink-mute)" }}>
            Goûter la maison
          </div>
          <h2
            className="serif-display"
            style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1, margin: "0 0 32px" }}
          >
            La boutique <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>Lehena.</em>
          </h2>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 17,
              color: "var(--ink-soft)",
              maxWidth: 540,
              margin: "0 auto 36px",
            }}
          >
            Le Sud-Ouest regorge de produits nobles et fins, travaillés avec l'envie de vous faire découvrir des
            saveurs incomparables.
          </p>
          <LocalizedClientLink href="/store" className="btn btn-rouge">
            Découvrir la boutique <LhArrow size={16} />
          </LocalizedClientLink>
        </div>
      </section>
    </main>
  )
}
