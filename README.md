# Academy

Prototype front-end d'une plateforme SaaS de formation, d'onboarding et de validation de livrables métier. L'application permet de structurer des parcours de formation par espace (RPA, RH, Marketing, Finance, Juridique...), d'assigner des apprenants, de suivre leurs soumissions et de gérer plusieurs niveaux de validation depuis un espace admin.

Il s'agit pour l'instant d'un prototype front avancé : les données sont conservées localement dans le navigateur (`localStorage`), en attendant un futur backend pour la persistance serveur, les droits, les fichiers et les soumissions réelles.

## Stack

- React + Vite (TypeScript)
- Tailwind CSS 4
- Radix UI / MUI (composants)
- Recharts (graphiques)

## Structure

- `src/` — code de l'application
- `guidelines/`, `validators/` — règles et logique de validation des parcours
- `ACADEMY_PRODUCT_SPEC.md` — spécification produit détaillée
