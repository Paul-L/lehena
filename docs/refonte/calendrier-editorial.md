# Calendrier éditorial — 12 mois (M0 = bascule + 1 mois)

Source de vérité du planning SEO : **6 pages piliers** + **5 articles
supports** pour le pilier prioritaire "Jambon sans nitrite" + 4 articles
saisonniers.

> ⚠️ Les statuts \"publié\" sont à mettre à jour au fur et à mesure par le
> copywriter. Les briefs détaillés vivent dans la doc copywriter externe ;
> ce fichier ne traque que le titre, le mot-clé et l'échéance.

---

## 6 pages piliers (publication échelonnée — 1 toutes les 2-3 semaines)

| #   | Slug                                     | Titre                                                                        | Mot-clé principal          | Volume | Intent         | Échéance  |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------- | -------------------------- | ------ | -------------- | --------- |
| P1  | `/fr/piliers/jambon-sans-nitrite`        | Le jambon sans nitrite : pourquoi, comment, et que vérifier sur l'étiquette  | jambon sans nitrite        | 4 800  | informationnel | M0+2 sem  |
| P2  | `/fr/piliers/race-basque-kintoa`         | La race basque Kintoa : histoire, sauvegarde, et ce qu'elle apporte au goût  | porc basque kintoa         | 1 600  | informationnel | M0+4 sem  |
| P3  | `/fr/piliers/affinage-jambon-long`       | L'affinage long du jambon : 12 / 18 / 24 / 36 mois — qu'est-ce qui change ?  | affinage jambon            | 2 900  | commercial     | M0+6 sem  |
| P4  | `/fr/piliers/jambon-iberique-vs-basque`  | Jambon ibérique vs jambon basque : tout ce qui les sépare (et les rapproche) | jambon ibérique vs basque  | 880    | comparatif     | M0+8 sem  |
| P5  | `/fr/piliers/conservation-charcuterie`   | Conservation des charcuteries artisanales : la méthode complète              | conserver jambon entier    | 1 900  | how-to         | M0+10 sem |
| P6  | `/fr/piliers/coffret-cadeau-charcuterie` | Choisir un coffret cadeau charcuterie : guide 2026                           | coffret cadeau charcuterie | 5 200  | transactionnel | M0+12 sem |

## 5 articles supports — pilier "Jambon sans nitrite"

| #   | Slug                                             | Titre                                                                        | Mot-clé                    | Volume | Intent                 | Date      |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------- | ------ | ---------------------- | --------- |
| A1  | `/fr/journal/nitrite-charcuterie-cancer`         | Nitrite et charcuterie : ce que dit vraiment l'OMS                           | nitrite charcuterie danger | 720    | informationnel         | M0+3 sem  |
| A2  | `/fr/journal/etiquette-jambon-sans-nitrite`      | Comment lire une étiquette de jambon : 6 mentions à vérifier                 | étiquette jambon           | 480    | how-to                 | M0+5 sem  |
| A3  | `/fr/journal/sels-nitrites-alternatives`         | Les alternatives au sel nitrité : extrait de céleri, fermentation, sel marin | sel nitrité alternative    | 320    | informationnel         | M0+7 sem  |
| A4  | `/fr/journal/jambon-femme-enceinte`              | Femme enceinte et jambon cru : comment choisir sans risque                   | femme enceinte jambon      | 1 600  | informationnel + santé | M0+9 sem  |
| A5  | `/fr/journal/jambon-sans-nitrite-marques-france` | 8 maisons françaises qui ne mettent pas de nitrite                           | jambon sans nitrite france | 590    | comparatif             | M0+11 sem |

## 4 articles saisonniers (Q1 → Q4)

| #   | Slug                                      | Titre                                                                  | Saison | Date          |
| --- | ----------------------------------------- | ---------------------------------------------------------------------- | ------ | ------------- |
| S1  | `/fr/journal/jambon-noel-decoupe`         | Jambon entier à Noël : comment l'installer, le découper, le servir     | Q4     | Nov M0+10 sem |
| S2  | `/fr/journal/charcuterie-printemps-leger` | Charcuterie de printemps : 5 idées légères pour la saison des asperges | Q2     | Mar M0+22 sem |
| S3  | `/fr/journal/aperitif-ete-basque`         | Apéritif d'été au Pays basque : sélection produits + accords           | Q2-Q3  | Mai M0+26 sem |
| S4  | `/fr/journal/cadeaux-fete-des-peres`      | Idées cadeaux Fête des Pères : 5 coffrets Lehena                       | Q2     | Mai M0+28 sem |

## Calendrier consolidé (vue mensuelle)

```
M0 (lancement)
├── Sem 1-2 — P1 (Jambon sans nitrite — flagship)
├── Sem 3 — A1 (Nitrite + OMS)
└── Sem 4 — P2 (Race basque Kintoa)

M+1
├── Sem 5 — A2 (Étiquette à lire)
├── Sem 6 — P3 (Affinage long)
└── Sem 7 — A3 (Alternatives au nitrite)

M+2
├── Sem 8 — P4 (Ibérique vs basque)
├── Sem 9 — A4 (Femme enceinte)
└── Sem 10 — P5 (Conservation) + S1 (Jambon Noël) si saison

M+3
├── Sem 11 — A5 (Marques françaises)
└── Sem 12 — P6 (Coffret cadeau)

M+4 → M+11
└── 1 article support / mois, choisi par le copywriter selon les
    insights Search Console + GBP.
```

---

## Indicateurs de succès (à reviewer trimestriellement)

- **Indexation** : 100 % des pages piliers indexées en Search Console
  sous 30 jours après publication.
- **Position moyenne** : top 20 sur mot-clé principal sous 90 jours.
- **Conversion** : ≥ 0,5 % CR organique sur trafic pillar.
- **Trafic récurrent** : 30 % des sessions sont returning visitor à
  M+6.

## Notes de production

- Chaque pillar embarque ≥ 3 product-embed nodes (TipTap custom) pour
  driver vers la PDP. Pas plus de 5 (saturé).
- Chaque article support porte un `pillar_slug` qui pointe sur son
  pillar parent — le storefront affiche un bandeau "Sur le même thème"
  sous le contenu (à wirer Phase 10).
- Photos terroir : sourcer auprès d'Inovesign ou shoot dédié (budget
  Phase 14).
- Validation copy par Paul AVANT publication. Aucun draft ne file en
  prod sans relecture.
