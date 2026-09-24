🎨 Brief UI/UX Figma : Plateforme "Lyreco UiPath Academy" (V2 - All-in-One)

📌 1. Contexte et Objectif du Design

Application : Une plateforme d'apprentissage interne (type e-learning / OpenClassrooms) pour le groupe Lyreco, dédiée à la montée en compétence sur l'outil RPA UiPath et les technologies associées (VB/VBS).
Concept clé : Un parcours gamifié et strictement linéaire avec validation stricte par IA et par règles. L'utilisateur doit obtenir l'approbation du système pour débloquer la suite.
Fonctionnalités clés ajoutées : Tracking du temps (Timer), IDE intégré pour le script, correction automatisée par IA, et un espace Administration/Analytics.
Cibles : Développeurs internes, Business Analysts (Côté Apprenant) / Managers RPA, Formateurs (Côté Admin).
Ton / Vibe : Corporate, épuré, motivant, clair (Tech / Education).

🎨 2. Direction Artistique (Design System)

Couleurs Principales :

Vert Lyreco (Primary) : #00A05A (Énergie, validation, identité Lyreco).

Bleu UiPath (Accent) : #005EFA (Boutons d'action, liens tech).

Couleurs Secondaires (Statuts de progression & feedbacks) :

Gris clair (Backgrounds) : #F4F6F8 ou #F9FAFB.

Gris moyen (Éléments verrouillés) : #9CA3AF.

Jaune/Orange (En cours / En analyse IA) : #F59E0B.

Rouge doux (Erreur de validation) : #EF4444.

Typographie : Inter ou Roboto (moderne). Utiliser une police Monospace (ex: Fira Code ou JetBrains Mono) pour l'IDE intégré.

Style des composants : Bords légèrement arrondis (Radius 8px ou 12px), ombres douces (Drop shadow) pour faire ressortir les cartes actives.

🖥️ 3. Écran 1 : Le Tableau de Bord Apprenant (The "Path")

Objectif : Montrer la progression globale, le temps passé et la restriction des étapes futures.

Structure de la page (Haut en bas) :

Header (Navigation) :

Logo "Lyreco RPA Academy" à gauche.

Barre de progression globale au centre.

Compteur de temps global passé sur la plateforme.

Avatar utilisateur et notifications à droite.

Section Héro (Titre) :

Titre H1 : "Votre Parcours : Expert UiPath"

Composant Central : La Timeline (Mise à jour avec Timer)

Disposition : Une ligne verticale avec une ligne de connexion entre chaque carte.

Design des Cartes :

Carte 1 - STATUT : COMPLÉTÉ ✅

Fond blanc, bordure verte. Check vert.

Nouveau : Tag "Temps de complétion : 04h 12m".

Carte 2 - STATUT : EN COURS 🔄

Bordure Bleu UiPath (Glow effect).

Nouveau : Un Timer actif (ex: ⏱️ 02h 45m écoulées).

Bouton : "Continuer" (Solid button).

Carte 3 - STATUT : VERROUILLÉ 🔒

Grisé avec un gros cadenas. Tag : "Nécessite la validation IA du Projet 2".

🖥️ 4. Écran 2 : L'Espace Projet & La Validation IA

Objectif : Afficher les consignes et permettre la soumission avec un retour visuel de l'IA et du moteur de règles.

Structure de la page :

Header flottant du projet :

Titre du projet et Timer sticky en haut à droite (ex: Temps de session : 00:45:12).

Zone Principale (Contenu & IDE d'exercice) :

Menu de navigation gauche : "Contexte", "Ressources", "Soumission".

Contenu textuel avec blocs d'information colorés.

Zone de Soumission (Refonte avec IA) :

Visuel : Un grand encadré bleu.

Inputs : Upload de l'archive (.zip) ou lien du repo.

Nouveau composant de Feedback (Après clic sur Soumettre) :

État 1 (En cours) : Spinner avec texte "L'IA analyse votre code et les règles métier..."

État 2 (Échec) : Panneau rouge avec les retours de l'IA (ex: ❌ Règle violée : Le Main.xaml dépasse 50 activités, 🤖 Conseil IA : Utilisez un Invoke Workflow File pour la section SAP.).

État 3 (Succès) : Panneau Vert, bouton "Passer au projet suivant" débloqué.

🖥️ 5. Écran 3 : L'IDE Intégré (Module d'entraînement VB/VBScript)

Objectif : Permettre à l'apprenant de coder directement dans le navigateur pour comprendre la logique de programmation avant de passer sur UiPath Studio.

Structure de la page :

Layout "Split Screen" (Écran scindé en 3 panneaux) :

Panneau Gauche (Consignes) :

"Exercice : Écrire une fonction VB qui nettoie une chaîne de caractères."

Bouton "Demander un indice".

Panneau Central (L'Éditeur de Code) :

Thème sombre (Dark mode, type VS Code).

Numérotation des lignes.

Coloration syntaxique pour Visual Basic (mots clés en bleu/rose).

Panneau Droit ou Bas (Console/Terminal) :

Bouton "▶️ Exécuter le code" (Vert).

Zone de console noire affichant le résultat de la compilation ou les erreurs (ex: Output: "Lyreco_Order_123").

🖥️ 6. Écran 4 : Le Tableau de Bord Administrateur (Analytics & Course Builder)

Objectif : Suivre la progression, repérer les points bloquants et enrichir la plateforme.

Structure de la page :

Sidebar Admin : "Vue d'ensemble", "Apprenants", "Analytics de blocage", "Créer un cours".

Zone Principale (Vue d'ensemble & Bottlenecks) :

KPIs (Cartes en haut) : "Apprenants Actifs", "Temps moyen d'apprentissage", "Projet le plus difficile".

Graphique des Points Bloquants (Analytics) :

Un "Bar chart" ou "Heatmap" montrant le temps moyen passé par module.

Mise en évidence : Le "Projet 4 (SAP)" est en rouge car la moyenne de complétion est de 14 jours (identifié comme goulot d'étranglement).

Tableau de suivi des apprenants (Data Grid) :

Colonnes : Nom, Projet Actuel, Temps passé sur le projet, Dernière connexion, Action (Voir code/Forcer validation).

Section "Créer un module" (Course Builder entry point) :

Bouton "➕ Ajouter un nouveau cours / projet".

Ouvre un modal ou une nouvelle page pour configurer : Titre, Description, Fichiers, et Définition des règles de validation de l'IA (ex: input attendu vs output attendu).

🤖 7. Prompts pour Générateurs d'UI IA (Figma Plugins)

Copiez-collez ceci dans l'outil d'IA (ex: Wireframe Designer, Relume, Musho) :

Prompt 1 (Student Path & Timer) : "Design an e-learning platform dashboard for a corporate training program. The main feature is a vertical learning path with 5 project cards. Card 1 is completed. Card 2 is active and includes a live Timer (e.g., 02h 45m elapsed). Cards 3, 4, 5 are locked with a padlock. Clean corporate style, primary colors are green (#00A05A) and tech blue (#005EFA)."

Prompt 2 (AI Submission & Feedback) : "Design a project submission UI component. It includes a file upload area. Below it, show an AI feedback panel in a failed state (red/orange border) displaying specific coding errors found by the AI reviewer, and tips to fix them. Include a disabled 'Next Step' button."

Prompt 3 (In-browser IDE) : "Design an in-browser coding environment. A 3-panel layout: Left panel with exercise instructions. Center panel is a dark-mode code editor with syntax highlighting and line numbers. Bottom panel is a terminal/console showing the execution output with a green 'Run Code' button."

Prompt 4 (Admin Analytics) : "Design an admin dashboard for an educational platform. Include KPI summary cards. The main feature is a 'Bottleneck Analytics' bar chart showing average time spent per module, highlighting one module in red where students are stuck the longest. Below it, a data table listing students, their current module, and time spent."