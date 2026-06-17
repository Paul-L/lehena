import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
        padding: 24,
        border: "1px solid var(--line)",
        background: "var(--bg-elevated)",
      }}
    >
      <div>
        <h2 className="serif-display" style={{ fontSize: 22, lineHeight: 1.1 }}>
          Vous avez déjà un compte ?
        </h2>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 15,
            color: "var(--ink-soft)",
            marginTop: 6,
          }}
        >
          Connectez-vous pour retrouver vos adresses et aller plus vite.
        </p>
      </div>
      <LocalizedClientLink href="/account">
        <button className="btn btn-ghost" data-testid="sign-in-button">
          Se connecter
        </button>
      </LocalizedClientLink>
    </div>
  )
}

export default SignInPrompt
