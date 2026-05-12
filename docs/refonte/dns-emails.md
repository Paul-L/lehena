# DNS — Configuration emails (DKIM / SPF / DMARC)

Ce document liste les enregistrements DNS à poser sur le domaine `lehena.fr`
pour que les emails transactionnels envoyés via **Resend** soient
correctement authentifiés et arrivent en boîte de réception (et pas en
spam) sur Gmail, Outlook, Yahoo, Apple Mail, etc.

**À mettre à jour quand** le sous-domaine d'envoi change, ou quand on
change de provider transactionnel.

---

## 1. Sous-domaine d'envoi recommandé

On envoie **depuis un sous-domaine dédié**, pas depuis la racine
`lehena.fr`. Avantages :

- isole la réputation des emails transactionnels de la réputation du
  domaine principal (un envoi raté ne pénalise pas le site)
- permet à terme de séparer transactionnel (`mail.`) et marketing
  (`news.` ou `connect.` via Brevo en Phase 7+)

**Convention** : `mail.lehena.fr` pour le transactionnel via Resend.

`RESEND_FROM_EMAIL=hello@mail.lehena.fr` côté backend.

---

## 2. SPF — autorise Resend à envoyer pour le sous-domaine

Type : `TXT` — Nom : `mail.lehena.fr` — Valeur :

```
v=spf1 include:spf.resend.com -all
```

`-all` (hardfail) plutôt que `~all` parce qu'aucun autre serveur n'est
censé envoyer depuis ce sous-domaine.

Pour le domaine racine (envoi marketing Brevo ultérieur) :

```
v=spf1 include:spf.brevo.com -all
```

à composer le moment venu.

---

## 3. DKIM — signature des emails sortants

Resend fournit les clés DKIM lors de l'ajout du domaine dans le
dashboard. Les enregistrements ressemblent à :

Type : `TXT` — Nom : `resend._domainkey.mail.lehena.fr` — Valeur :

```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...
```

> ⚠️ La valeur est générée par Resend, à copier-coller depuis leur UI.

Selon le provider DNS, il peut falloir échapper les `;` ou couper la
valeur en plusieurs strings de 255 caractères.

---

## 4. DMARC — politique de gestion des emails non-authentifiés

Type : `TXT` — Nom : `_dmarc.lehena.fr` — Valeur initiale (mode
**reporting only**, sans rejet) :

```
v=DMARC1; p=none; rua=mailto:dmarc-reports@lehena.fr; ruf=mailto:dmarc-reports@lehena.fr; fo=1; adkim=s; aspf=r; pct=100
```

Après 2-4 semaines de monitoring sans alertes, passer à `quarantine`
puis `reject` :

```
v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@lehena.fr; pct=25
```

Augmenter `pct` à 50 puis 100 sur 1-2 mois.

```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@lehena.fr; sp=reject; adkim=s; aspf=s
```

---

## 5. MX (optionnel) — recevoir des bounces

Si on veut recevoir et parser les bounces et plaintes RGPD :

Type : `MX` — Nom : `mail.lehena.fr` — Valeur : `10 feedback.resend.com`

(En V1 on délègue ça aux webhooks Resend ; pas obligatoire de poser le MX
côté Lehena.)

---

## 6. Vérification

Après propagation DNS (5 min à 48h selon le registrar) :

- [`mxtoolbox.com`](https://mxtoolbox.com/SuperTool.aspx) → SPF, DKIM,
  DMARC checks
- [`mail-tester.com`](https://www.mail-tester.com/) → score global (vise
  ≥ 9/10)
- Resend dashboard → statut "Verified" sur les enregistrements DKIM

---

## 7. Variables d'environnement reliées

| Var                     | Rôle                                                            |
| ----------------------- | --------------------------------------------------------------- |
| `RESEND_API_KEY`        | Clé API serveur (jamais côté client).                           |
| `RESEND_FROM_EMAIL`     | Adresse d'envoi par défaut, doit pointer vers `mail.lehena.fr`. |
| `RESEND_WEBHOOK_SECRET` | Vérification HMAC des webhooks bounces/clicks.                  |
| `RESEND_DEV_MODE`       | `true` en dev / staging → redirige tous les emails.             |
| `RESEND_DEV_REDIRECT`   | Adresse destinataire en mode dev (défaut `paul+dev@lehena.fr`). |

---

## 8. Backlog Brevo (Phase 7+ / post-bascule)

Quand on activera Brevo pour le marketing :

1. Sous-domaine `news.lehena.fr` distinct du transactionnel.
2. SPF, DKIM, DMARC à poser séparément.
3. `BREVO_API_KEY` + `BREVO_LIST_ID` + listes "VIP", "Inactifs > 6 mois"
   à créer dans le dashboard.
4. Double opt-in obligatoire (RGPD) avant import contact.

Le module backend `notifications` reste source de vérité du
transactionnel (Resend), Brevo n'est qu'une couche marketing par-dessus.
