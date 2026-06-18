import { Disclosure } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { clx } from "@medusajs/ui"
import { useEffect } from "react"
import { useFormStatus } from "react-dom"

interface AccountInfoProps {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  "data-testid"?: string
}

const SaveButton = () => {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="btn btn-solid"
      disabled={pending}
      data-testid="save-button"
      style={{
        justifyContent: "center",
        opacity: pending ? 0.6 : 1,
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "…" : "Enregistrer"}
    </button>
  )
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "Une erreur est survenue, veuillez réessayer.",
  children,
  "data-testid": dataTestid,
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div
      data-testid={dataTestid}
      style={{ borderTop: "1px solid var(--line)", padding: "22px 0" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{label}</div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 17,
              color: "var(--ink)",
              marginTop: 6,
            }}
          >
            {typeof currentInfo === "string" ? (
              <span data-testid="current-info">{currentInfo}</span>
            ) : (
              currentInfo
            )}
          </div>
        </div>
        <button
          onClick={handleToggle}
          type={state ? "reset" : "button"}
          data-testid="edit-button"
          data-active={state}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--rouge)",
            flexShrink: 0,
          }}
        >
          {state ? "Annuler" : "Modifier"}
        </button>
      </div>

      {/* Succès */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isSuccess,
              "max-h-0 opacity-0": !isSuccess,
            }
          )}
          data-testid="success-message"
        >
          <div
            className="mono"
            style={{
              display: "inline-block",
              marginTop: 14,
              padding: "8px 12px",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--success)",
              border: "1px solid var(--success)",
            }}
          >
            {label} mis à jour.
          </div>
        </Disclosure.Panel>
      </Disclosure>

      {/* Erreur */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isError,
              "max-h-0 opacity-0": !isError,
            }
          )}
          data-testid="error-message"
        >
          <div
            className="mono"
            style={{
              display: "inline-block",
              marginTop: 14,
              padding: "8px 12px",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--rouge)",
              border: "1px solid var(--rouge)",
            }}
          >
            {errorMessage}
          </div>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-visible",
            {
              "max-h-[1000px] opacity-100": state,
              "max-h-0 opacity-0": !state,
            }
          )}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 18 }}>
            <div>{children}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <SaveButton />
            </div>
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </div>
  )
}

export default AccountInfo
