# Academy - Specification produit et fonctionnelle

## 1. Vision produit

Academy est une plateforme SaaS de formation, d'onboarding et de validation de livrables metier.

L'objectif n'est pas seulement d'afficher des cours. L'application doit permettre a une entreprise de structurer des parcours, d'assigner les bonnes personnes, de guider les apprenants, de recevoir des soumissions, de corriger avec plusieurs couches de validation et de piloter les blocages depuis un espace admin clair.

Le produit est pense pour plusieurs domaines metier :

- Automation / RPA
- RH
- Marketing
- Finance
- Juridique
- Onboarding general
- Procedure interne
- Quiz ou video obligatoire
- Tout autre domaine cree par un Product Owner

La version actuelle est un prototype front avance. Les donnees sont conservees localement dans le navigateur via `localStorage`. Le backend viendra ensuite pour remplacer la persistance locale, les droits serveur, les fichiers reels, les soumissions reelles, le runner Python et l'appel IA.

## 2. Concepts principaux

### Tenant

Un tenant correspond a une entreprise cliente.

Exemples :

- Aurora Logistics
- Nova Retail

Un tenant contient :

- des espaces
- des personnes
- des Product Owners
- des groupes d'affectation
- des parcours publies
- des soumissions
- une activite

### Espace

Un espace est un domaine ou un contexte de formation dans une entreprise.

Exemples :

- Espace RPA
- Espace RH
- Espace Marketing
- Espace Finance

Un cours est toujours rattache a un seul espace.

Si un utilisateur a acces a plusieurs espaces, il doit choisir dans quel espace il cree ou publie le cours.

### Parcours

Un parcours est l'ordre pedagogique des cours dans un espace.

Exemple :

- P1 - SAP & SharePoint
- P2 - Contrats juridiques
- P3 - Reporting finance
- P4 - Onboarding RH
- P5 - Certification

Le Product Owner peut modifier l'ordre :

- passer un cours en P1
- pousser l'ancien P1 en P2
- deplacer un cours vers le haut ou vers le bas
- supprimer un cours
- archiver un cours
- republier un parcours

### Cours

Un cours est une unite de formation publiee dans un espace.

Un cours peut etre :

- document simple
- onboarding
- automation / RPA
- video + quiz
- quiz only
- procedure metier
- contenu mixte

Un cours contient :

- un titre
- une description
- une difficulte
- une duree estimee
- des tags
- des blocs pedagogiques
- des ressources
- des prerequis
- des regles de validation
- une configuration de soumission
- un mode d'acces

### Soumission

Une soumission correspond au livrable depose par un apprenant.

Elle peut contenir :

- un fichier principal
- des pieces jointes
- une URL
- un package
- un fichier de sortie attendu
- un score
- un verdict IA
- un verdict Python
- une synthese finale
- un historique de tentatives

## 3. Roles

### Administrateur plateforme

Role futur backend.

Responsabilites :

- creer un tenant
- creer un Product Owner
- superviser l'ensemble des entreprises
- gerer les droits globaux
- auditer les actions sensibles

### Product Owner entreprise

Role tenant-level.

Responsabilites :

- creer des espaces
- creer des cours
- publier un parcours
- changer l'ordre P1/P2/P3
- affecter des apprenants et tuteurs
- suivre les blocages
- forcer une validation si necessaire
- exporter les donnees

Important : le Product Owner depend de l'entreprise, pas d'un espace.

### Tuteur

Role rattache a un ou plusieurs espaces.

Responsabilites :

- suivre les apprenants
- relire les tentatives
- aider sur les blocages
- envoyer des messages
- planifier des sessions
- commenter les soumissions

### Apprenant

Role rattache a un espace.

Responsabilites :

- suivre son parcours
- lire les cours
- telecharger les ressources
- sauvegarder sa progression
- deposer un livrable
- consulter son feedback
- corriger et resoumettre

### Nouvel arrivant

Role proche de l'apprenant, utilise surtout pour les parcours d'onboarding.

## 4. Navigation principale

Le header contient :

- logo Academy
- selection entreprise
- selection espace
- navigation principale
- recherche globale
- notifications
- profil utilisateur

Navigation principale :

- Parcours
- Cours
- Apprenants
- Soumissions

Le but est de conserver un vocabulaire stable partout.

Les mots a utiliser dans l'interface :

- Parcours
- Cours
- Apprenants
- Soumissions

Les mots a eviter en frontal si possible :

- module
- projet
- exercice
- training item

Exception : RPA peut encore parler de projet quand il s'agit du livrable metier, mais l'objet produit reste un cours.

## 5. Recherche globale

La command palette doit permettre de retrouver :

- une action rapide
- une page admin
- un cours de l'espace
- un brouillon
- un apprenant de l'espace
- une autre personne de l'entreprise
- une soumission recente
- un favori
- une activite recente

Sections actuelles :

- Actions rapides
- Pages
- Cours de l'espace
- Brouillons
- Apprenants de l'espace
- Autres personnes de l'entreprise
- Soumissions recentes
- Favoris
- Dernieres activites

Objectif UX :

- chercher depuis n'importe ou
- aller vite vers un cours ou une fiche apprenant
- eviter de multiplier les menus

## 6. Experience apprenant

### Dashboard apprenant

Le dashboard apprenant doit repondre a trois questions :

- Ou j'en suis ?
- Qu'est-ce que je dois faire maintenant ?
- Qu'est-ce qu'il me manque pour valider ?

Elements presents :

- onboarding apprenant dismissible
- carte de reprise de session
- prochaine action
- progression globale
- parcours pedagogique
- statuts de cours
- historique personnel des soumissions
- cours publies dans l'espace
- favoris
- jalons

Statuts visibles :

- Pas commence
- En cours
- Soumis
- Refuse
- Valide
- Verrouille

### Page Mon espace

La page Mon espace centralise :

- reprise
- cours assignes
- soumissions recentes
- favoris
- jalons

Objectif :

- eviter que l'apprenant cherche son prochain cours
- donner une page personnelle stable

### Page Mes soumissions

Cette page doit afficher :

- toutes les tentatives
- le score
- le verdict
- le cours concerne
- la date
- le feedback final

Objectif futur :

- comparer les tentatives
- afficher ce qui progresse
- afficher ce qui regresse

### Mode focus

Le mode focus apprenant sert a lire un cours sans distraction.

Principes :

- moins de navigation
- contenu centrique
- CTA de progression visible
- retour simple au parcours

## 7. Experience admin

### Menu administration

Le menu admin est organise en trois groupes :

- Pilotage
- Cours
- Organisation

Pilotage :

- Vue d'ensemble
- Apprenants
- A risque
- Blocages

Cours :

- Creer un cours
- Catalogue
- En difficulte
- Brouillons

Organisation :

- Parcours tenant
- Tenants & espaces

Objectif UX :

- rester compact
- garder les labels visibles
- eviter une barre d'icones incomprehensible
- eviter les gros menus decoratifs

### Tableau de bord admin

Le dashboard admin affiche :

- KPI apprenants suivis
- KPI cours publies
- KPI progression
- KPI apprenants a risque
- parcours tenant
- file d'actions
- setup PO
- cours en difficulte
- suivi des apprenants

Actions disponibles :

- creer un cours
- exporter
- gerer le parcours
- filtrer les apprenants a risque
- ouvrir une fiche apprenant
- preparer une revue tuteur

### Apprenants a risque

Objectif :

- isoler les apprenants qui bloquent
- afficher depuis combien de temps
- montrer le cours concerne
- proposer une action immediate

### Cours en difficulte

Objectif :

- identifier les cours avec trop d'echecs
- voir les temps moyens trop longs
- comprendre les points bloquants

### Brouillons

Objectif :

- retrouver les cours non publies
- terminer un brouillon
- supprimer ou archiver
- eviter les doublons "Brouillons" et "Brouillons a finir"

### Catalogue cours

Le catalogue doit permettre :

- filtrer par domaine
- filtrer par type
- filtrer par statut
- filtrer par auteur
- filtrer par espace
- changer l'ordre
- modifier
- supprimer
- dupliquer
- publier

## 8. Builder de cours

Le builder est un element central du produit.

### Modes de creation

Modes prevus :

- Rapide
- Standard
- Avance

Objectif :

- rapide pour un cours simple
- standard pour un cours complet
- avance pour RPA, regles, output, validation

### Templates

Templates actuels ou prevus :

- RPA
- RH
- Onboarding
- Procedure
- Quiz only
- Video + quiz

Quand un template est selectionne, le builder doit pre-remplir :

- titre
- description
- type de cours
- blocs
- ressources exemples
- regles conseillees
- contraintes de soumission

### Blocs disponibles

Blocs riches :

- heading
- text
- callout
- checklist
- table
- accordion
- attachment
- image avec legende
- video obligatoire
- quiz
- checkpoint
- livrable attendu
- exemple correct
- exemple incorrect

### Drag and drop

Le builder doit permettre :

- deplacer un bloc
- reordonner les sections
- dupliquer un bloc
- supprimer un bloc
- sauvegarder un bloc comme modele

### Undo / redo

Objectif :

- permettre de revenir en arriere pendant la creation
- afficher visuellement si undo ou redo est disponible

### Apercu apprenant

L'apercu doit montrer :

- rendu desktop
- rendu tablette
- rendu mobile
- vue comme apprenant
- vue comme admin

### Validation avant publication

Avant publication, le builder doit afficher :

- ce qui manque
- ce qui bloque
- ce qui est incoherent
- les warnings
- un score qualite
- un score lisibilite
- un effort apprenant estime

## 9. Module RPA

Le module RPA est un module metier specialise, pas une logique globale obligatoire.

Il doit rester optionnel selon l'espace :

- active pour Espace RPA
- non visible pour RH ou Marketing sauf si necessaire

### Sections RPA attendues

Dans le detail d'un cours RPA :

- Contexte
- Regles
- Ressources
- Output attendu
- Soumission
- Correction

### Output attendu

Le Product Owner doit pouvoir definir :

- type de fichier attendu
- fichier exemple
- colonnes attendues
- types de colonnes
- valeurs exemples
- contraintes
- preview CSV
- preview JSON
- preview XLSX
- cas correct
- cas incorrect

Types de fichier :

- csv
- json
- xlsx
- pdf
- nupkg
- zip
- txt
- xml
- xaml
- autre

### Generation du schema

Modes prevus :

- fichier exemple
- brief texte
- prompt IA

Avec fichier exemple :

- detection du type
- lecture des colonnes
- inference des types
- generation de valeurs exemples
- generation de cas de test

### Soumission RPA

Le PO peut definir :

- type principal attendu
- pieces jointes autorisees
- taille max
- nombre max de fichiers
- nommage attendu

Exemple :

- fichier principal : `.nupkg`
- pieces jointes : `.xlsx`, `.pdf`, `.zip`
- taille max : 50 MB
- max fichiers : 2
- pattern : `{workspace}-{course}-{learner}`

### Anti-patterns

Anti-patterns RPA :

- hardcode
- credentials en dur
- selecteurs fragiles
- absence de logs
- workflow trop dense
- pas de gestion d'exceptions
- absence de REFramework si obligatoire

## 10. Correction

La correction doit etre credible et separer les couches.

### Couche IA

L'IA verifie :

- comprehension du brief
- conformite metier
- lisibilite
- coherence globale
- justification
- respect des regles IA

Les regles IA sont ajoutees au prompt.

Elles ne remplacent pas les controles deterministes.

### Couche Python

Le runner Python verifie :

- fichiers reels
- structure attendue
- regles deterministes
- seuils bloquants
- schema de sortie
- anti-patterns detectables

Dossier actuel :

`validators/python`

Fichiers importants :

- `runner.py`
- `prompt_builder.py`
- `PROMPT_TEMPLATE.md`
- `example_config.json`
- `example_llm_payload.json`
- `requirements.txt`

Regles Python actuelles :

- `reframework_required.py`
- `max_activities.py`
- `no_hardcoded_credentials.py`
- `structured_logs.py`
- `exception_handling.py`
- `selector_quality.py`
- `output_schema.py`
- `invoke_workflow_required.py`

### Synthese finale

La synthese finale doit combiner :

- verdict IA
- verdict Python
- score par critere
- blocages
- warnings
- actions de correction

### Historique

L'historique doit montrer :

- tentative 1
- tentative 2
- tentative 3
- score
- delta
- ce qui s'ameliore
- ce qui regresse

## 11. Notifications et activite

Academy possede :

- centre de notifications
- panneau de notifications
- centre d'activite
- favoris
- toasts

Notifications possibles :

- cours publie
- soumission recue
- soumission validee
- soumission refusee
- apprenant contacte
- tuteur assigne
- analyse relancee
- validation forcee

## 12. Donnees locales actuelles

Stockage local :

- tenant state
- cours publies
- brouillons
- progression
- soumissions
- notifications
- favoris
- messages
- sessions

Fichiers principaux :

- `src/app/data/tenantStore.ts`
- `src/app/data/courseStore.ts`
- `src/app/data/academyStore.ts`
- `src/app/data/projectsData.ts`

Limite :

- ce n'est pas un backend
- pas de securite serveur
- pas de fichiers reels persistants
- pas de droits serveur
- pas de multi-utilisateur reel

## 13. Routes principales

Routes apprenant :

- `/`
- `/mon-espace`
- `/mon-planning`
- `/soumissions`
- `/notifications`
- `/activite`
- `/cours/:id`
- `/projet/:id`

Routes admin :

- `/admin`
- `/admin/apprenants`
- `/admin/apprenants-a-risque`
- `/admin/nouveau-cours`
- `/admin/catalogue-cours`
- `/admin/cours-en-difficulte`
- `/admin/parcours-tenant`
- `/admin/soumissions-bloquees`
- `/admin/brouillons`
- `/admin/tenants`
- `/admin/apprenant/:id`

IDE :

- `/ide/:exerciceId`

L'IDE est desactive par feature flag :

`FEATURE_FLAGS.ide = false`

## 14. Standards UI / UX

Regles visuelles :

- bleu = action
- vert = valide
- orange = attention
- rouge = bloquant
- gris = neutre ou inactif

Principes :

- pas de textes trop longs dans les cartes
- pas de double navigation inutile
- pas de gros hero marketing pour les ecrans admin
- actions principales visibles
- contenu scannable
- labels explicites dans l'admin
- etats vides utiles
- confirmations pour actions sensibles
- feedback inline pour erreurs de formulaire

Responsive :

- tables transformees en cartes si necessaire
- CTA visibles
- navigation mobile scrollable
- detail cours empile sur tablette
- builder avec preview sous l'editeur sur petit ecran

## 15. Ce qui est deja present

Fonctionnel front :

- multi-tenant local
- selection entreprise
- selection espace
- creation d'espace
- creation de personnes
- assignation a un espace
- dashboard apprenant
- mon espace
- mes soumissions
- notifications
- activite
- favoris
- dashboard admin
- menu admin
- fiche apprenant
- catalogue cours
- parcours tenant
- brouillons
- cours en difficulte
- apprenants a risque
- builder cours
- templates
- blocs riches
- RPA builder
- output attendu
- regles IA
- regles Python configurees
- anti-patterns
- soumission locale
- correction simulee
- error boundary

## 16. Ce qui manque encore cote front

Priorite P0 :

- finir l'unification du vocabulaire sur les anciens textes
- supprimer les derniers textes "projet" quand il s'agit d'un cours
- rendre tous les ecrans lourds plus denses et coherents
- rendre le builder plus lisible en mode avance
- fiabiliser le responsive du detail cours
- clarifier les statuts de soumission partout

Priorite P1 :

- preview apprenant encore plus fidele dans le builder
- quality score de cours
- readability score
- effort apprenant estime
- diff attendu vs rendu encore plus visuel
- comparaison de tentatives
- filtres persistants admin
- colonnes configurables
- bulk actions plus completes

Priorite P2 :

- bibliotheque de templates internes
- sauvegarder un bloc comme modele
- planning apprenant plus riche
- favoris admin
- quick create global
- import/export complet de parcours
- mode audit admin

## 17. Futur backend

Le backend devra gerer :

- authentification
- tenants
- workspaces
- roles
- permissions
- groupes
- cours
- versions de cours
- brouillons
- publications
- affectations
- soumissions
- fichiers
- runner Python
- appel IA
- prompt dynamique
- stockage des verdicts
- historique de tentatives
- notifications serveur
- exports
- audit log

Modele minimum backend :

- `tenants`
- `workspaces`
- `users`
- `workspace_assignments`
- `courses`
- `course_versions`
- `course_blocks`
- `learning_paths`
- `course_assignments`
- `submissions`
- `submission_files`
- `evaluations`
- `evaluation_rules`
- `notifications`
- `audit_events`

## 18. Commandes de developpement

Installer :

```bash
npm install
```

Lancer :

```bash
npm run dev
```

Build :

```bash
npm run build
```

Preview :

```bash
npm run preview
```

## 19. Notes proxy npm

Si le reseau entreprise utilise un proxy :

```powershell
$env:HTTP_PROXY="http://proxy.lyreco.com:8080"
$env:HTTPS_PROXY="http://proxy.lyreco.com:8080"
npm install
```

Ou via config npm :

```bash
npm config set proxy http://proxy.lyreco.com:8080
npm config set https-proxy http://proxy.lyreco.com:8080
npm install
```

## 20. Definition de qualite produit

Academy doit etre :

- simple pour un apprenant
- puissant pour un Product Owner
- clair pour un tuteur
- modulaire par domaine
- fiable pour la correction
- explicite sur les blocages
- compatible avec plusieurs entreprises
- adaptable sans casser les modules existants

Le principe cle :

Chaque espace peut avoir ses propres cours, ses propres regles, ses propres livrables et ses propres criteres, mais le parcours et l'experience utilisateur restent coherents partout.

## 21. Differenciateurs face a 360Learning, Moodle et LMS classiques

Academy ne doit pas etre seulement une bibliotheque de contenus. Le positionnement cible est un Learning Operating System pour entreprise.

Differenciateurs principaux :

- multi-tenant natif
- espaces metier modulaires par entreprise
- parcours ordonnes P1/P2/P3
- builder de cours modulaire
- RPA/output/correction specialisee
- soumissions avec verdict IA + Python + synthese finale
- pilotage des blocages
- recommandations intelligentes
- passeport de competences
- cockpit de maturite LMS
- quality score des cours
- actions admin massives
- recherche globale
- notifications et activite integrees
- suivi des tentatives
- modules metier activables sans casser le socle

### 21.1 Learning OS apprenant

Ajout front :

- carte `Learning OS`
- prochaine action intelligente
- suivi des cours ouverts
- suivi des validations
- suivi des tentatives a reprendre
- recommandation contextualisee
- passeport de competences
- acces rapide aux soumissions
- acces rapide au planning

Objectif :

- reduire la friction apprenant
- eviter le syndrome "catalogue de cours"
- guider l'utilisateur vers la meilleure action suivante
- rendre la progression plus concrete qu'un simple pourcentage

### 21.2 Passeport de competences

Le passeport de competences permet de montrer un niveau operationnel par axe.

Axes actuels :

- Contexte metier
- Qualite livrable
- Autonomie
- Conformite

Evolution possible :

- axes configurables par espace
- score calcule depuis les soumissions
- comparaison entre tentatives
- badge par competence
- preuve liee au livrable

### 21.3 Academy Intelligence admin

Ajout front :

- cockpit de maturite LMS
- quality score des cours
- risque de blocage
- maturite parcours
- segmentation entreprise
- actions massives rapides

Objectif :

- donner au PO une vision de pilotage
- identifier ce qui empeche le passage a l'echelle
- transformer les donnees de formation en actions concretes

### 21.4 Quality score

Le quality score estime si un cours est suffisamment structure.

Signaux utilises dans le prototype :

- nombre de blocs
- ressources disponibles
- regles de validation
- output attendu
- prerequis
- assistance IA

Evolution backend :

- score de lisibilite
- score de densite
- score de coherence pedagogique
- score de validation
- score d'effort apprenant

### 21.5 Risque de blocage

Le risque de blocage met en avant les cours ou apprenants qui demandent une intervention.

Signaux actuels :

- cours verrouilles
- soumissions refusees
- progression globale
- nombre de tentatives

Evolution backend :

- temps reel sur cours
- absence de connexion
- blocage par prerequis
- echecs consecutifs
- baisse de score
- message tuteur non lu

### 21.6 Actions massives

Academy doit permettre au PO de piloter vite.

Actions massives cible :

- affecter une cohorte
- relancer des apprenants
- changer l'ordre du parcours
- dupliquer un cours
- archiver un cours
- changer d'espace
- exporter les rapports
- publier une version

## 22. Roadmap pour concurrencer les LMS existants

### P0 - Produit credible

- navigation claire et stable
- builder de cours solide
- progression apprenant lisible
- soumission et feedback lisibles
- dashboard admin actionnable
- catalogue admin propre
- parcours tenant ordonnable
- notifications et recherche globale
- mode RPA premium

### P1 - Produit differenciant

- Learning OS apprenant
- passeport de competences
- cockpit de maturite admin
- quality score cours
- diff attendu vs rendu
- historique de tentatives compare
- bibliotheque de blocs reutilisables
- templates par domaine
- bulk actions admin

### P2 - Produit haut de gamme

- marketplace interne de templates
- recommandations IA de parcours
- generation IA de cours depuis brief
- generation IA de quiz
- analytics cohortes
- analyse de competence par equipe
- certification et badges verifies
- parcours adaptatif selon score
- audit trail complet
- reporting exec

### P3 - Socle enterprise

- SSO
- SCIM
- RBAC serveur
- API publique
- webhooks
- connecteurs LMS/HRIS
- stockage documentaire
- audit securite
- versioning complet
- multi-region

## 23. Positionnement produit cible

Phrase courte :

Academy est une plateforme de formation operationnelle qui relie cours, livrables, correction et pilotage metier.

Ce que 360Learning et Moodle font bien :

- catalogue
- LMS generaliste
- suivi de formations
- contenus
- quiz
- administration

Ce qu'Academy doit faire mieux :

- transformer un cours en workflow de validation
- faire du livrable une preuve de competence
- offrir des modules metier comme RPA
- guider l'apprenant action par action
- aider le PO a piloter les blocages
- combiner IA et regles deterministes
- rester modulaire par domaine

## 24. Nouveaux composants ajoutes

### `LearnerExperienceLayer`

Fichier :

`src/app/components/LearnerExperienceLayer.tsx`

Role :

- ajoute un cockpit apprenant
- calcule une prochaine action
- affiche un passeport de competences
- donne acces aux soumissions et au planning

### `AdminCompetitiveLayer`

Fichier :

`src/app/components/AdminCompetitiveLayer.tsx`

Role :

- ajoute un cockpit de maturite LMS
- calcule un quality score
- calcule un risque de blocage
- affiche une segmentation tenant
- propose des actions massives
