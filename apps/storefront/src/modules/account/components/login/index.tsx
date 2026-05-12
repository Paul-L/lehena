import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

interface Props {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Welcome back</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Sign in to access an enhanced shopping experience.
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <div className="mt-2 text-right">
          <LocalizedClientLink
            href="/account/forgot-password"
            className="text-xs text-ui-fg-subtle underline hover:text-ui-fg-base"
            data-testid="forgot-password-link"
          >
            Mot de passe oublié ?
          </LocalizedClientLink>
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          Se connecter
        </SubmitButton>
      </form>
      <div className="w-full mt-6 flex items-center gap-3">
        <span className="flex-1 border-t border-ui-border-base" />
        <span className="text-xs uppercase text-ui-fg-muted tracking-widest">
          ou
        </span>
        <span className="flex-1 border-t border-ui-border-base" />
      </div>
      <LocalizedClientLink
        href="/account/magic-link"
        className="mt-6 w-full text-center text-sm underline text-ui-fg-base hover:text-ui-fg-interactive"
        data-testid="magic-link-link"
      >
        Recevoir un lien magique par email
      </LocalizedClientLink>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Pas encore membre ?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          Créer un compte
        </button>
        .
      </span>
    </div>
  )
}

export default Login
