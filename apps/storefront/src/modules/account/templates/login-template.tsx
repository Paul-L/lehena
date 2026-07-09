"use client"

import { login, requestMagicLink, signup } from "@lib/data/customer"
import LehenaField from "@modules/account/components/lehena-field"
import LehenaSubmitButton from "@modules/account/components/lehena-submit-button"
import { LhArrow, LhCheck } from "@modules/common/components/lehena/icons"
import { Photo } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState, useState, useTransition } from "react"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

type Step = "email" | "method"
type Method = "magic" | "password"

const REASSURANCE: readonly (readonly [string, string])[] = [
  ["Chronofresh", "24–48 h"],
  ["Frais de port offerts", "dès 50 €"],
  ["Sans nitrite", "Affinage 15 mois min."],
]

const LoginTemplate = () => {
  const [mode, setMode] = useState<LOGIN_VIEW>(LOGIN_VIEW.SIGN_IN)
  const [step, setStep] = useState<Step>("email")
  const [method, setMethod] = useState<Method>("magic")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [show, setShow] = useState(false)
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [magicErr, setMagicErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [magicPending, startMagic] = useTransition()

  const [loginMsg, loginAction] = useActionState(login, null)
  const [signupMsg, signupAction] = useActionState(signup, null)

  const isRegister = mode === LOGIN_VIEW.REGISTER

  const switchMode = (next: LOGIN_VIEW) => {
    setMode(next)
    setStep("email")
    setMethod("magic")
    setSent(false)
    setEmailErr(null)
    setMagicErr(null)
  }

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault()
    setEmailErr(null)
    if (!email || !email.includes("@")) {
      setEmailErr("Renseignez une adresse email valide.")
      return
    }
    if (isRegister && (!firstName || !lastName)) {
      setEmailErr("Renseignez votre nom et prénom.")
      return
    }
    setStep("method")
  }

  const sendMagicLink = () => {
    setMagicErr(null)
    startMagic(async () => {
      // En mode Register on transmet prénom/nom : le backend crée alors
      // le customer + auth identity avant d'émettre le magic-link. En mode
      // login classique, `meta` reste undefined → comportement historique
      // constant-time anti-énumération.
      const meta = isRegister
        ? { first_name: firstName, last_name: lastName }
        : undefined
      const res = await requestMagicLink(email, meta)
      if (res.success) {
        setSent(true)
      } else {
        setMagicErr(res.error ?? "Erreur inattendue.")
      }
    })
  }

  const tabs: { id: LOGIN_VIEW; label: string }[] = [
    { id: LOGIN_VIEW.SIGN_IN, label: "Se connecter" },
    { id: LOGIN_VIEW.REGISTER, label: "Créer un compte" },
  ]

  return (
    <main
      className="lh login-page"
      style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        minHeight: "calc(100vh - 73px)",
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .login-page { grid-template-columns: 1fr !important; }
          .login-visual { display: none !important; }
        }
      `}</style>

      {/* Volet éditorial — gauche */}
      <aside
        className="login-visual"
        style={{
          background: "var(--bg-deep)",
          color: "var(--bg)",
          padding: "80px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            className="eyebrow"
            style={{ color: "var(--argile)", marginBottom: 20 }}
          >
            Espace client
          </div>
          <h1
            className="serif-display"
            style={{
              fontSize: "clamp(48px, 5.5vw, 84px)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Bonjour.
          </h1>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 18,
              lineHeight: 1.55,
              color: "rgba(250,249,247,0.78)",
              marginTop: 28,
              maxWidth: 420,
            }}
          >
            Retrouvez vos commandes, vos adresses de livraison et vos
            préférences. Une seule maison, un seul accès.
          </p>
        </div>

        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        >
          <Photo
            src="/images/login-bg.webp"
            alt=""
            sizes="50vw"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            borderTop: "1px solid rgba(250,249,247,0.18)",
            paddingTop: 28,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {REASSURANCE.map(([k, v]) => (
            <div key={k}>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "rgba(250,249,247,0.55)",
                  marginBottom: 6,
                }}
              >
                {k}
              </div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 16,
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Formulaire — droite */}
      <section
        style={{
          padding: "80px clamp(28px, 6vw, 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Onglets */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginBottom: 40,
              borderBottom: "1px solid var(--line)",
            }}
          >
            {tabs.map((t) => {
              const isActive = mode === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => switchMode(t.id)}
                  style={{
                    padding: "12px 0",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: isActive ? "var(--ink)" : "var(--ink-mute)",
                    borderBottom: isActive
                      ? "1px solid var(--ink)"
                      : "1px solid transparent",
                    marginBottom: -1,
                    background: "transparent",
                    border: 0,
                    borderRadius: 0,
                  }}
                  aria-pressed={isActive}
                  data-testid={
                    t.id === LOGIN_VIEW.REGISTER ? "register-tab" : "signin-tab"
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Étape 1 : email */}
          {step === "email" && (
            <div data-testid="login-page">
              <h2
                className="serif-display"
                style={{
                  fontSize: 36,
                  lineHeight: 1,
                  margin: "0 0 12px",
                  letterSpacing: "-0.015em",
                }}
              >
                {isRegister ? (
                  <>
                    Faites{" "}
                    <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
                      connaissance
                    </em>
                    .
                  </>
                ) : (
                  <>
                    De retour à la{" "}
                    <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
                      maison
                    </em>
                    .
                  </>
                )}
              </h2>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 15,
                  color: "var(--ink-soft)",
                  margin: "0 0 36px",
                  lineHeight: 1.5,
                }}
              >
                {isRegister
                  ? "Un compte pour suivre vos commandes et accélérer vos prochains achats."
                  : "Saisissez votre email pour continuer."}
              </p>

              <form
                onSubmit={submitEmail}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                {isRegister && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <LehenaField
                      label="Prénom"
                      name="first_name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      required
                      data-testid="first-name-input"
                    />
                    <LehenaField
                      label="Nom"
                      name="last_name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      required
                      data-testid="last-name-input"
                    />
                  </div>
                )}
                <LehenaField
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  required
                  data-testid="email-input"
                />

                {emailErr && (
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: "var(--rouge)",
                      padding: "10px 12px",
                      border: "1px solid var(--rouge)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {emailErr}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-rouge"
                  style={{
                    justifyContent: "center",
                    padding: "16px 24px",
                    marginTop: 8,
                  }}
                  data-testid="continue-button"
                >
                  Continuer <LhArrow size={16} />
                </button>
              </form>

              <div
                style={{
                  marginTop: 28,
                  paddingTop: 28,
                  borderTop: "1px solid var(--line)",
                  textAlign: "center",
                  fontFamily: "var(--serif)",
                  fontSize: 14,
                  color: "var(--ink-soft)",
                }}
              >
                {isRegister ? (
                  <>
                    Déjà inscrit ?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode(LOGIN_VIEW.SIGN_IN)}
                      style={{
                        color: "var(--ink)",
                        textDecoration: "underline",
                      }}
                    >
                      Se connecter
                    </button>
                  </>
                ) : (
                  <>
                    Pas encore de compte ?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode(LOGIN_VIEW.REGISTER)}
                      style={{
                        color: "var(--ink)",
                        textDecoration: "underline",
                      }}
                      data-testid="register-button"
                    >
                      Créer un compte
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Étape 2 : méthode */}
          {step === "method" && !sent && (
            <div>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 24,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ← Modifier
              </button>
              <h2
                className="serif-display"
                style={{
                  fontSize: 32,
                  lineHeight: 1.05,
                  margin: "0 0 10px",
                  letterSpacing: "-0.015em",
                }}
              >
                Choisissez votre{" "}
                <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
                  méthode
                </em>
                .
              </h2>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 15,
                  color: "var(--ink-soft)",
                  margin: "0 0 32px",
                  lineHeight: 1.5,
                }}
              >
                Connecté à{" "}
                <strong style={{ fontWeight: 500, color: "var(--ink)" }}>
                  {email}
                </strong>
              </p>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* Option 1 : magic link (recommandé) */}
                <MethodCard
                  selected={method === "magic"}
                  onSelect={() => setMethod("magic")}
                  title="Recevoir un lien"
                  recommended
                  description="Un email avec un lien sécurisé, valable 15 minutes. Pas de mot de passe à retenir."
                />

                {/* Option 2 : mot de passe */}
                <MethodCard
                  selected={method === "password"}
                  onSelect={() => setMethod("password")}
                  title="Mot de passe"
                  description={
                    isRegister
                      ? "Définir un mot de passe pour votre compte."
                      : "Saisir votre mot de passe habituel."
                  }
                >
                  {method === "password" && (
                    <PasswordForm
                      isRegister={isRegister}
                      email={email}
                      firstName={firstName}
                      lastName={lastName}
                      show={show}
                      setShow={setShow}
                      loginAction={loginAction}
                      signupAction={signupAction}
                      loginMsg={loginMsg}
                      signupMsg={signupMsg}
                    />
                  )}
                </MethodCard>

                {/* Magic link CTA + erreur */}
                {method === "magic" && (
                  <>
                    {magicErr && (
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: "var(--rouge)",
                          padding: "10px 12px",
                          border: "1px solid var(--rouge)",
                          letterSpacing: "0.04em",
                        }}
                        data-testid="magic-link-error"
                      >
                        {magicErr}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={sendMagicLink}
                      disabled={magicPending}
                      className="btn btn-rouge"
                      style={{
                        justifyContent: "center",
                        padding: "16px 24px",
                        marginTop: 8,
                      }}
                      data-testid="magic-link-submit"
                    >
                      {magicPending ? "Envoi…" : "Envoyer le lien"}
                      {!magicPending && <LhArrow size={16} />}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Étape 3 : lien envoyé */}
          {step === "method" && sent && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "1px solid var(--ink)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 24px",
                }}
              >
                <LhCheck size={24} />
              </div>
              <h2
                className="serif-display"
                style={{
                  fontSize: 30,
                  lineHeight: 1.05,
                  margin: "0 0 14px",
                  letterSpacing: "-0.015em",
                }}
              >
                Vérifiez vos{" "}
                <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
                  emails
                </em>
                .
              </h2>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  color: "var(--ink-soft)",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                Un lien sécurisé a été envoyé à
                <br />
                <strong style={{ fontWeight: 500, color: "var(--ink)" }}>
                  {email}
                </strong>
              </p>
              <p
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  marginTop: 28,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Valable 15 minutes
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false)
                  setStep("email")
                }}
                className="mono"
                style={{
                  marginTop: 36,
                  fontSize: 11,
                  color: "var(--ink)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "underline",
                }}
              >
                Renvoyer ou changer d'email
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

interface MethodCardProps {
  selected: boolean
  onSelect: () => void
  title: string
  description: string
  recommended?: boolean
  children?: React.ReactNode
}

function MethodCard({
  selected,
  onSelect,
  title,
  description,
  recommended,
  children,
}: MethodCardProps) {
  return (
    <label
      aria-label={title}
      style={{
        display: "block",
        cursor: "pointer",
        border: selected ? "1px solid var(--ink)" : "1px solid var(--line)",
        padding: 20,
        background: selected ? "var(--bg-elevated)" : "transparent",
        transition: "all 160ms ease",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "start" }}>
        <input
          type="radio"
          name="auth-method"
          checked={selected}
          onChange={onSelect}
          style={{ display: "none" }}
        />
        <span
          aria-hidden
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "1px solid var(--ink)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            marginTop: 3,
          }}
        >
          {selected && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--ink)",
              }}
            />
          )}
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 19,
              }}
            >
              {title}
            </span>
            {recommended && (
              <span
                className="mono"
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  background: "var(--rouge)",
                  color: "#fff",
                  letterSpacing: "0.08em",
                }}
              >
                RECOMMANDÉ
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 14,
              color: "var(--ink-soft)",
              lineHeight: 1.45,
            }}
          >
            {description}
          </div>
          {children}
        </div>
      </div>
    </label>
  )
}

interface PasswordFormProps {
  isRegister: boolean
  email: string
  firstName: string
  lastName: string
  show: boolean
  setShow: (next: boolean) => void
  loginAction: (formData: FormData) => void
  signupAction: (formData: FormData) => void
  loginMsg: string | null
  signupMsg: string | null
}

function PasswordForm({
  isRegister,
  email,
  firstName,
  lastName,
  show,
  setShow,
  loginAction,
  signupAction,
  loginMsg,
  signupMsg,
}: PasswordFormProps) {
  const action = isRegister ? signupAction : loginAction
  const message = isRegister ? signupMsg : loginMsg
  return (
    <form
      action={action}
      style={{
        marginTop: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <input type="hidden" name="email" value={email} />
      {isRegister && (
        <>
          <input type="hidden" name="first_name" value={firstName} />
          <input type="hidden" name="last_name" value={lastName} />
        </>
      )}
      <LehenaField
        label="Mot de passe"
        name="password"
        type={show ? "text" : "password"}
        autoComplete={isRegister ? "new-password" : "current-password"}
        required
        data-testid="password-input"
        suffix={
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setShow(!show)
            }}
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-mute)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {show ? "Cacher" : "Afficher"}
          </button>
        }
      />
      {!isRegister && (
        <LocalizedClientLink
          href="/account/forgot-password"
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--rouge)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            alignSelf: "flex-start",
          }}
          data-testid="forgot-password-link"
        >
          Mot de passe oublié
        </LocalizedClientLink>
      )}
      {message && (
        <div
          className="mono"
          data-testid="auth-error-message"
          style={{
            fontSize: 11,
            color: "var(--rouge)",
            padding: "10px 12px",
            border: "1px solid var(--rouge)",
            letterSpacing: "0.04em",
          }}
        >
          {message}
        </div>
      )}
      <LehenaSubmitButton
        data-testid={isRegister ? "register-submit" : "sign-in-button"}
      >
        {isRegister ? "Créer mon compte" : "Se connecter"}
      </LehenaSubmitButton>
    </form>
  )
}

export default LoginTemplate
