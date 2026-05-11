# Plugin AI Assistant pour Medusa v2 — Série de prompts Claude Code

Cette série guide la création d'un **plugin Medusa exportable** qui ajoute un
assistant IA multi-agents au Medusa Admin, avec architecture
orchestrateur + sous-agents spécialisés et BYOK (Bring Your Own Key Anthropic).

## Vision du produit

Un plugin que tu installes dans n'importe quel projet Medusa v2 et qui ajoute :
- Un chat conversationnel intégré dans le Medusa Admin
- Un orchestrateur qui route les demandes vers le bon sous-agent
- 4 sous-agents spécialisés en v1 : SEO, Marketing, Site Content, Analytics
- Une couche d'outils (tools) qui permet aux agents d'accéder aux données
  Medusa et d'agir dessus (en mode draft + validation utilisateur obligatoire)
- Une UI de configuration pour que le client final entre sa propre clé API
  Anthropic
- Logging d'audit et système de versioning pour rollback

## Pourquoi cette architecture ?

- **Orchestrateur + spécialistes** : meilleur contexte par agent, prompts
  système dédiés, possibilité d'ajouter de nouveaux métiers sans toucher
  l'existant
- **BYOK** : tu n'avances pas les coûts API, le client paie sa propre conso,
  tu factures uniquement la licence du plugin
- **Plugin clonable privé** : tu gardes le contrôle de la diffusion, tu peux
  facturer en licence par projet, tu protèges ton IP

## Ordre d'exécution

| # | Fichier | Objectif | Durée estimée |
|---|---------|----------|---------------|
| 0 | `00-README.md` | Ce fichier | — |
| 1 | `01-setup-plugin-structure.md` | Bootstrap du repo plugin (structure, package.json, build) | 30 min |
| 2 | `02-config-and-byok.md` | Module de config : stockage chiffré de la clé API, UI settings | 60 min |
| 3 | `03-orchestrator-agent.md` | Agent orchestrateur + base technique multi-agents (loop, streaming, audit) | 90 min |
| 4 | `04-tools-layer.md` | Couche d'outils partagée (read/write Medusa, preview, validation) | 90 min |
| 5 | `05-subagent-seo.md` | Sous-agent SEO & contenu produit + ses tools dédiés | 60 min |
| 6 | `06-subagent-marketing.md` | Sous-agent Marketing & promotions + ses tools | 60 min |
| 7 | `07-subagent-site-content.md` | Sous-agent Site Content + module backend `site_content` | 120 min |
| 8 | `08-subagent-analytics.md` | Sous-agent Analytics & diagnostic + ses tools | 60 min |
| 9 | `09-chat-ui.md` | UI chat dans le Medusa Admin (streaming, tool calls, preview embed) | 120 min |
| 10 | `10-distribution-and-docs.md` | Préparation du repo pour clonage, doc d'installation | 45 min |

**Effort total estimé** : 12-15 jours-homme effectifs sur 3-4 semaines.

## Prérequis

1. La série précédente (module Pages) est faite et fonctionne — on va réutiliser
   plusieurs patterns (workflows, validation zod, revalidation ISR)
2. Backend Medusa v2 fonctionnel
3. Compte Anthropic + une clé API pour tes tests (les clients utiliseront
   leur propre clé en prod)
4. Bonne maîtrise des concepts d'agents IA (function calling, system prompts,
   conversation loops). Si tu débutes, lis d'abord la doc Anthropic :
   https://docs.claude.com

## Conventions architecturales

Toutes les passes respectent ces principes :

- **TypeScript strict**, zéro `any`
- **Séparation stricte read vs write** : tout tool qui modifie de la donnée
  passe par un workflow Medusa et nécessite confirmation utilisateur explicite
- **Mode draft systématique** : aucune publication directe par l'IA, jamais
- **Audit log** : chaque message, tool call, et modification est tracé
- **Streaming** : réponses streamées dans l'UI pour la perception de vitesse
- **Multi-tenant safe** : si plusieurs clients utilisent le même plugin sur
  des Medusa différents, leurs données ne se mélangent jamais
- **Pas de leak de la clé API** côté frontend : la clé est stockée chiffrée
  côté backend, et seul le backend appelle l'API Anthropic

## Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│  Medusa Admin (React)                                    │
│  ┌──────────────────────────────────────────────┐       │
│  │  AI Assistant Chat Panel                      │       │
│  │  - Streaming                                  │       │
│  │  - Affichage tool calls                       │       │
│  │  - Embed previews                             │       │
│  └────────────────┬─────────────────────────────┘       │
└───────────────────┼─────────────────────────────────────┘
                    │ SSE / WebSocket
┌───────────────────┼─────────────────────────────────────┐
│  Medusa Backend (Node)                                   │
│  ┌────────────────▼────────────────────────────┐        │
│  │  Orchestrator Agent                          │        │
│  │  - Reçoit le message utilisateur             │        │
│  │  - Décide quel sous-agent invoquer           │        │
│  │  - Synthétise les réponses                   │        │
│  └────┬─────────┬──────────┬──────────┬────────┘        │
│       │         │          │          │                  │
│  ┌────▼───┐ ┌──▼────┐ ┌───▼──────┐ ┌▼────────┐          │
│  │  SEO   │ │ Mktg  │ │ Site Cnt │ │Analytics│          │
│  │ Agent  │ │ Agent │ │  Agent   │ │  Agent  │          │
│  └────┬───┘ └──┬────┘ └───┬──────┘ └┬────────┘          │
│       │        │          │         │                    │
│  ┌────▼────────▼──────────▼─────────▼─────────┐         │
│  │  Tools Layer (Medusa data + actions)        │         │
│  └─────────────────────────────────────────────┘         │
│                    │                                      │
│  ┌─────────────────▼──────────────────┐                 │
│  │  Anthropic Claude API (BYOK)        │                 │
│  └─────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────┘
```

## Modèle économique suggéré

- **Licence du plugin** : forfait par installation (ex: 500-1500 € one-shot,
  ou abonnement 30-80 €/mois avec mises à jour incluses)
- **Le client paie sa conso Anthropic directement** : tu n'es pas dans la
  boucle de facturation
- **Setup / formation** : prestation séparée si onboarding souhaité

## Si tu bloques

Pour les agents IA spécifiquement : si un agent hallucine ou ne respecte pas
ses garde-fous, **9 fois sur 10 c'est le system prompt qu'il faut affiner**,
pas le code. Garde du temps pour itérer sur les prompts, c'est là que se joue
la qualité du produit.
