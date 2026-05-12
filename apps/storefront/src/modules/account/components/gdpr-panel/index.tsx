"use client"

import { exportMyData, requestDelete } from "@lib/data/gdpr"
import { Button, toast } from "@medusajs/ui"
import { Download, Trash2 } from "lucide-react"
import { useState, type FormEvent } from "react"

export default function GdprPanel() {
  const [exporting, setExporting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [sent, setSent] = useState(false)

  const downloadExport = async () => {
    setExporting(true)
    try {
      const data = await exportMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lehena-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Export téléchargé.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'export.")
    } finally {
      setExporting(false)
    }
  }

  const onDeleteSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRequesting(true)
    const fd = new FormData(e.currentTarget)
    const res = await requestDelete({
      password: String(fd.get("password") ?? ""),
      notes: String(fd.get("notes") ?? "") || undefined,
    })
    setRequesting(false)
    if (res.success) {
      setSent(true)
      setConfirmOpen(false)
    } else {
      toast.error(res.error ?? "Erreur.")
    }
  }

  return (
    <div className="grid gap-y-8 max-w-2xl">
      <section className="border border-ui-border-base p-5 rounded">
        <div className="flex items-start gap-3">
          <Download size={20} className="mt-1 text-ui-fg-subtle" />
          <div className="flex-1">
            <h2 className="text-base-semi mb-1">Exporter mes données</h2>
            <p className="text-sm text-ui-fg-subtle mb-4">
              Téléchargez un fichier JSON contenant toutes vos informations
              personnelles : profil, adresses, commandes, liste d&apos;envies,
              historique RGPD. Les données de paiement sont conservées par
              Stripe (notre prestataire) et ne figurent pas ici.
            </p>
            <Button
              variant="secondary"
              onClick={downloadExport}
              isLoading={exporting}
              data-testid="gdpr-export-btn"
            >
              Télécharger mes données (JSON)
            </Button>
          </div>
        </div>
      </section>

      <section className="border border-ui-border-error p-5 rounded">
        <div className="flex items-start gap-3">
          <Trash2 size={20} className="mt-1 text-ui-fg-error" />
          <div className="flex-1">
            <h2 className="text-base-semi mb-1 text-ui-fg-error">
              Supprimer mon compte
            </h2>
            <p className="text-sm text-ui-fg-subtle mb-4">
              Cette action est <strong>irréversible</strong>. Vos données
              personnelles seront anonymisées et votre liste d&apos;envies
              supprimée. Nous conservons vos commandes passées de manière
              anonymisée pendant 10 ans (obligation comptable légale).
            </p>
            {sent ? (
              <div className="p-3 rounded bg-ui-bg-subtle text-sm">
                Un email avec un lien de confirmation vous a été envoyé. Le lien
                est valable une heure. Si vous ne voyez rien, vérifiez vos
                indésirables.
              </div>
            ) : confirmOpen ? (
              <form onSubmit={onDeleteSubmit} className="grid gap-y-3">
                <label className="text-sm">
                  Mot de passe actuel
                  <input
                    name="password"
                    type="password"
                    required
                    className="block w-full mt-1 px-3 py-2 border border-ui-border-base rounded text-sm"
                    data-testid="gdpr-delete-password"
                  />
                </label>
                <label className="text-sm">
                  Raison (optionnel)
                  <textarea
                    name="notes"
                    rows={3}
                    className="block w-full mt-1 px-3 py-2 border border-ui-border-base rounded text-sm"
                    data-testid="gdpr-delete-notes"
                  />
                </label>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="danger"
                    isLoading={requesting}
                    data-testid="gdpr-delete-submit"
                  >
                    Demander la suppression
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmOpen(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="danger"
                onClick={() => setConfirmOpen(true)}
                data-testid="gdpr-delete-open"
              >
                Demander la suppression de mon compte
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
