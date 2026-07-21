# FAQ templates — pages piliers (brief copywriter)

> **Statut : brief, PAS du contenu final.** Ce document liste les **60 questions
> templates** (6 piliers × 10 questions) destinées au schema `FAQPage` des pages
> piliers. Les réponses sont **à rédiger par Paul / le copywriter** — ne rien
> publier tant qu'une réponse porte encore le marqueur `_À rédiger…_`.

## Comment remplir

- **Longueur** : 40 à 300 mots par réponse. Trop court = pas de valeur ; trop
  long = Google préfère renvoyer vers la page plutôt que d'afficher un featured
  snippet.
- **HTML léger autorisé** dans la réponse : `<p>`, `<a>`, `<ul>`, `<strong>`.
  **Interdit** : `<script>`, attributs `on*`, JS.
- **Pas de doublon de question** entre piliers (Google déduplique).
- Chaque réponse doit être **factuelle** — pas d'invention (dates, chiffres,
  certifications). En cas de doute, laisser `_À rédiger…_`.

## Où saisir les réponses

Le champ `faq` (json) du modèle `Page` (backend Medusa) porte un tableau de
`{ question, answer }`. Le storefront :

1. rend chaque Q&A en **HTML visible** via `<FaqAccordion>` (obligatoire — sans
   ça Google invalide le schema) ;
2. n'émet le schema `FAQPage` **que** pour les items dont la réponse est réelle
   (les placeholders `À rédiger / À valider / À compléter / À remplir` sont
   filtrés automatiquement, cf. `filterValidFaqItems`).

Autrement dit : tant qu'une réponse reste un placeholder, elle est masquée du
schema — mais **relire avant publication** reste indispensable.

---

## Pilier 1 — Jambon sans nitrite

1. **Qu'est-ce qu'un jambon sans nitrite ?**
   _À rédiger par Paul/copywriter_
2. **Pourquoi le nitrite est-il ajouté habituellement dans la charcuterie ?**
   _À rédiger par Paul/copywriter_
3. **Le jambon sans nitrite est-il vraiment plus sain ?**
   _À rédiger par Paul/copywriter_
4. **Comment reconnaître un vrai jambon sans nitrite ?**
   _À rédiger par Paul/copywriter_
5. **Combien de temps se conserve un jambon sans nitrite ?**
   _À rédiger par Paul/copywriter_
6. **Le jambon sans nitrite a-t-il le même goût ?**
   _À rédiger par Paul/copywriter_
7. **Pourquoi la couleur d'un jambon sans nitrite est-elle différente ?**
   _À rédiger par Paul/copywriter_
8. **Quelle est la différence entre « sans nitrite ajouté » et « sans nitrite » ?**
   _À rédiger par Paul/copywriter_
9. **Un jambon Lehena est-il certifié bio ?**
   _À rédiger par Paul/copywriter_
10. **Combien coûte un jambon artisanal sans nitrite ?**
    _À rédiger par Paul/copywriter_

## Pilier 2 — Race Duroc

1. **Qu'est-ce que la race de porc Duroc ?**
   _À rédiger par Paul/copywriter_
2. **D'où vient le porc Duroc et depuis quand Lehena l'élève ?**
   _À rédiger par Paul/copywriter_
3. **Quelle différence entre le Duroc et le porc ibérique (pata negra) ?**
   _À rédiger par Paul/copywriter_
4. **Quelle différence entre le Duroc et le porc noir de Bigorre ?**
   _À rédiger par Paul/copywriter_
5. **De quoi se nourrissent les porcs Duroc de Lehena ?**
   _À rédiger par Paul/copywriter_
6. **Les porcs sont-ils élevés en plein air ?**
   _À rédiger par Paul/copywriter_
7. **Pourquoi la viande Duroc est-elle si persillée ?**
   _À rédiger par Paul/copywriter_
8. **À quel âge / poids les porcs Duroc sont-ils abattus ?**
   _À rédiger par Paul/copywriter_
9. **Le Duroc convient-il mieux à l'affinage long ?**
   _À rédiger par Paul/copywriter_
10. **La race Duroc a-t-elle un impact sur le goût du jambon ?**
    _À rédiger par Paul/copywriter_

## Pilier 3 — Affinage 24 mois

1. **En quoi consiste l'affinage d'un jambon ?**
   _À rédiger par Paul/copywriter_
2. **Quelles sont les grandes étapes de l'affinage chez Lehena ?**
   _À rédiger par Paul/copywriter_
3. **Quel rôle joue le sel de Salies-de-Béarn dans la salaison ?**
   _À rédiger par Paul/copywriter_
4. **Quelle différence entre un jambon affiné 15 mois et 24 mois ?**
   _À rédiger par Paul/copywriter_
5. **Qu'est-ce qu'un séchoir naturel et pourquoi Lehena l'utilise ?**
   _À rédiger par Paul/copywriter_
6. **Quel taux d'humidité et quelle température pour un bon affinage ?**
   _À rédiger par Paul/copywriter_
7. **Comment savoir si un jambon est affiné assez longtemps ?**
   _À rédiger par Paul/copywriter_
8. **Pourquoi un jambon perd-il autant de poids à l'affinage ?**
   _À rédiger par Paul/copywriter_
9. **L'affinage long rend-il le jambon plus salé ?**
   _À rédiger par Paul/copywriter_
10. **Un affinage plus long justifie-t-il un prix plus élevé ?**
    _À rédiger par Paul/copywriter_

## Pilier 4 — Patxaran

1. **Qu'est-ce que le patxaran ?**
   _À rédiger par Paul/copywriter_
2. **Quelle est l'origine du patxaran au Pays Basque et en Navarre ?**
   _À rédiger par Paul/copywriter_
3. **Comment est fabriqué le patxaran traditionnel ?**
   _À rédiger par Paul/copywriter_
4. **Quelles prunelles (sloe) utilise-t-on pour le patxaran ?**
   _À rédiger par Paul/copywriter_
5. **Quel est le degré d'alcool du patxaran ?**
   _À rédiger par Paul/copywriter_
6. **Comment sert-on le patxaran (frais, glace, température) ?**
   _À rédiger par Paul/copywriter_
7. **Quels accords mets / dessert avec le patxaran ?**
   _À rédiger par Paul/copywriter_
8. **Combien de temps se conserve une bouteille de patxaran ?**
   _À rédiger par Paul/copywriter_
9. **Quelle différence entre patxaran artisanal et industriel ?**
   _À rédiger par Paul/copywriter_
10. **Peut-on cuisiner ou faire des cocktails avec le patxaran ?**
    _À rédiger par Paul/copywriter_

## Pilier 5 — Découpe du jambon

1. **De quel matériel a-t-on besoin pour découper un jambon entier ?**
   _À rédiger par Paul/copywriter_
2. **Comment installer et bloquer un jambon sur son support (jamonero) ?**
   _À rédiger par Paul/copywriter_
3. **Dans quel sens commence-t-on à couper un jambon ?**
   _À rédiger par Paul/copywriter_
4. **Comment obtenir des tranches fines et régulières ?**
   _À rédiger par Paul/copywriter_
5. **Comment conserver un jambon entamé et éviter qu'il sèche ?**
   _À rédiger par Paul/copywriter_
6. **Que faire de l'os et des parties proches de l'os ?**
   _À rédiger par Paul/copywriter_
7. **Combien de personnes peut-on servir avec un jambon entier ?**
   _À rédiger par Paul/copywriter_
8. **Faut-il retirer le gras extérieur avant de couper ?**
   _À rédiger par Paul/copywriter_
9. **Combien de temps se garde un jambon une fois entamé ?**
   _À rédiger par Paul/copywriter_
10. **Vaut-il mieux un jambon avec os ou désossé ?**
    _À rédiger par Paul/copywriter_

## Pilier 6 — Charcuterie & santé

1. **La charcuterie sans nitrite est-elle meilleure pour la santé ?**
   _À rédiger par Paul/copywriter_
2. **Quelle quantité de charcuterie peut-on consommer raisonnablement ?**
   _À rédiger par Paul/copywriter_
3. **Quel est le taux de sel (sodium) dans un jambon affiné ?**
   _À rédiger par Paul/copywriter_
4. **Quelle est la part de gras saturés dans la charcuterie Lehena ?**
   _À rédiger par Paul/copywriter_
5. **Que dit l'ANSES sur la consommation de charcuterie ?**
   _À rédiger par Paul/copywriter_
6. **Pourquoi les nitrites font-ils débat sur le plan sanitaire ?**
   _À rédiger par Paul/copywriter_
7. **La charcuterie sans nitrite convient-elle aux femmes enceintes ?**
   _À rédiger par Paul/copywriter_
8. **Comment intégrer la charcuterie dans une alimentation équilibrée ?**
   _À rédiger par Paul/copywriter_
9. **Le jambon affiné est-il une bonne source de protéines ?**
   _À rédiger par Paul/copywriter_
10. **Quelles alternatives sans nitrite aux charcuteries classiques ?**
    _À rédiger par Paul/copywriter_

---

## Rappel des garde-fous (cf. `docs/refonte/seo/06-faq-pillars.md`)

- [ ] Q&A **visibles dans le HTML** (accordéon rendu, pas seulement le schema).
- [ ] Aucune réponse publiée avec un marqueur `À rédiger`.
- [ ] Pas de doublon de question entre piliers.
- [ ] 40–300 mots par réponse ; HTML léger uniquement.
