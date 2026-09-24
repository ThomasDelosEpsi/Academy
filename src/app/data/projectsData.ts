// ── Shared project data used by Dashboard + ProjectDetail ────────────────────

export type ProjectStatus = "completed" | "in_progress" | "locked";

export interface ProjectRule {
  label: string;
  detail: string;
  severity: "blocking" | "warning";
}

export interface ProjectResource {
  id: number;
  label: string;
  desc: string;
  type: "ZIP" | "PDF" | "XAML" | "LIEN" | "XLSX" | "VIDEO";
  size: string | null;
}

export interface Project {
  id: number;
  status: ProjectStatus;
  title: string;
  shortTitle: string;
  description: string;
  context: string;
  duration: string;
  tags: string[];
  completedDate?: string;
  completionTime?: string;
  progress?: number;
  timerStart?: number;
  requires?: string;
  rules: ProjectRule[];
  resources: ProjectResource[];
}

export const PROJECTS: Project[] = [
  {
    id: 1,
    status: "completed",
    title: "SAP & SharePoint Automation",
    shortTitle: "SAP & SharePoint",
    description: "Automatisation de l'extraction des données SAP et de leur synchronisation dans SharePoint.",
    context: "Une organisation génère chaque mois plus de 2 000 lignes de données SAP (articles, fournisseurs, stocks) qui doivent être synchronisées manuellement dans des bibliothèques SharePoint. Ce projet vise à automatiser ce flux de bout en bout.",
    duration: "2 jours",
    tags: ["SAP", "SharePoint", "Excel"],
    completedDate: "03 Avril 2026",
    completionTime: "04h 12m",
    rules: [
      { label: "Flowchart obligatoire", detail: "Le Main.xaml doit utiliser une Flowchart comme activité racine.", severity: "blocking" },
      { label: "Max 50 activités", detail: "Le fichier principal ne doit pas dépasser 50 activités.", severity: "blocking" },
      { label: "Pas de credentials en dur", detail: "Aucun mot de passe ou clé API en clair dans le code.", severity: "blocking" },
      { label: "Logs structurés", detail: "Tous les Log Message doivent suivre le format JSON défini.", severity: "warning" },
    ],
    resources: [
      { id: 1, label: "Export SAP de référence", desc: "Fichier Excel avec les données d'exemple", type: "XLSX", size: "2.1 MB" },
      { id: 2, label: "Template Flowchart UiPath", desc: "Modèle XAML obligatoire", type: "XAML", size: "3.1 KB" },
      { id: 3, label: "Guide de Soumission P1", desc: "Instructions pas à pas", type: "PDF", size: "512 KB" },
    ],
  },
  {
    id: 2,
    status: "in_progress",
    title: "Extraction Contrats Juridiques",
    shortTitle: "Contrats Juridiques",
    description: "Extraction automatique des clauses clés depuis des PDF juridiques et consolidation en base de données.",
    context: "Le service juridique traite chaque semaine plus de 150 contrats PDF en provenance de fournisseurs européens. L'extraction manuelle des clauses (montant, échéance, pénalités) est chronophage et source d'erreurs. Ce projet automatise l'extraction NLP et la consolidation SQL.",
    duration: "3 jours",
    tags: ["PDF", "NLP", "SQL"],
    progress: 20,
    timerStart: 9900,
    rules: [
      { label: "Pattern REFramework", detail: "Le workflow doit implémenter le pattern Robot Enterprise Framework.", severity: "blocking" },
      { label: "Max 50 activités par XAML", detail: "Aucun fichier ne doit dépasser 50 activités.", severity: "blocking" },
      { label: "Pas de credentials en dur", detail: "Connexion SQL via Orchestrator Asset.", severity: "blocking" },
      { label: "Gestion des exceptions", detail: "Chaque activité critique doit être dans un Try/Catch.", severity: "warning" },
      { label: "Logs structurés JSON", detail: "Format : { ProjectId, Status, Duration, Error }", severity: "warning" },
    ],
    resources: [
      { id: 1, label: "Fichiers PDF de test (ZIP)", desc: "20 contrats de démonstration", type: "ZIP", size: "12.4 MB" },
      { id: 2, label: "Documentation API NLP", desc: "Endpoints et authentification", type: "LIEN", size: null },
      { id: 3, label: "Template Flowchart UiPath", desc: "Modèle XAML obligatoire", type: "XAML", size: "3.1 KB" },
      { id: 4, label: "Guide de Soumission P2", desc: "Instructions pas à pas", type: "PDF", size: "842 KB" },
    ],
  },
  {
    id: 3,
    status: "locked",
    title: "Reporting Finance Automatisé",
    shortTitle: "Reporting Finance",
    description: "Génération automatique des rapports financiers mensuels depuis les ERP.",
    context: "Les équipes Finance génèrent chaque fin de mois 12 rapports consolidés depuis 3 ERP différents (SAP, Oracle, Power BI). Ce projet automatise l'extraction, la mise en forme et la distribution par email des rapports.",
    duration: "3 jours",
    tags: ["Finance", "ERP", "Power BI"],
    requires: "validation IA du Projet 2",
    rules: [
      { label: "REFramework + Orchestrator Queue", detail: "Traitement par queue d'items.", severity: "blocking" },
      { label: "Gestion des erreurs comptables", detail: "Tout écart > 0.01€ doit être logué.", severity: "blocking" },
      { label: "Format rapport normalisé", detail: "Chaque rapport suit le template Excel Finance défini.", severity: "warning" },
    ],
    resources: [
      { id: 1, label: "Template Rapport Finance", desc: "Excel normalisé", type: "XLSX", size: "1.8 MB" },
      { id: 2, label: "Guide Oracle ERP", desc: "Sélecteurs et navigation", type: "PDF", size: "2.1 MB" },
    ],
  },
  {
    id: 4,
    status: "locked",
    title: "Onboarding RH Digital",
    shortTitle: "Onboarding RH",
    description: "Automatisation du parcours d'intégration des nouveaux collaborateurs (HR, IT, Logistique).",
    context: "Chaque nouvelle embauche déclenche 23 actions manuelles réparties entre RH, IT, et Logistique. Ce projet crée un robot maître qui orchestre toutes ces actions en parallèle via SIRH, Active Directory et le système de commandes logistiques.",
    duration: "4 jours",
    tags: ["RH", "SIRH", "Email"],
    requires: "validation IA du Projet 3",
    rules: [
      { label: "REFramework multi-queue", detail: "Une queue par département (RH, IT, Logistique).", severity: "blocking" },
      { label: "Gestion des timeouts SIRH", detail: "Retry automatique avec backoff exponentiel.", severity: "blocking" },
      { label: "Notification email structurée", detail: "Email de confirmation au manager et au nouveau collaborateur.", severity: "warning" },
    ],
    resources: [
      { id: 1, label: "Template REFramework", desc: "Point de départ obligatoire", type: "XAML", size: "15 KB" },
      { id: 2, label: "Données de test SIRH", desc: "Jeu de test RH", type: "ZIP", size: "4.2 MB" },
    ],
  },
  {
    id: 5,
    status: "locked",
    title: "Certification Expert",
    shortTitle: "Certification Expert",
    description: "Projet fil rouge intégrant toutes les compétences acquises. Audit et certification finale.",
    context: "Ce projet de certification évalue l'ensemble des compétences développées. L'apprenant doit livrer une automatisation end-to-end répondant à un brief métier réel, puis passer un audit de code devant le jury de certification Academy.",
    duration: "5 jours",
    tags: ["Audit", "Certification", "End-to-End"],
    requires: "validation IA du Projet 4",
    rules: [
      { label: "Architecture complète REFramework", detail: "Implémentation stricte sans déviation.", severity: "blocking" },
      { label: "Couverture de tests > 80%", detail: "Tests unitaires et d'intégration obligatoires.", severity: "blocking" },
      { label: "Documentation complète", detail: "README, annotations XAML, guide d'exploitation.", severity: "blocking" },
      { label: "Performance < 30s par transaction", detail: "Benchmark mesuré sur 100 transactions.", severity: "warning" },
    ],
    resources: [
      { id: 1, label: "Brief certification complète", desc: "Cahier des charges final", type: "PDF", size: "3.4 MB" },
      { id: 2, label: "Grille d'évaluation jury", desc: "Critères et pondération", type: "XLSX", size: "120 KB" },
    ],
  },
];
