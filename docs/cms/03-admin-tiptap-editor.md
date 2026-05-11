# Passe 03 — Composant éditeur TipTap (isolé et réutilisable)

## Objectif de cette passe

Créer le composant `<TiptapEditor />` de manière **isolée et testable**, avant
de l'intégrer dans la page d'édition (qui sera la passe 04).

L'objectif : avoir un composant solide, bien typé, avec toutes les extensions
voulues, et le valider visuellement dans une page de démo avant qu'il porte
la charge d'un vrai formulaire métier.

---

## PROMPT À COPIER-COLLER

```
Passe 03 : Composant éditeur TipTap réutilisable pour le Medusa Admin.

## Périmètre

- Un composant `<TiptapEditor />` autonome et bien typé
- Une page admin "playground" temporaire pour le tester visuellement
  (sera supprimée en passe 04)
- Les extensions TipTap configurées
- La toolbar
- Le bubble menu sur sélection
- L'upload d'images (via le file service Medusa déjà identifié en passe 01)
- Le compteur de caractères

## Versions de packages à installer

Pour éviter les pièges de versions incompatibles entre packages TipTap :

```
npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link \
  @tiptap/extension-image @tiptap/extension-typography \
  @tiptap/extension-placeholder @tiptap/extension-character-count
```

Vérifie avant install que toutes ces packages sont à la même version majeure.
Si une dernière version stable est en v3, prends v3 partout. Sinon v2 partout.
NE MÉLANGE PAS.

## API du composant

```typescript
type TiptapEditorProps = {
  value: JSONContent | null;          // contenu TipTap au format JSON
  onChange: (value: JSONContent) => void;
  placeholder?: string;                // défaut : "Commencez à écrire..."
  editable?: boolean;                  // défaut : true
  maxCharacters?: number;              // défaut : undefined (illimité)
  onImageUpload?: (file: File) => Promise<string>;  // retourne l'URL hébergée
  className?: string;                  // pour customisation externe
}
```

Le composant doit être **contrôlé** : `value` reflète l'état parent, `onChange`
remonte les modifs. Pas de state interne pour le contenu (sinon on aura des
bugs de sync avec le formulaire en passe 04).

## Extensions à activer

1. **StarterKit** avec configuration :
   - heading : levels [2, 3, 4] uniquement (pas de h1, le h1 sera le title de la page)
   - codeBlock : activé
   - horizontalRule : activé
   - bulletList, orderedList, blockquote : activés
   - hardBreak : activé

2. **Link** :
   - openOnClick: false (sinon clic ouvre le lien dans l'éditeur, pénible)
   - autolink: true
   - HTMLAttributes : `class: "text-blue-600 underline", rel: "noopener noreferrer", target: "_blank"`

3. **Image** :
   - inline: false
   - allowBase64: false (on force l'upload pour ne pas alourdir la base)
   - HTMLAttributes : `class: "rounded-lg max-w-full h-auto"`

4. **Typography** : tel quel (smart quotes, em-dashes)

5. **Placeholder** : configurable via prop

6. **CharacterCount** : si `maxCharacters` est défini, l'utilise comme limite

## Toolbar

Structure horizontale, sticky en haut de l'éditeur, avec groupes séparés par
des dividers verticaux :

| Groupe | Boutons |
|--------|---------|
| Formatage texte | Bold, Italic, Strike, Code (inline) |
| Titres | H2, H3, H4 |
| Listes | BulletList, OrderedList |
| Blocs | Blockquote, CodeBlock, HorizontalRule |
| Liens & médias | Link, Image |
| Historique | Undo, Redo |

Chaque bouton :
- Icône Lucide (importe depuis `lucide-react` qui est déjà dans Medusa Admin)
- Tooltip sur hover avec le nom + raccourci clavier
- État `active` (bg différent) quand le format est appliqué à la sélection
- État `disabled` quand l'action n'est pas possible (ex: undo si pas d'historique)
- `aria-label` pour l'accessibilité

Pour le bouton Link :
- Si pas de sélection : disabled
- Si sélection : ouvre un popover avec input URL + boutons Apply / Remove
- Pré-remplit l'input si la sélection contient déjà un lien

Pour le bouton Image :
- Ouvre un input file caché
- À la sélection du fichier : appelle `onImageUpload(file)`, attend l'URL,
  insère l'image à la position courante
- Pendant l'upload : afficher un loader, désactiver le bouton
- Si erreur : toast d'erreur (utilise le toast system de Medusa Admin si dispo)

## Bubble menu

S'affiche au-dessus de la sélection texte. Contient :
- Bold, Italic, Link

Plus compact que la toolbar. Pratique pour formater rapidement.

## Compteur de caractères

En bas à droite de l'éditeur, en petit, gris.

Format : `1234 caractères` ou `1234 / 5000` si maxCharacters défini.
Si on dépasse maxCharacters, passer en rouge.

## Drag & drop d'images

L'éditeur doit accepter le drop d'images directement dans la zone d'édition.
Mêmes règles que le bouton image : appel à `onImageUpload`, insertion à la
position du drop.

## Coller des images

Pareil pour le paste : si on colle une image depuis le presse-papier, déclencher
l'upload et insérer.

## Styles

- Wrapper : `border rounded-lg overflow-hidden bg-white`
- Toolbar : `border-b bg-gray-50 p-2 flex items-center gap-1 flex-wrap sticky top-0 z-10`
- Zone d'édition : `prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none`
- Compteur : `border-t bg-gray-50 px-4 py-2 text-xs text-gray-500 text-right`

Utilise Tailwind. Si Medusa Admin a un design system avec ses propres tokens,
vérifie d'abord et adapte-toi (mais le rendu doit rester neutre et pas hideux).

## Page playground (à supprimer en passe 04)

Crée `src/admin/routes/tiptap-playground/page.tsx` qui :
- Affiche le composant TiptapEditor avec un state local
- En dessous : un `<pre>` qui affiche le JSON courant (pour voir le contenu live)
- En dessous : un autre TiptapEditor en mode `editable={false}` qui affiche le
  même JSON, pour valider que le rendu read-only marche

Cette page sera supprimée à la fin de la passe 04. Elle sert juste à valider
visuellement le composant.

## Upload d'images : implémentation côté client

Dans la page playground, fournis une implémentation `onImageUpload` qui appelle
le file service Medusa. Selon ce qu'on a identifié en passe 01 :
- Si Medusa expose `POST /admin/uploads` : utilise-le
- Sinon : crée une route admin `POST /admin/pages-uploads` qui wrap le file
  module de Medusa et retourne l'URL

Documente le choix dans le code.

## Structure de fichiers attendue

```
backend/src/admin/
├── components/tiptap-editor/
│   ├── index.tsx                # export principal
│   ├── tiptap-editor.tsx        # composant
│   ├── toolbar.tsx              # toolbar avec tous les boutons
│   ├── toolbar-button.tsx       # composant bouton réutilisable
│   ├── bubble-menu.tsx          # bubble menu
│   ├── link-popover.tsx         # popover d'édition de lien
│   ├── extensions.ts            # config des extensions TipTap
│   ├── types.ts                 # types partagés
│   └── upload.ts                # helper upload (si route custom créée)
└── routes/tiptap-playground/
    └── page.tsx                 # playground temporaire
```

## Procédure d'exécution

1. Vérifie/installe les packages avec versions cohérentes. Montre-moi le
   `package.json` final avant de continuer.
2. Crée la config des extensions. Stop, montre-moi.
3. Crée le composant ToolbarButton + Toolbar. Stop, montre-moi.
4. Crée le composant TiptapEditor principal. Stop.
5. Ajoute le BubbleMenu et le LinkPopover. Stop.
6. Implémente l'upload d'images (création de la route backend si nécessaire).
7. Crée la page playground.
8. Lance le backend, ouvre `/app/tiptap-playground` dans le Medusa Admin,
   teste tous les boutons + drag & drop + paste image. Montre-moi des captures
   ou décris ce qui marche.
9. Commit : `feat(pages): add tiptap editor component`

## Critères de succès

À la fin de cette passe, je dois pouvoir :
- Aller dans `/app/tiptap-playground` du Medusa Admin
- Écrire du texte, le formater (bold, titres, listes...)
- Insérer un lien (avec popover)
- Uploader une image via bouton, drag & drop, et paste
- Voir le JSON courant se mettre à jour en live
- Voir le rendu read-only en dessous qui affiche la même chose

Pas d'intégration avec les pages métier dans cette passe — juste un composant
qui marche.

Vas-y.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Tous les boutons de la toolbar fonctionnent
- [ ] Le bubble menu apparaît sur sélection
- [ ] Le popover de lien marche (apply, remove, edit existant)
- [ ] L'upload d'image fonctionne (bouton, drag & drop, paste)
- [ ] Le compteur de caractères s'affiche
- [ ] Le rendu read-only (deuxième éditeur de la playground) affiche
      identique au mode édition
- [ ] Le JSON contient bien le contenu attendu
- [ ] Pas d'erreurs console

Si un truc cloche ici, ne passe surtout pas à la 04 — tu vas avoir à corriger
deux fois.
