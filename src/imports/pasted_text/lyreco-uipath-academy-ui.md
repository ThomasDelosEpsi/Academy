🎨 Brief UI/UX Figma : Plateforme "Lyreco UiPath Academy"

📌 1. Contexte et Objectif du Design

Application : Une plateforme d'apprentissage interne (type e-learning / OpenClassrooms) pour le groupe Lyreco, dédiée à la montée en compétence sur l'outil RPA UiPath.
Concept clé : Un parcours gamifié et strictement linéaire. L'utilisateur doit valider un projet pour débloquer le suivant. Aucune triche possible.
Cible : Développeurs internes, Business Analysts.
Ton / Vibe : Corporate, épuré, motivant, clair (Tech / Education).

🎨 2. Direction Artistique (Design System)

Couleurs Principales :

Vert Lyreco (Primary) : #00A05A (Énergie, validation, identité Lyreco).

Bleu UiPath (Accent) : #005EFA (Boutons d'action, liens tech).

Couleurs Secondaires (Statuts de progression) :

Gris clair (Backgrounds) : #F4F6F8 ou #F9FAFB.

Gris moyen (Éléments verrouillés) : #9CA3AF.

Jaune/Orange (En cours) : #F59E0B.

Typographie : Inter ou Roboto (moderne, très lisible). Sans-serif.

Style des composants : Bords légèrement arrondis (Radius 8px ou 12px), ombres douces (Drop shadow) pour faire ressortir les cartes actives.

🖥️ 3. Écran 1 : Le Tableau de Bord / Parcours Pédagogique (The "Path")

Objectif : Montrer la progression globale et la restriction (verrouillage) des étapes futures.

Structure de la page (Haut en bas) :

Header (Navigation) :

Logo "Lyreco RPA Academy" à gauche.

Barre de progression globale (ex: "40% complété - Niveau Avancé") au centre.

Avatar utilisateur et notifications à droite.

Section Héro (Titre) :

Titre H1 : "Votre Parcours : Expert UiPath"

Sous-titre : "Complétez les projets un par un pour obtenir votre certification finale."

Composant Central : La Timeline / Chemin de Projets (Essentiel)

Disposition : Une ligne verticale (comme un arbre de compétences) ou une grille en zigzag avec une ligne de connexion entre chaque carte.

Design des Cartes (Les 5 projets) :

Carte 1 (Projet 1 : SAP & SharePoint) - STATUT : COMPLÉTÉ ✅

Bordure : Verte. Fond : Blanc.

Icône : Un check vert géant.

Texte : Titre du projet, durée (ex: "2 jours").

Bouton : "Revoir le projet" (Outline button).

Carte 2 (Projet 2 : Contrats Juridiques) - STATUT : EN COURS 🔄

Bordure : Bleu UiPath ou Orange (Glow effect / ombre portée pour attirer l'œil).

Icône : Un bouton "Play" ou une barre de chargement à 20%.

Texte : Titre, "Reprenez là où vous vous êtes arrêté".

Bouton : "Continuer" (Solid button, Bleu primaire).

Carte 3, 4 et 5 (Projet 3, 4, 5) - STATUT : VERROUILLÉ 🔒

Bordure : Grise. Fond : Gris très clair/opacité réduite à 50%.

Icône : Un gros Cadenas centré (Padlock icon).

Texte : Titre visible, mais description floutée ou grisée.

Tag : "Nécessite la validation du Projet 2".

Interaction : Non cliquable (Disabled state).

🖥️ 4. Écran 2 : L'Espace Projet (Exemple : Projet 2 débloqué)

Objectif : Afficher les consignes détaillées d'un projet et permettre la soumission du travail.

Structure de la page :

Sidebar gauche (Navigation contextuelle) :

Menu de navigation rapide du projet : "Contexte", "Règles métier", "Ressources", "Soumission".

Mini-timeline montrant que ce projet est "Étape 2 sur 5".

Zone Principale (Contenu du projet) :

En-tête : Tag "En cours", Titre "Projet 2 : Organigramme & Extraction", Bouton "Demander de l'aide au mentor".

Contenu textuel :

Mise en page propre avec des blocs de couleur (ex: Bloc info bleu pour le "Contexte", Bloc attention rouge/orange pour les "Règles strictes").

Section Ressources :

Cartes téléchargeables avec icônes : "Télécharger les Fichiers de Test (ZIP)", "Voir la doc API".

Zone de Soumission (Tout en bas, façon OpenClassrooms) :

Visuel : Un grand bloc distinct (fond gris clair ou encadré bleu).

Titre : "Validez votre projet".

Inputs : 1. Un champ texte pour coller l'URL du dépôt (GitHub, Azure DevOps, ou Orchestrator tenant).
2. Une zone de Drag & Drop pour uploader l'archive ZIP du code UiPath (.nupkg ou .zip).

Checklist avant soumission (Cases à cocher obligatoires) :

[ ] "J'ai bien utilisé le modèle Flowchart."

[ ] "Mon workflow principal ne dépasse pas 50 activités."

Bouton d'action principal : "Soumettre pour évaluation" (Bouton désactivé tant que la checklist n'est pas cochée).

🤖 5. Prompts pour Générateurs d'UI IA (Si vous utilisez un plugin Figma)

Copiez-collez ceci dans l'outil d'IA :

"Design an e-learning platform dashboard for a corporate training program. The main feature is a vertical learning path with 5 project cards. Card 1 is completed (green checkmark). Card 2 is active and highlighted (in progress). Cards 3, 4, and 5 are visually locked, greyed out with a large padlock icon, showing they cannot be accessed yet. Use a clean, corporate style. Primary colors are green (#00A05A) and tech blue (#005EFA)."

"Design a project detail page for an online course. Left sidebar with navigation. Main area contains text instructions, a resources section with downloadable files, and a large submission area at the bottom. The submission area must have a drag-and-drop file upload component, a checklist, and a 'Submit' button. Clean and modern UI, light grey background."