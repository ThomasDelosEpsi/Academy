import { ArrowLeft, Bot, CheckCircle2, Download, GripVertical, Plus, Save, Sparkles, Star, Trash2, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import * as XLSX from "xlsx";
import { addNotification } from "../data/academyStore";
import { buildPublishedCourse, createDefaultBlocks, generateAiQuizSuggestions, getCourseAccessRules, getCourseById, getDraft, getPublishedCoursesForWorkspace, getWorkspaceQuizTargets, saveCourseAccessRule, saveDraft, savePublishedCourse } from "../data/courseStore";
import type { CourseBlock, CourseBuilderMode, CoursePrerequisite, CourseTemplateType, CourseType, PublishedCourse, RpaAntiPattern, RpaOutputColumn, RpaPythonRule, RpaResource, RpaSampleRow, RpaSchemaGenerationMode, RpaValidationRule, RulePackId } from "../data/courseStore";
import { getAccessibleWorkspacesForCurrentUser, getCurrentTenant, getTenantGroupOptions, getWorkspaceRoster, useTenantStore } from "../data/tenantStore";
import { useConfirm } from "./FeedbackProvider";

const OUTPUT_TYPES = ["CSV", "JSON", "Excel (.xlsx)"];
const COURSE_TYPES: CourseType[] = ["document", "onboarding", "automation", "blended"];
const SUBMISSION_FILE_TYPES = ["nupkg", "pdf", "xlsx", "xls", "csv", "json", "zip", "xaml", "txt", "docx", "pptx"];
const GENERIC_BLOCK_TYPES: CourseBlock["type"][] = ["heading", "text", "callout", "checklist", "table", "accordion", "attachment", "deliverable", "example", "image", "video", "quiz", "checkpoint"];
const OUTPUT_SCHEMA_SOURCES: { id: RpaSchemaGenerationMode; label: string; description: string }[] = [
  { id: "file_example", label: "Fichier exemple", description: "Construit le schema a partir d'un csv, json ou xlsx." },
  { id: "text_brief", label: "Brief texte", description: "Genere une premiere structure a partir d'un brief fonctionnel." },
  { id: "ai_prompt", label: "Prompt IA", description: "Prepare le schema attendu depuis une consigne technique plus directive." },
];
const AI_RULE_LIBRARY: RpaValidationRule[] = [
  {
    id: 1,
    key: "brief_compliance",
    label: "Respect strict du brief",
    description: "Le rendu doit suivre exactement les consignes du cas, sans etapes inventees ni interpretation libre.",
    category: "Consignes",
    enabled: true,
    type: "Brief compliance",
    value: "Le correcteur penalise toute divergence avec le brief, les livrables et les contraintes explicites.",
    placeholder: "Precise ici les points non negociables du brief.",
    severity: "blocking",
  },
  {
    id: 2,
    key: "workflow_structure",
    label: "Structure du workflow",
    description: "Le correcteur verifie que la solution est decoupee, lisible et maintenable.",
    category: "Architecture",
    enabled: true,
    type: "Workflow structure",
    value: "Favoriser une decomposition claire, des noms explicites et une logique facile a relire.",
    placeholder: "Ex: sous-workflows obligatoires, nomenclature attendue, lisibilite.",
    severity: "blocking",
  },
  {
    id: 3,
    key: "business_reliability",
    label: "Fiabilite metier",
    description: "Le traitement doit produire un resultat metier coherent et exploitable sans ambiguite.",
    category: "Metier",
    enabled: true,
    type: "Business reliability",
    value: "Verifier la coherence du resultat, la completude des champs et l'absence de valeurs incoherentes.",
    placeholder: "Ex: champs obligatoires, regles de coherence, valeurs interdites.",
    severity: "blocking",
  },
  {
    id: 4,
    key: "exception_strategy",
    label: "Gestion des exceptions fonctionnelles",
    description: "Le robot doit traiter les cas d'erreur attendus et tracer les anomalies exploitables.",
    category: "Robustesse",
    enabled: true,
    type: "Exception strategy",
    value: "Le correcteur attend une gestion claire des erreurs metier, des rejets et des cas non conformes.",
    placeholder: "Ex: comment traiter les dossiers incomplets, doublons, donnees manquantes.",
    severity: "blocking",
  },
  {
    id: 5,
    key: "logging_quality",
    label: "Qualite des logs et preuves",
    description: "Le rendu doit permettre a un tuteur ou un support de comprendre ce qui a ete fait.",
    category: "Observabilite",
    enabled: false,
    type: "Logging quality",
    value: "Evaluer la qualite des logs, des messages de suivi et des preuves de traitement.",
    placeholder: "Ex: identifiant dossier, statut, detail erreur, trace de fin.",
    severity: "warning",
  },
  {
    id: 6,
    key: "anti_shortcuts",
    label: "Interdire les raccourcis IA ou hardcodes",
    description: "Le correcteur signale les sorties trop opportunistes, statiques ou manifestement deduites sans logique solide.",
    category: "Fiabilite",
    enabled: true,
    type: "Anti shortcuts",
    value: "Penaliser les valeurs hardcodees, les resultats figes et les solutions qui simulent sans vraiment traiter.",
    placeholder: "Ex: interdire les valeurs par defaut si l'entree n'est pas lue.",
    severity: "blocking",
  },
  {
    id: 7,
    key: "output_readiness",
    label: "Qualite du livrable final",
    description: "Le fichier ou resultat final doit etre exploitable directement par le metier cible.",
    category: "Output",
    enabled: true,
    type: "Output readiness",
    value: "Verifier la conformite du livrable final, sa lisibilite et son aptitude a etre reutilise.",
    placeholder: "Ex: ordre des colonnes, nommage, format, absence de colonnes parasites.",
    severity: "blocking",
  },
];
const PYTHON_RULE_LIBRARY: RpaPythonRule[] = [
  {
    id: "py-max-activities",
    key: "max_activities",
    label: "Limiter le nombre d'activites par XAML",
    description: "Refuse un workflow trop dense et force la decomposition.",
    category: "Architecture",
    enabled: true,
    severity: "blocking",
    scriptName: "max_activities.py",
    param: "50",
    paramLabel: "Activites max",
  },
  {
    id: "py-reframework",
    key: "reframework_required",
    label: "Verifier le pattern REFramework",
    description: "Controle Init, GetTransactionData et Process_Transaction.",
    category: "Architecture",
    enabled: true,
    severity: "blocking",
    scriptName: "reframework_required.py",
  },
  {
    id: "py-no-creds",
    key: "no_hardcoded_credentials",
    label: "Interdire les credentials en dur",
    description: "Cherche les mots de passe, tokens ou secrets codes en dur.",
    category: "Securite",
    enabled: true,
    severity: "blocking",
    scriptName: "no_hardcoded_credentials.py",
  },
  {
    id: "py-logs",
    key: "structured_logs",
    label: "Exiger des logs structures",
    description: "Force un format de logs exploitable par le monitoring.",
    category: "Observabilite",
    enabled: false,
    severity: "warning",
    scriptName: "structured_logs.py",
  },
  {
    id: "py-invoke",
    key: "invoke_workflow_required",
    label: "Verifier Invoke Workflow File",
    description: "Encourage la separation en sous-workflows reutilisables.",
    category: "Architecture",
    enabled: false,
    severity: "warning",
    scriptName: "invoke_workflow_required.py",
  },
  {
    id: "py-exc",
    key: "exception_handling",
    label: "Verifier la gestion des exceptions",
    description: "Detecte l'absence de Try/Catch sur les zones critiques.",
    category: "Robustesse",
    enabled: true,
    severity: "blocking",
    scriptName: "exception_handling.py",
  },
  {
    id: "py-selector",
    key: "selector_quality",
    label: "Verifier la qualite des selecteurs",
    description: "Signale les selecteurs trop fragiles ou trop generiques.",
    category: "UI Automation",
    enabled: false,
    severity: "warning",
    scriptName: "selector_quality.py",
  },
  {
    id: "py-output",
    key: "output_schema",
    label: "Verifier le schema de sortie",
    description: "Compare le fichier produit avec les colonnes et types attendus.",
    category: "Output",
    enabled: true,
    severity: "blocking",
    scriptName: "output_schema.py",
  },
];
const ANTI_PATTERN_LIBRARY: RpaAntiPattern[] = [
  {
    id: "anti-hardcode",
    key: "hardcode",
    label: "Interdire les hardcodes",
    description: "Refuser les valeurs fixes, credentials en dur et chemins locaux non parametrables.",
    enabled: true,
    severity: "blocking",
  },
  {
    id: "anti-selectors",
    key: "fragile_selectors",
    label: "Selecteurs fragiles",
    description: "Penaliser les selecteurs absolus, indexes instables et ancres trop volatiles.",
    enabled: true,
    severity: "warning",
  },
  {
    id: "anti-logs",
    key: "missing_logs",
    label: "Absence de logs utiles",
    description: "Exiger des logs lisibles pour suivre la transaction, le statut et l'erreur.",
    enabled: true,
    severity: "warning",
  },
  {
    id: "anti-density",
    key: "dense_workflow",
    label: "Workflow trop dense",
    description: "Bloquer les workflows monolithiques et pousser la decomposition en sous-workflows.",
    enabled: true,
    severity: "blocking",
  },
];

const TEMPLATE_OPTIONS: {
  id: CourseTemplateType;
  label: string;
  description: string;
  builderMode: CourseBuilderMode;
  courseType: CourseType;
}[] = [
  { id: "rpa", label: "RPA", description: "Parcours technique avec ressources, regles IA/Python, output et rendu de package.", builderMode: "rpa", courseType: "automation" },
  { id: "rh", label: "RH", description: "Cours riche pour onboarding, procedures, documents et quiz RH.", builderMode: "generic", courseType: "document" },
  { id: "onboarding", label: "Onboarding", description: "Parcours d'arrivee avec etapes, video obligatoire et checkpoints.", builderMode: "generic", courseType: "onboarding" },
  { id: "procedure", label: "Procedure", description: "Mode operatoire pas a pas avec sections, images et validations.", builderMode: "generic", courseType: "document" },
  { id: "quiz_only", label: "Quiz only", description: "Evaluation rapide basee sur un ou plusieurs questionnaires.", builderMode: "generic", courseType: "blended" },
  { id: "video_quiz", label: "Video + quiz", description: "Contenu video verrouille puis verification de comprehension.", builderMode: "generic", courseType: "blended" },
];

const DEFAULT_RULE_PACK_BY_TEMPLATE: Record<CourseTemplateType, RulePackId> = {
  rpa: "production",
  rh: "intermediate",
  onboarding: "beginner",
  procedure: "expert",
  quiz_only: "beginner",
  video_quiz: "intermediate",
};

const RULE_PACK_CONFIG: Record<RulePackId, {
  label: string;
  description: string;
  aiSeverities: Partial<Record<string, "blocking" | "warning">>;
  aiEnabled?: string[];
  pythonEnabled?: string[];
  pythonSeverities?: Partial<Record<string, "blocking" | "warning">>;
}> = {
  beginner: {
    label: "Debutant",
    description: "Corrige surtout la comprehension du brief et les erreurs bloquantes de base.",
    aiSeverities: { brief_compliance: "blocking", workflow_structure: "warning", business_reliability: "blocking", exception_strategy: "warning", logging_quality: "warning", anti_shortcuts: "warning", output_readiness: "blocking" },
    aiEnabled: ["brief_compliance", "business_reliability", "output_readiness", "logging_quality"],
    pythonEnabled: ["output_schema"],
    pythonSeverities: { output_schema: "blocking" },
  },
  intermediate: {
    label: "Intermediaire",
    description: "Ajoute robustesse, logs et structure sans exiger encore tous les garde-fous production.",
    aiSeverities: { brief_compliance: "blocking", workflow_structure: "blocking", business_reliability: "blocking", exception_strategy: "blocking", logging_quality: "warning", anti_shortcuts: "blocking", output_readiness: "blocking" },
    aiEnabled: ["brief_compliance", "workflow_structure", "business_reliability", "exception_strategy", "logging_quality", "anti_shortcuts", "output_readiness"],
    pythonEnabled: ["max_activities", "exception_handling", "output_schema"],
    pythonSeverities: { max_activities: "blocking", exception_handling: "blocking", output_schema: "blocking" },
  },
  expert: {
    label: "Expert",
    description: "Force une architecture plus propre et davantage de rigueur sur la maintenabilite.",
    aiSeverities: { brief_compliance: "blocking", workflow_structure: "blocking", business_reliability: "blocking", exception_strategy: "blocking", logging_quality: "warning", anti_shortcuts: "blocking", output_readiness: "blocking" },
    aiEnabled: ["brief_compliance", "workflow_structure", "business_reliability", "exception_strategy", "logging_quality", "anti_shortcuts", "output_readiness"],
    pythonEnabled: ["max_activities", "reframework_required", "exception_handling", "invoke_workflow_required", "output_schema"],
    pythonSeverities: { max_activities: "blocking", reframework_required: "blocking", exception_handling: "blocking", invoke_workflow_required: "warning", output_schema: "blocking" },
  },
  production: {
    label: "Production",
    description: "Active le niveau le plus strict pour un livrable exploitable en contexte reel.",
    aiSeverities: { brief_compliance: "blocking", workflow_structure: "blocking", business_reliability: "blocking", exception_strategy: "blocking", logging_quality: "blocking", anti_shortcuts: "blocking", output_readiness: "blocking" },
    aiEnabled: ["brief_compliance", "workflow_structure", "business_reliability", "exception_strategy", "logging_quality", "anti_shortcuts", "output_readiness"],
    pythonEnabled: ["max_activities", "reframework_required", "no_hardcoded_credentials", "structured_logs", "exception_handling", "selector_quality", "output_schema"],
    pythonSeverities: { max_activities: "blocking", reframework_required: "blocking", no_hardcoded_credentials: "blocking", structured_logs: "warning", exception_handling: "blocking", selector_quality: "warning", output_schema: "blocking" },
  },
};

type CreationMode = "quick" | "standard" | "advanced";

const CREATION_MODE_CONFIG: Record<CreationMode, { label: string; description: string }> = {
  quick: {
    label: "Rapide",
    description: "Aller vite avec un template, les champs essentiels et une publication encadree.",
  },
  standard: {
    label: "Standard",
    description: "Mode recommande pour un cours complet avec apercu et regles visibles.",
  },
  advanced: {
    label: "Avance",
    description: "Expose tous les reglages de structure, de correction et de publication.",
  },
};

type TemplatePreset = {
  title: string;
  description: string;
  tags: string[];
  estimatedMinutes: string;
  difficulty: string;
  blocks: CourseBlock[];
};

type ReusableBlockTemplate = {
  id: string;
  name: string;
  description: string;
  accent: string;
  block: CourseBlock;
};

type BuilderHistorySnapshot = {
  title: string;
  description: string;
  tags: string[];
  blocks: CourseBlock[];
  selectedBlockId: string | null;
};

const isRpaWorkspace = (workspace?: { name?: string; domain?: string }) => /rpa|automation|automatisation|informatique|it|tech/i.test(`${workspace?.name ?? ""} ${workspace?.domain ?? ""}`);
const isPeopleWorkspace = (workspace?: { name?: string; domain?: string }) => /people|rh|hr|onboarding/i.test(`${workspace?.name ?? ""} ${workspace?.domain ?? ""}`);
const isMarketingWorkspace = (workspace?: { name?: string; domain?: string }) => /marketing|content|brand|communication/i.test(`${workspace?.name ?? ""} ${workspace?.domain ?? ""}`);
const newBlock = (type: CourseBlock["type"]): CourseBlock => {
  const stamp = Date.now();
  if (type === "quiz") return { id: `b-${stamp}`, type, title: "Quiz", questions: [{ id: `q-${stamp}`, prompt: "Question", options: ["A", "B", "C", "D"], correctAnswer: 0 }] };
  if (type === "image") return { id: `b-${stamp}`, type, title: "Image", imageUrl: "", caption: "Legende" };
  if (type === "video") return { id: `b-${stamp}`, type, title: "Video obligatoire", videoUrl: "", mandatory: true, lockedSpeed: true, durationSeconds: 180 };
  if (type === "callout") return { id: `b-${stamp}`, type, title: "Callout", body: "Ajoutez ici un message de cadrage important.", tone: "info" };
  if (type === "deliverable") return { id: `b-${stamp}`, type, title: "Livrable attendu", body: "Expliquez ce que l'apprenant doit remettre exactement." };
  if (type === "example") return { id: `b-${stamp}`, type, title: "Exemple correct", body: "Montrez ici un exemple de rendu conforme.", variant: "correct" };
  if (type === "checklist") return { id: `b-${stamp}`, type, title: "Checklist", items: [{ id: `item-${stamp}-1`, label: "Point de controle 1" }, { id: `item-${stamp}-2`, label: "Point de controle 2" }] };
  if (type === "table") return { id: `b-${stamp}`, type, title: "Tableau", columns: ["Colonne 1", "Colonne 2"], rows: [["Valeur 1", "Valeur 2"], ["Valeur 3", "Valeur 4"]] };
  if (type === "accordion") return { id: `b-${stamp}`, type, title: "Accordion", items: [{ id: `acc-${stamp}-1`, title: "Section 1", body: "Contenu de section." }, { id: `acc-${stamp}-2`, title: "Section 2", body: "Ajoutez une explication detaillee." }] };
  if (type === "attachment") return { id: `b-${stamp}`, type, title: "Piece jointe", fileName: "document.pdf", fileType: "PDF", url: "", helperText: "Document a telecharger" };
  return { id: `b-${stamp}`, type, title: "Bloc", body: "Contenu" };
};

const BLOCK_LIBRARY_STORAGE_KEY = "academy_reusable_blocks_v1";

const cloneBlock = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getCalloutToneStyle = (tone: "info" | "warning" | "required") => tone === "warning"
  ? { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412" }
  : tone === "required"
    ? { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" }
    : { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" };

const getExampleVariantStyle = (variant: "correct" | "incorrect") => variant === "correct"
  ? { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", label: "Exemple correct" }
  : { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C", label: "Exemple incorrect" };

const createReusableBlockLibrarySeed = (): ReusableBlockTemplate[] => [
  {
    id: "lib-callout-info",
    name: "Callout info",
    description: "Bloc d'information court pour cadrer le message.",
    accent: "#0EA5E9",
    block: { id: "seed-callout-info", type: "callout", title: "Information importante", body: "Ajoutez ici le contexte utile, la consigne ou l'alerte que l'apprenant doit garder en tete.", tone: "info" },
  },
  {
    id: "lib-checklist",
    name: "Checklist",
    description: "Checklist simple pour verifier une etape.",
    accent: "#16A34A",
    block: { id: "seed-checklist", type: "checklist", title: "Checklist de verification", items: [{ id: "seed-check-1", label: "Confirmer les pre-requis" }, { id: "seed-check-2", label: "Verifier les pieces jointes" }, { id: "seed-check-3", label: "Valider les points de controle" }] },
  },
  {
    id: "lib-livrable",
    name: "Livrable attendu",
    description: "Bloc pour decrire exactement le rendu final.",
    accent: "#7C3AED",
    block: { id: "seed-livrable", type: "deliverable", title: "Livrable attendu", body: "Precisez ici le format du livrable, les champs obligatoires et le niveau de qualite attendu." },
  },
  {
    id: "lib-example-good",
    name: "Exemple correct",
    description: "Montre un exemple de reponse conforme.",
    accent: "#00A05A",
    block: { id: "seed-example-good", type: "example", title: "Exemple correct", body: "Montrez ici un exemple synthétique de rendu conforme pour aider l'apprenant.", variant: "correct" },
  },
  {
    id: "lib-example-bad",
    name: "Exemple incorrect",
    description: "Expose un anti-exemple a eviter.",
    accent: "#DC2626",
    block: { id: "seed-example-bad", type: "example", title: "Exemple incorrect", body: "Documentez ici ce qui ne doit pas etre rendu : erreurs frequentes, hors-sujet, structure incomplete.", variant: "incorrect" },
  },
  {
    id: "lib-video-brief",
    name: "Video + consigne",
    description: "Video obligatoire avec consigne associee.",
    accent: "#D97706",
    block: { id: "seed-video-brief", type: "video", title: "Video a regarder", videoUrl: "", mandatory: true, lockedSpeed: true, durationSeconds: 240 },
  },
  {
    id: "lib-table",
    name: "Tableau editable",
    description: "Presenter un tableau de reference ou de mapping.",
    accent: "#0369A1",
    block: { id: "seed-table", type: "table", title: "Tableau de reference", columns: ["Champ", "Description"], rows: [["reference", "Identifiant principal"], ["status", "Etat du dossier"]] },
  },
  {
    id: "lib-accordion",
    name: "Accordeon",
    description: "Plier et deplier des sections longues.",
    accent: "#6D28D9",
    block: { id: "seed-accordion", type: "accordion", title: "FAQ / details", items: [{ id: "seed-acc-1", title: "Question 1", body: "Reponse detaillee." }, { id: "seed-acc-2", title: "Question 2", body: "Ajoutez ici un deuxieme detail." }] },
  },
  {
    id: "lib-attachment",
    name: "Piece jointe",
    description: "Lier un document ou un template a telecharger.",
    accent: "#0F766E",
    block: { id: "seed-attachment", type: "attachment", title: "Document utile", fileName: "guide.pdf", fileType: "PDF", url: "", helperText: "Guide a telecharger avant de commencer" },
  },
];

const readReusableBlockLibrary = () => {
  if (typeof window === "undefined") return createReusableBlockLibrarySeed();
  const raw = window.localStorage.getItem(BLOCK_LIBRARY_STORAGE_KEY);
  if (!raw) return createReusableBlockLibrarySeed();
  try {
    const parsed = JSON.parse(raw) as ReusableBlockTemplate[];
    return parsed.length ? parsed : createReusableBlockLibrarySeed();
  } catch {
    return createReusableBlockLibrarySeed();
  }
};

const writeReusableBlockLibrary = (items: ReusableBlockTemplate[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BLOCK_LIBRARY_STORAGE_KEY, JSON.stringify(items));
};

function buildRpaOutputPreset(outputType: string) {
  const timestamp = Date.now();
  if (outputType === "JSON") {
    return {
      columns: [
        { id: timestamp + 1, name: "reference", type: "string", required: true, sampleValue: "CTR-2026-001" },
        { id: timestamp + 2, name: "status", type: "string", required: true, sampleValue: "processed" },
        { id: timestamp + 3, name: "amount", type: "float", required: false, sampleValue: "12500.50" },
      ] as RpaOutputColumn[],
      rows: [
        {
          id: timestamp + 10,
          input: "Contrat PDF avec reference, statut et montant",
          expectedOutput: '{\n  "reference": "CTR-2026-001",\n  "status": "processed",\n  "amount": 12500.50\n}',
        },
      ] as RpaSampleRow[],
    };
  }

  if (outputType === "Excel (.xlsx)") {
    return {
      columns: [
        { id: timestamp + 1, name: "reference", type: "string", required: true, sampleValue: "CTR-2026-001" },
        { id: timestamp + 2, name: "owner", type: "string", required: true, sampleValue: "Equipe RH" },
        { id: timestamp + 3, name: "status", type: "string", required: true, sampleValue: "ready" },
        { id: timestamp + 4, name: "processed_at", type: "date", required: false, sampleValue: "2026-04-15" },
      ] as RpaOutputColumn[],
      rows: [
        {
          id: timestamp + 10,
          input: "Fichier source avec reference, owner et date",
          expectedOutput: "reference,owner,status,processed_at\nCTR-2026-001,Equipe RH,ready,2026-04-15",
        },
      ] as RpaSampleRow[],
    };
  }

  return {
    columns: [
      { id: timestamp + 1, name: "reference", type: "string", required: true, sampleValue: "CTR-2026-001" },
      { id: timestamp + 2, name: "status", type: "string", required: true, sampleValue: "processed" },
      { id: timestamp + 3, name: "comment", type: "string", required: false, sampleValue: "No issue detected" },
    ] as RpaOutputColumn[],
    rows: [
      {
        id: timestamp + 10,
        input: "Contrat PDF standard",
        expectedOutput: "reference,status,comment\nCTR-2026-001,processed,No issue detected",
      },
    ] as RpaSampleRow[],
  };
}

function createOutputPreview(outputType: string, columns: RpaOutputColumn[]) {
  if (!columns.length) return "";
  if (outputType === "JSON") {
    return `{\n${columns.map((column) => `  "${column.name}": "${column.sampleValue || "<value>"}"`).join(",\n")}\n}`;
  }
  const header = columns.map((column) => column.name).join(",");
  const row = columns.map((column) => column.sampleValue || "<value>").join(",");
  return `${header}\n${row}`;
}

function buildSchemaFromTextSeed(source: string, outputType: string) {
  const tokens = source
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);
  const preferred = ["reference", "status", "owner", "amount", "date", "comment", "email", "department"];
  const unique = Array.from(new Set([...preferred.filter((token) => tokens.includes(token)), ...tokens])).slice(0, 6);
  const columns = (unique.length ? unique : ["reference", "status", "comment"]).map((name, index) => ({
    id: Date.now() + index,
    name,
    type: /amount|price|total|score/.test(name) ? "float" : /date/.test(name) ? "date" : "string",
    required: index < 3,
    sampleValue: /amount|price|total|score/.test(name) ? "1250.00" : /date/.test(name) ? "2026-04-16" : `${name}-sample`,
  }));
  const sampleRows: RpaSampleRow[] = [
    {
      id: Date.now() + 100,
      title: "Cas nominal",
      input: source.trim() || "Brief fonctionnel standard",
      expectedOutput: createOutputPreview(outputType, columns),
      status: "required",
    },
  ];
  return { columns, sampleRows };
}

function inferOutputTypeFromFile(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".json")) return "JSON";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "Excel (.xlsx)";
  return "CSV";
}

function inferColumnType(value: unknown) {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "float";
  if (value instanceof Date) return "date";
  const text = String(value ?? "").trim();
  if (!text) return "string";
  if (!Number.isNaN(Number(text)) && text !== "") return text.includes(".") ? "float" : "integer";
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return "date";
  return "string";
}

function buildSchemaFromRows(rows: Record<string, unknown>[]) {
  if (!rows.length) {
    return {
      columns: [] as RpaOutputColumn[],
      samples: [] as RpaSampleRow[],
    };
  }

  const headers = Object.keys(rows[0]);
  const columns = headers.map((header, index) => ({
    id: Date.now() + index,
    name: header,
    type: inferColumnType(rows[0][header]),
    required: true,
    sampleValue: String(rows[0][header] ?? ""),
  }));

  const samples = rows.slice(0, 3).map((row, index) => ({
    id: Date.now() + 100 + index,
    title: `Cas ${index + 1}`,
    input: `Ligne exemple ${index + 1}`,
    expectedOutput: JSON.stringify(row, null, 2),
    status: index === 0 ? "required" : "bonus",
  }));

  return { columns, samples };
}

function createTemplateBlocks(templateType: CourseTemplateType): CourseBlock[] {
  if (templateType === "onboarding") return createDefaultBlocks("onboarding");
  if (templateType === "quiz_only") {
    return [
      {
        id: `quiz-${Date.now()}-1`,
        type: "quiz",
        title: "Quiz de validation",
        questions: [
          { id: `q-${Date.now()}-1`, prompt: "Question 1", options: ["A", "B", "C", "D"], correctAnswer: 0 },
        ],
      },
    ];
  }
  if (templateType === "video_quiz") {
    return [
      { id: `video-${Date.now()}-1`, type: "video", title: "Video obligatoire", videoUrl: "", mandatory: true, lockedSpeed: true, durationSeconds: 240 },
      {
        id: `quiz-${Date.now()}-2`,
        type: "quiz",
        title: "Quiz de comprehension",
        questions: [
          { id: `q-${Date.now()}-2`, prompt: "Quel est le point cle de la video ?", options: ["A", "B", "C", "D"], correctAnswer: 0 },
        ],
      },
      { id: `checkpoint-${Date.now()}-3`, type: "checkpoint", title: "Validation finale", body: "Confirmer que la video a ete visionnee et comprise." },
    ];
  }
  if (templateType === "rh") {
    return [
      { id: `heading-${Date.now()}-1`, type: "heading", title: "Objectif RH", body: "Expliquez le contexte, les interlocuteurs et le resultat attendu." },
      { id: `text-${Date.now()}-2`, type: "text", title: "Procedure", body: "Detaillez ici les etapes, documents et points de vigilance." },
      { id: `image-${Date.now()}-3`, type: "image", title: "Visuel RH", imageUrl: "", caption: "Capture ou schema du processus" },
      { id: `checkpoint-${Date.now()}-4`, type: "checkpoint", title: "Confirmation", body: "Le participant confirme qu'il a compris la procedure." },
    ];
  }
  if (templateType === "procedure") {
    return [
      { id: `heading-${Date.now()}-1`, type: "heading", title: "Contexte", body: "Precisez le cadre, le perimetre et les livrables." },
      { id: `text-${Date.now()}-2`, type: "text", title: "Etapes a suivre", body: "Decrivez les etapes dans l'ordre attendu." },
      { id: `checkpoint-${Date.now()}-3`, type: "checkpoint", title: "Point de controle", body: "Le participant coche cette etape apres verification." },
    ];
  }
  return createDefaultBlocks("document");
}

function getTemplateOptionsForWorkspace(workspace?: { name?: string; domain?: string }) {
  if (isRpaWorkspace(workspace)) {
    return TEMPLATE_OPTIONS.filter((option) => option.id === "rpa");
  }
  if (isPeopleWorkspace(workspace)) {
    return TEMPLATE_OPTIONS.filter((option) => ["rh", "onboarding", "procedure", "quiz_only", "video_quiz"].includes(option.id));
  }
  if (isMarketingWorkspace(workspace)) {
    return TEMPLATE_OPTIONS.filter((option) => ["procedure", "quiz_only", "video_quiz"].includes(option.id));
  }
  return TEMPLATE_OPTIONS.filter((option) => ["procedure", "quiz_only", "video_quiz"].includes(option.id));
}

function getTemplatePreset(templateType: CourseTemplateType, workspaceName: string): TemplatePreset {
  if (templateType === "rpa") {
    return {
      title: `Nouveau parcours RPA - ${workspaceName}`,
      description: "Definissez ici le contexte metier, le workflow cible, les livrables techniques et les attendus de soumission.",
      tags: ["UiPath", "Automation", "Workflow"],
      estimatedMinutes: "180",
      difficulty: "Intermediaire",
      blocks: [
        { id: `preset-rpa-${Date.now()}-1`, type: "heading", title: "Objectif du robot", body: "Decrivez ici le processus a automatiser, son perimetre et la valeur attendue." },
        { id: `preset-rpa-${Date.now()}-2`, type: "text", title: "Livrables", body: "Precisez le package attendu, la structure du projet et les contraintes techniques." },
      ],
    };
  }
  if (templateType === "rh") {
    return {
      title: `Nouveau module RH - ${workspaceName}`,
      description: "Posez le cadre RH, les etapes a suivre, les documents a consulter et les validations attendues.",
      tags: ["RH", "Procedure", "Formation"],
      estimatedMinutes: "60",
      difficulty: "Debutant",
      blocks: createTemplateBlocks("rh"),
    };
  }
  if (templateType === "onboarding") {
    return {
      title: `Onboarding - ${workspaceName}`,
      description: "Accueillez le participant avec les bonnes etapes, les contacts utiles et les contenus obligatoires.",
      tags: ["Onboarding", "Integration", "Equipe"],
      estimatedMinutes: "45",
      difficulty: "Debutant",
      blocks: createTemplateBlocks("onboarding"),
    };
  }
  if (templateType === "quiz_only") {
    return {
      title: `Evaluation rapide - ${workspaceName}`,
      description: "Construisez une verification de comprehension courte avec un score clair et des consignes directes.",
      tags: ["Quiz", "Validation"],
      estimatedMinutes: "20",
      difficulty: "Debutant",
      blocks: createTemplateBlocks("quiz_only"),
    };
  }
  if (templateType === "video_quiz") {
    return {
      title: `Module video - ${workspaceName}`,
      description: "Ajoutez une video obligatoire suivie d'un quiz pour verrouiller la comprehension avant la suite.",
      tags: ["Video", "Quiz", "Validation"],
      estimatedMinutes: "30",
      difficulty: "Intermediaire",
      blocks: createTemplateBlocks("video_quiz"),
    };
  }
  return {
    title: `Procedure - ${workspaceName}`,
    description: "Documentez ici un mode operatoire clair, les etapes attendues et les points de controle.",
    tags: ["Procedure", "Operationnel"],
    estimatedMinutes: "35",
    difficulty: "Intermediaire",
    blocks: createTemplateBlocks("procedure"),
  };
}

export function AdminNewCourse() {
  useTenantStore();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get("draft");
  const courseIdParam = searchParams.get("course");
  const tenant = getCurrentTenant();
  const workspaces = getAccessibleWorkspacesForCurrentUser();
  const [draftId] = useState(() => draftIdParam ?? `draft-${Date.now()}`);
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const workspace = workspaces.find((item) => item.id === workspaceId) ?? workspaces[0];
  const learners = useMemo(() => workspace ? getWorkspaceRoster(tenant, workspace.id).filter((entry) => entry.role === "learner" || entry.role === "new_joiner") : [], [tenant, workspace]);

  const [builderMode, setBuilderMode] = useState<CourseBuilderMode>(isRpaWorkspace(workspace) ? "rpa" : "generic");
  const [creationMode, setCreationMode] = useState<CreationMode>("standard");
  const [step, setStep] = useState(1);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewPersona, setPreviewPersona] = useState<"learner" | "admin">("learner");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediaire");
  const [estimatedMinutes, setEstimatedMinutes] = useState("45");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [accessMode, setAccessMode] = useState<"all" | "specific" | "groups">("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [aiAssist, setAiAssist] = useState(true);
  const [courseType, setCourseType] = useState<CourseType>("document");
  const [templateType, setTemplateType] = useState<CourseTemplateType>(isRpaWorkspace(workspace) ? "rpa" : "procedure");
  const [rulePackId, setRulePackId] = useState<RulePackId>(isRpaWorkspace(workspace) ? "production" : "expert");
  const [blocks, setBlocks] = useState<CourseBlock[]>(createDefaultBlocks("document"));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<string[]>([]);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [history, setHistory] = useState<BuilderHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [blockLibrary, setBlockLibrary] = useState<ReusableBlockTemplate[]>(() => readReusableBlockLibrary());
  const [techStack, setTechStack] = useState<string[]>(["UiPath", "REFramework"]);
  const [resources, setResources] = useState<RpaResource[]>([{ id: 1, name: "Template REFramework", type: "XAML", url: "" }]);
  const [rules, setRules] = useState<RpaValidationRule[]>(AI_RULE_LIBRARY);
  const [pythonRules, setPythonRules] = useState<RpaPythonRule[]>(PYTHON_RULE_LIBRARY);
  const [submissionFileTypes, setSubmissionFileTypes] = useState<string[]>(["nupkg"]);
  const [primaryFileType, setPrimaryFileType] = useState("nupkg");
  const [attachmentFileTypes, setAttachmentFileTypes] = useState<string[]>(["zip"]);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState("50");
  const [maxFiles, setMaxFiles] = useState("2");
  const [namingPattern, setNamingPattern] = useState("{workspace}-{course}-{learner}");
  const [outputType, setOutputType] = useState("CSV");
  const [schemaGenerationMode, setSchemaGenerationMode] = useState<RpaSchemaGenerationMode>("file_example");
  const [outputBriefText, setOutputBriefText] = useState("");
  const [outputAiPrompt, setOutputAiPrompt] = useState("");
  const [outputColumns, setOutputColumns] = useState<RpaOutputColumn[]>([{ id: 1, name: "reference", type: "string", required: true, sampleValue: "CTR-2026-001" }]);
  const [sampleRows, setSampleRows] = useState<RpaSampleRow[]>([{ id: 1, title: "Cas 1", input: "Contract PDF", expectedOutput: "CTR-2026-001", status: "required" }]);
  const [antiPatterns, setAntiPatterns] = useState<RpaAntiPattern[]>(ANTI_PATTERN_LIBRARY);
  const [allowPythonRerun, setAllowPythonRerun] = useState(true);
  const [allowSecondAiRead, setAllowSecondAiRead] = useState(true);
  const [secondAiTemperature, setSecondAiTemperature] = useState("0.1");
  const [importedOutputFileName, setImportedOutputFileName] = useState("");
  const [editingCourse, setEditingCourse] = useState<PublishedCourse | null>(null);
  const [duplicateSourceId, setDuplicateSourceId] = useState("");
  const [prerequisites, setPrerequisites] = useState<CoursePrerequisite[]>([]);
  const [prerequisiteMode, setPrerequisiteMode] = useState<"course_completed" | "quiz_passed">("course_completed");
  const [prerequisiteCourseId, setPrerequisiteCourseId] = useState("");
  const [prerequisiteQuizKey, setPrerequisiteQuizKey] = useState("");
  const availableTemplates = useMemo(() => getTemplateOptionsForWorkspace(workspace), [workspace]);
  const previewBlocks = useMemo(() => (builderMode === "rpa" ? createTemplateBlocks("rpa") : blocks).slice(0, 4), [blocks, builderMode]);
  const availableGroups = useMemo(() => workspace ? getTenantGroupOptions(tenant, workspace.id) : [], [tenant, workspace]);
  const isApplyingHistoryRef = useRef(false);
  const builderSnapshot = useMemo<BuilderHistorySnapshot>(() => ({
    title,
    description,
    tags,
    blocks: cloneBlock(blocks),
    selectedBlockId,
  }), [blocks, description, selectedBlockId, tags, title]);

  const workspaceCourses = useMemo(
    () => getPublishedCoursesForWorkspace(workspaceId).filter((course) => course.id !== editingCourse?.id),
    [editingCourse?.id, workspaceId],
  );
  const workspaceQuizTargets = useMemo(
    () => getWorkspaceQuizTargets(workspaceId, editingCourse?.id),
    [editingCourse?.id, workspaceId],
  );

  const loadCourseIntoForm = (course: PublishedCourse) => {
    setEditingCourse(course);
    setWorkspaceId(course.workspaceId);
    setBuilderMode(course.builderMode ?? "generic");
    setCreationMode("standard");
    setStep(1);
    setTitle(course.name);
    setDescription(course.description);
    setDifficulty(course.difficulty || "Intermediaire");
    setEstimatedMinutes(String(course.estimatedMinutes || 45));
    const accessRule = getCourseAccessRules().find((rule) => rule.courseId === course.id);
    setTags(course.tags || []);
    setAccessMode(accessRule?.accessMode || course.accessMode || "all");
    setSelectedStudents(course.studentIds || []);
    setSelectedGroups(accessRule?.groupIds || []);
    setAiAssist(course.settings?.aiAssisted ?? true);
    setCourseType(course.courseType || "document");
    setTemplateType(course.templateType || (course.builderMode === "rpa" ? "rpa" : "procedure"));
    setRulePackId(course.rulePackId || (course.builderMode === "rpa" ? "production" : "expert"));
    setBlocks(course.blocks?.length ? course.blocks : createDefaultBlocks(course.courseType || "document"));
    setTechStack(course.rpaConfig?.techStack?.length ? course.rpaConfig.techStack : ["UiPath", "REFramework"]);
    setResources(course.rpaConfig?.resources?.length ? course.rpaConfig.resources : [{ id: 1, name: "Template REFramework", type: "XAML", url: "" }]);
    setRules(course.rpaConfig?.validationRules?.length ? course.rpaConfig.validationRules : AI_RULE_LIBRARY);
    setPythonRules(course.rpaConfig?.pythonRules?.length ? course.rpaConfig.pythonRules : PYTHON_RULE_LIBRARY);
    setSubmissionFileTypes(course.rpaConfig?.submissionFileTypes?.length ? course.rpaConfig.submissionFileTypes : ["nupkg"]);
    setPrimaryFileType(course.rpaConfig?.submissionPolicy?.primaryFileType || course.rpaConfig?.submissionFileTypes?.[0] || "nupkg");
    setAttachmentFileTypes(course.rpaConfig?.submissionPolicy?.attachmentFileTypes?.length ? course.rpaConfig.submissionPolicy.attachmentFileTypes : []);
    setMaxFileSizeMb(String(course.rpaConfig?.submissionPolicy?.maxFileSizeMb ?? 50));
    setMaxFiles(String(course.rpaConfig?.submissionPolicy?.maxFiles ?? 2));
    setNamingPattern(course.rpaConfig?.submissionPolicy?.namingPattern || "{workspace}-{course}-{learner}");
    setOutputType(course.rpaConfig?.outputFileType || "CSV");
    setSchemaGenerationMode(course.rpaConfig?.schemaGenerationMode || "file_example");
    setOutputBriefText(course.rpaConfig?.outputBriefText || "");
    setOutputAiPrompt(course.rpaConfig?.outputAiPrompt || "");
    setOutputColumns(course.rpaConfig?.outputColumns?.length ? course.rpaConfig.outputColumns : [{ id: 1, name: "reference", type: "string", required: true, sampleValue: "CTR-2026-001" }]);
    setSampleRows(course.rpaConfig?.sampleRows?.length ? course.rpaConfig.sampleRows : [{ id: 1, title: "Cas 1", input: "Contract PDF", expectedOutput: "CTR-2026-001", status: "required" }]);
    setAntiPatterns(course.rpaConfig?.antiPatterns?.length ? course.rpaConfig.antiPatterns : ANTI_PATTERN_LIBRARY);
    setAllowPythonRerun(course.rpaConfig?.correctionSettings?.allowPythonRerun ?? true);
    setAllowSecondAiRead(course.rpaConfig?.correctionSettings?.allowSecondAiRead ?? true);
    setSecondAiTemperature(String(course.rpaConfig?.correctionSettings?.secondAiTemperature ?? 0.1));
    setPrerequisites(course.prerequisites ?? []);
    setPrerequisiteMode("course_completed");
    setPrerequisiteCourseId("");
    setPrerequisiteQuizKey("");
    setImportedOutputFileName("");
  };

  useEffect(() => {
    if (courseIdParam) {
      const course = getCourseById(courseIdParam);
      if (course) {
        loadCourseIntoForm(course);
      }
      return;
    }
    if (!draftIdParam) return;
    const draft = getDraft(draftIdParam);
    const data = draft?.formData;
    if (!data) return;
    setEditingCourse(null);
    setWorkspaceId(data.workspaceId || workspaceId);
    setBuilderMode(data.builderMode || builderMode);
    setCreationMode(data.creationMode || "standard");
    setStep(data.step || 1);
    setTitle(data.title || "");
    setDescription(data.description || "");
    setDifficulty(data.difficulty || "Intermediaire");
    setEstimatedMinutes(data.estimatedMinutes || "45");
    setTags(data.tags || []);
    setAccessMode(data.accessMode || "all");
    setSelectedStudents(data.selectedStudents || []);
    setSelectedGroups(data.selectedGroups || []);
    setAiAssist(data.aiAssist ?? true);
    setCourseType(data.courseType || "document");
    setTemplateType(data.templateType || (data.builderMode === "rpa" ? "rpa" : "procedure"));
    setRulePackId(data.rulePackId || (data.builderMode === "rpa" ? "production" : "expert"));
    setBlocks(data.blocks?.length ? data.blocks : createDefaultBlocks("document"));
    setTechStack(data.techStack || ["UiPath", "REFramework"]);
    setResources(data.resources?.length ? data.resources : resources);
    setRules(data.rules?.length ? data.rules : AI_RULE_LIBRARY);
    setPythonRules(data.pythonRules?.length ? data.pythonRules : PYTHON_RULE_LIBRARY);
    setSubmissionFileTypes(data.submissionFileTypes?.length ? data.submissionFileTypes : ["nupkg"]);
    setPrimaryFileType(data.primaryFileType || "nupkg");
    setAttachmentFileTypes(data.attachmentFileTypes || []);
    setMaxFileSizeMb(data.maxFileSizeMb || "50");
    setMaxFiles(data.maxFiles || "2");
    setNamingPattern(data.namingPattern || "{workspace}-{course}-{learner}");
    setOutputType(data.outputType || "CSV");
    setSchemaGenerationMode(data.schemaGenerationMode || "file_example");
    setOutputBriefText(data.outputBriefText || "");
    setOutputAiPrompt(data.outputAiPrompt || "");
    setOutputColumns(data.outputColumns?.length ? data.outputColumns : outputColumns);
    setSampleRows(data.sampleRows?.length ? data.sampleRows : sampleRows);
    setAntiPatterns(data.antiPatterns?.length ? data.antiPatterns : ANTI_PATTERN_LIBRARY);
    setAllowPythonRerun(data.allowPythonRerun ?? true);
    setAllowSecondAiRead(data.allowSecondAiRead ?? true);
    setSecondAiTemperature(data.secondAiTemperature || "0.1");
    setPrerequisites(data.prerequisites || []);
    setPrerequisiteMode("course_completed");
    setPrerequisiteCourseId("");
    setPrerequisiteQuizKey("");
    setImportedOutputFileName(data.importedOutputFileName || "");
  }, [courseIdParam, draftIdParam]);

  useEffect(() => {
    if (!draftIdParam && !courseIdParam && !editingCourse && isRpaWorkspace(workspace) && templateType !== "rpa") {
      applyTemplate("rpa");
      return;
    }
    if (!isRpaWorkspace(workspace) && builderMode === "rpa") {
      applyTemplate("procedure");
    }
  }, [builderMode, courseIdParam, draftIdParam, editingCourse, templateType, workspace]);

  useEffect(() => {
    if (!availableTemplates.some((option) => option.id === templateType) && availableTemplates[0]) {
      applyTemplate(availableTemplates[0].id);
    }
  }, [availableTemplates, templateType]);

  useEffect(() => {
    writeReusableBlockLibrary(blockLibrary);
  }, [blockLibrary]);

  useEffect(() => {
    if (!blocks.length) {
      setSelectedBlockId(null);
      return;
    }
    setSelectedBlockId((current) => current && blocks.some((block) => block.id === current) ? current : blocks[0].id);
  }, [blocks]);

  useEffect(() => {
    if (builderMode !== "generic") return;
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      return;
    }
    setHistory((current) => {
      const serialized = JSON.stringify(builderSnapshot);
      const currentSerialized = historyIndex >= 0 ? JSON.stringify(current[historyIndex]) : null;
      if (currentSerialized === serialized) return current;
      const next = [...current.slice(0, historyIndex + 1), cloneBlock(builderSnapshot)].slice(-40);
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [builderMode, builderSnapshot, historyIndex]);

  useEffect(() => {
    if (prerequisiteMode !== "quiz_passed") {
      setPrerequisiteQuizKey("");
      return;
    }
    const firstQuiz = workspaceQuizTargets.find((target) => target.courseId === prerequisiteCourseId);
    setPrerequisiteQuizKey(firstQuiz ? `${firstQuiz.courseId}:${firstQuiz.quizBlockId}` : "");
  }, [prerequisiteCourseId, prerequisiteMode, workspaceQuizTargets]);

  const applyRulePack = (nextPackId: RulePackId, silent = false) => {
    const config = RULE_PACK_CONFIG[nextPackId];
    setRulePackId(nextPackId);
    setRules(
      AI_RULE_LIBRARY.map((rule) => ({
        ...rule,
        enabled: config.aiEnabled ? config.aiEnabled.includes(rule.key ?? "") : rule.enabled,
        severity: config.aiSeverities[rule.key ?? ""] ?? rule.severity,
      })),
    );
    setPythonRules(
      PYTHON_RULE_LIBRARY.map((rule) => ({
        ...rule,
        enabled: config.pythonEnabled ? config.pythonEnabled.includes(rule.key) : rule.enabled,
        severity: config.pythonSeverities?.[rule.key] ?? rule.severity,
      })),
    );
    if (silent) return;
    addNotification({
      kind: "info",
      category: "course",
      title: "Pack de regles applique",
      message: `${config.label} a pre-rempli les regles IA et Python du correcteur.`,
      href: "/admin/nouveau-cours",
    });
  };

  const applyTemplate = (nextTemplateType: CourseTemplateType) => {
    const option = TEMPLATE_OPTIONS.find((item) => item.id === nextTemplateType);
    if (!option) return;
    const preset = getTemplatePreset(nextTemplateType, workspace?.name ?? "Espace");
    setTemplateType(nextTemplateType);
    setBuilderMode(option.builderMode);
    setCourseType(option.courseType);
    setTitle(preset.title);
    setDescription(preset.description);
    setTags(preset.tags);
    setEstimatedMinutes(preset.estimatedMinutes);
    setDifficulty(preset.difficulty);
    setBlocks(preset.blocks);
    applyRulePack(DEFAULT_RULE_PACK_BY_TEMPLATE[nextTemplateType], true);
    if (option.builderMode === "rpa") {
      setCourseType("automation");
      setSubmissionFileTypes(["nupkg"]);
      setPrimaryFileType("nupkg");
      setAttachmentFileTypes(["zip"]);
      setMaxFileSizeMb("50");
      setMaxFiles("2");
      setNamingPattern("{workspace}-{course}-{learner}");
      setTechStack(["UiPath", "REFramework", "Orchestrator"]);
      setResources([
        { id: 1, name: "Template REFramework", type: "XAML", url: "" },
        { id: 2, name: "Guide de soumission package", type: "PDF", url: "" },
      ]);
      setSchemaGenerationMode("file_example");
      setOutputBriefText("Le robot doit produire un fichier de sortie exploitable par le metier avec les colonnes strictement attendues.");
      setOutputAiPrompt("Genere un schema de sortie RPA maintenable, lisible et directement controlable par Python.");
      setAntiPatterns(ANTI_PATTERN_LIBRARY);
    }
    setStep(1);
  };

  const addPrerequisite = () => {
    const course = workspaceCourses.find((item) => item.id === prerequisiteCourseId);
    if (!course) return;
    if (prerequisiteMode === "quiz_passed") {
      const [courseId, quizBlockId] = prerequisiteQuizKey.split(":");
      const target = workspaceQuizTargets.find((item) => item.courseId === courseId && item.quizBlockId === quizBlockId);
      if (!target) return;
      const nextPrerequisite: CoursePrerequisite = {
        id: `prereq-${Date.now()}`,
        type: "quiz_passed",
        courseId: target.courseId,
        courseName: target.courseName,
        quizBlockId: target.quizBlockId,
        quizTitle: target.quizTitle,
      };
      setPrerequisites((prev) => [...prev, nextPrerequisite]);
      return;
    }
    setPrerequisites((prev) => [...prev, { id: `prereq-${Date.now()}`, type: "course_completed", courseId: course.id, courseName: course.name }]);
  };

  const duplicateCourse = () => {
    const source = workspaceCourses.find((course) => course.id === duplicateSourceId);
    if (!source) return;
    loadCourseIntoForm(source);
    setEditingCourse(null);
    setTitle(`${source.name} - Copie`);
    setStep(1);
    addNotification({
      kind: "info",
      category: "course",
      title: "Cours duplique",
      message: `Le cours ${source.name} a ete charge comme nouvelle base de travail.`,
      href: "/admin/nouveau-cours",
    });
  };

  const canPublish = !!title.trim()
    && !!workspace
    && (builderMode === "rpa" ? resources.length > 0 && rules.some((rule) => rule.enabled !== false) && outputColumns.length > 0 && submissionFileTypes.length > 0 : blocks.length > 0)
    && !(accessMode === "specific" && !selectedStudents.length)
    && !(accessMode === "groups" && !selectedGroups.length);

  const validationSummary = [
    { id: "title", label: "Titre du cours", status: title.trim() ? "ready" : "blocking" },
    { id: "description", label: "Introduction claire", status: description.trim() ? "ready" : "warning" },
    { id: "audience", label: "Population de publication", status: accessMode === "all" || (accessMode === "specific" && selectedStudents.length > 0) || (accessMode === "groups" && selectedGroups.length > 0) ? "ready" : "blocking" },
    { id: "content", label: builderMode === "rpa" ? "Ressources et regles" : "Blocs pedagogiques", status: builderMode === "rpa" ? (resources.length > 0 && rules.some((rule) => rule.enabled !== false) ? "ready" : "blocking") : (blocks.length > 0 ? "ready" : "blocking") },
    { id: "output", label: builderMode === "rpa" ? "Output attendu" : "Parcours publiable", status: builderMode === "rpa" ? (outputColumns.length > 0 && submissionFileTypes.length > 0 ? "ready" : "blocking") : "ready" },
  ] as const;
  const blockingItems = validationSummary.filter((item) => item.status === "blocking");
  const warningItems = validationSummary.filter((item) => item.status === "warning");

  const prerequisiteQuizOptions = workspaceQuizTargets.filter((target) => target.courseId === prerequisiteCourseId);

  const moveBlock = (blockId: string, direction: -1 | 1) => {
    setBlocks((prev) => {
      const index = prev.findIndex((item) => item.id === blockId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const duplicateBlock = (blockId: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((item) => item.id === blockId);
      const block = prev[index];
      if (!block) return prev;
      const cloned = cloneBlock(block);
      cloned.id = `b-${Date.now()}`;
      return [...prev.slice(0, index + 1), cloned, ...prev.slice(index + 1)];
    });
  };

  const reorderBlocks = (draggedId: string, targetId: string) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    setBlocks((prev) => {
      const draggedIndex = prev.findIndex((block) => block.id === draggedId);
      const targetIndex = prev.findIndex((block) => block.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) return prev;
      const next = [...prev];
      const [draggedBlock] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, draggedBlock);
      return next;
    });
    setDragOverBlockId(null);
  };

  const updateBlock = (blockId: string, updater: (block: CourseBlock) => CourseBlock) => {
    setBlocks((prev) => prev.map((block) => block.id === blockId ? updater(block) : block));
  };

  const insertNewBlock = (type: CourseBlock["type"]) => {
    const block = newBlock(type);
    setBlocks((prev) => [...prev, block]);
    setSelectedBlockId(block.id);
  };

  const insertReusableBlock = (template: ReusableBlockTemplate) => {
    const block = cloneBlock(template.block);
    block.id = `b-${Date.now()}`;
    if ("questions" in block) {
      block.questions = block.questions.map((question, index) => ({ ...question, id: `${question.id}-${Date.now()}-${index}` }));
    }
    setBlocks((prev) => [...prev, block]);
    setSelectedBlockId(block.id);
  };

  const saveBlockToLibrary = (blockId: string) => {
    const block = blocks.find((item) => item.id === blockId);
    if (!block) return;
    const template: ReusableBlockTemplate = {
      id: `custom-${Date.now()}`,
      name: block.title || `Bloc ${block.type}`,
      description: `Modele reutilisable base sur un bloc ${block.type}.`,
      accent: "#005EFA",
      block: cloneBlock(block),
    };
    setBlockLibrary((prev) => [template, ...prev].slice(0, 18));
    addNotification({
      kind: "success",
      category: "course",
      title: "Bloc ajoute a la bibliotheque",
      message: `${template.name} est maintenant disponible comme bloc reutilisable.`,
      href: "/admin/nouveau-cours",
    });
  };

  const removeReusableBlock = (templateId: string) => {
    setBlockLibrary((prev) => prev.filter((template) => template.id !== templateId));
  };

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;

  const restoreHistorySnapshot = (snapshot: BuilderHistorySnapshot) => {
    isApplyingHistoryRef.current = true;
    setTitle(snapshot.title);
    setDescription(snapshot.description);
    setTags(snapshot.tags);
    setBlocks(cloneBlock(snapshot.blocks));
    setSelectedBlockId(snapshot.selectedBlockId);
  };

  const undoBuilder = () => {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    const snapshot = history[nextIndex];
    if (!snapshot) return;
    setHistoryIndex(nextIndex);
    restoreHistorySnapshot(snapshot);
  };

  const redoBuilder = () => {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    const snapshot = history[nextIndex];
    if (!snapshot) return;
    setHistoryIndex(nextIndex);
    restoreHistorySnapshot(snapshot);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (builderMode !== "generic" || step !== 3) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undoBuilder();
      }
      if ((event.ctrlKey || event.metaKey) && ((event.key.toLowerCase() === "y") || (event.key.toLowerCase() === "z" && event.shiftKey))) {
        event.preventDefault();
        redoBuilder();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [builderMode, step, canRedo, canUndo, historyIndex]);

  const saveCurrentDraft = () => {
    saveDraft({
      id: draftId,
      savedAt: new Date().toISOString(),
      title: title || "Brouillon sans titre",
      description,
      step,
      formData: { workspaceId, builderMode, creationMode, step, title, description, difficulty, estimatedMinutes, tags, accessMode, selectedStudents, selectedGroups, aiAssist, courseType, templateType, rulePackId, blocks, techStack, resources, rules, pythonRules, submissionFileTypes, primaryFileType, attachmentFileTypes, maxFileSizeMb, maxFiles, namingPattern, outputType, schemaGenerationMode, outputBriefText, outputAiPrompt, outputColumns, sampleRows, antiPatterns, allowPythonRerun, allowSecondAiRead, secondAiTemperature, prerequisites, importedOutputFileName },
    });
    addNotification({ kind: "success", category: "course", title: "Brouillon enregistre", message: "Le builder a ete sauvegarde.", href: "/admin/brouillons" });
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) return;
    setTags((prev) => [...prev, value]);
    setTagInput("");
  };

  const generateOutputSchema = () => {
    const seedSource = schemaGenerationMode === "text_brief" ? outputBriefText : schemaGenerationMode === "ai_prompt" ? outputAiPrompt : "";
    const preset = schemaGenerationMode === "file_example" ? buildRpaOutputPreset(outputType) : buildSchemaFromTextSeed(seedSource, outputType);
    setOutputColumns(preset.columns);
    setSampleRows(preset.rows);
    addNotification({
      kind: "info",
      category: "course",
      title: "Schema de sortie genere",
      message: `Une proposition ${outputType} a ete preparee depuis ${OUTPUT_SCHEMA_SOURCES.find((item) => item.id === schemaGenerationMode)?.label?.toLowerCase() ?? "la source active"}.`,
      href: "/admin/nouveau-cours",
    });
  };

  const downloadOutputTemplate = () => {
    const preview = createOutputPreview(outputType, outputColumns);
    const blob = new Blob([preview || "Aucun schema configure"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template-sortie-${outputType.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "output"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importOutputFile = async (file: File) => {
    try {
      const nextOutputType = inferOutputTypeFromFile(file.name);
      let rows: Record<string, unknown>[] = [];

      if (nextOutputType === "JSON") {
        const text = await file.text();
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else if (nextOutputType === "Excel (.xlsx)") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      } else {
        const text = await file.text();
        const workbook = XLSX.read(text, { type: "string" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      }

      const { columns, samples } = buildSchemaFromRows(rows);
      if (!columns.length) {
        addNotification({
          kind: "warning",
          category: "course",
          title: "Fichier vide",
          message: "Le fichier importe ne contient pas de colonnes exploitables.",
          href: "/admin/nouveau-cours",
        });
        return;
      }

      setOutputType(nextOutputType);
      setSchemaGenerationMode("file_example");
      setOutputColumns(columns);
      setSampleRows(samples);
      setImportedOutputFileName(file.name);
      addNotification({
        kind: "success",
        category: "course",
        title: "Fichier importe",
        message: `${file.name} a rempli automatiquement le schema de sortie.`,
        href: "/admin/nouveau-cours",
      });
    } catch {
      addNotification({
        kind: "error",
        category: "course",
        title: "Import impossible",
        message: "Le fichier n'a pas pu etre lu. Utilisez un CSV, JSON ou XLSX valide.",
        href: "/admin/nouveau-cours",
      });
    }
  };

  const publish = async () => {
    if (!workspace || !title.trim()) return;
    const ok = await confirm({
      title: editingCourse ? "Mettre a jour ce cours ?" : "Publier ce cours ?",
      description: editingCourse ? `Le cours sera mis a jour dans ${workspace.name}.` : `Publication dans ${workspace.name}.`,
      confirmLabel: editingCourse ? "Mettre a jour" : "Publier",
    });
    if (!ok) return;
    const id = editingCourse?.id ?? `course-${Date.now()}`;
    const summaryBlocks = builderMode === "rpa"
      ? [
          { id: `s1-${Date.now()}`, type: "heading" as const, title: "Objectif", body: description || "Parcours RPA" },
          { id: `s2-${Date.now()}`, type: "text" as const, title: "Ressources", body: resources.map((item) => `${item.name} (${item.type})`).join("\n") },
          { id: `s3-${Date.now()}`, type: "text" as const, title: "Regles", body: rules.filter((item) => item.enabled !== false).map((item) => `${item.label ?? item.type}: ${item.value}`).join("\n") },
        ]
      : blocks;
    const course = buildPublishedCourse({
      id,
      name: title,
      description,
      difficulty,
      estimatedMinutes: Number(estimatedMinutes) || 45,
      tags,
      courseType: builderMode === "rpa" ? "automation" : courseType,
      builderMode,
      templateType,
      rulePackId,
      blocks: summaryBlocks,
      accessMode,
      studentIds: accessMode === "specific" ? selectedStudents : [],
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      prerequisites,
      aiAssisted: aiAssist,
      publishedAt: editingCourse?.publishedAt,
      orderIndex: editingCourse?.orderIndex,
      createdByPersonId: editingCourse?.createdByPersonId,
      rpaConfig: builderMode === "rpa" ? {
        techStack,
        resources,
        validationRules: rules,
        pythonRules,
        submissionFileTypes,
        submissionPolicy: {
          primaryFileType,
          attachmentFileTypes,
          maxFileSizeMb: Number(maxFileSizeMb) || 50,
          maxFiles: Number(maxFiles) || 2,
          namingPattern,
        },
        outputFileType: outputType,
        schemaGenerationMode,
        outputBriefText,
        outputAiPrompt,
        outputColumns,
        sampleRows,
        antiPatterns,
        correctionSettings: {
          allowPythonRerun,
          allowSecondAiRead,
          secondAiTemperature: Number(secondAiTemperature) || 0.1,
        },
      } : undefined,
    });
    savePublishedCourse(course);
    saveCourseAccessRule({
      courseId: id,
      courseName: title,
      workspaceId: workspace.id,
      accessMode,
      studentIds: accessMode === "specific" ? selectedStudents : [],
      groupIds: accessMode === "groups" ? selectedGroups : [],
      groupLabels: availableGroups.filter((group) => selectedGroups.includes(group.id)).map((group) => group.label),
    });
    addNotification({
      kind: "success",
      category: "course",
      title: editingCourse ? "Cours mis a jour" : builderMode === "rpa" ? "Parcours RPA publie" : "Cours publie",
      message: editingCourse ? `${title} a ete mis a jour dans ${workspace.name}.` : `${title} est disponible dans ${workspace.name}.`,
      href: `/cours/${id}`,
    });
    navigate(`/cours/${id}`);
  };

  const outputPreview = createOutputPreview(outputType, outputColumns);
  const outputPreviewRows = useMemo(() => {
    if (!outputColumns.length) return [];
    const baseRow = Object.fromEntries(outputColumns.map((column) => [column.name || "column", column.sampleValue || "<value>"]));
    const rows = sampleRows.slice(0, 2).map((row, index) => {
      try {
        const parsed = JSON.parse(row.expectedOutput);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, string>;
      } catch {}
      return Object.fromEntries(outputColumns.map((column) => [column.name || `column_${index + 1}`, column.sampleValue || row.expectedOutput]));
    });
    return [baseRow, ...rows];
  }, [outputColumns, sampleRows]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin" className="mb-3 inline-flex items-center gap-2 text-sm" style={{ color: "#6B7280", fontWeight: 700 }}><ArrowLeft size={14} /> Retour admin</Link>
          <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.55rem" }}>{editingCourse ? "Modifier un cours" : builderMode === "rpa" ? "Builder RPA" : "Builder modulaire"}</h1>
          <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>{builderMode === "rpa" ? "Le template technique RPA reste disponible, avec packs de regles et pre-requis fins." : "Chaque cours peut maintenant etre type par template metier, pack de regles et dependances."}</p>
        </div>
        <button onClick={saveCurrentDraft} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}><Save size={14} /> Enregistrer</button>
      </div>

      <div className="rounded-3xl border p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <label className="block text-sm" style={{ color: "#374151", fontWeight: 700 }}>Espace cible</label>
        <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          {workspaces.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.domain}</option>)}
        </select>
        {workspaceCourses.length > 0 && !editingCourse && (
          <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
            <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Dupliquer un cours existant</p>
            <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>Charge un cours deja publie dans cet espace puis adapte-le au lieu de repartir de zero.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
              <select value={duplicateSourceId} onChange={(event) => setDuplicateSourceId(event.target.value)} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <option value="">Choisir un cours a dupliquer</option>
                {workspaceCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
              </select>
              <button onClick={duplicateCourse} disabled={!duplicateSourceId} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: duplicateSourceId ? "#111827" : "#CBD5E1", color: "#FFFFFF", fontWeight: 700 }}>
                Dupliquer
              </button>
            </div>
          </div>
        )}
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {availableTemplates.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => applyTemplate(option.id)}
              className="rounded-2xl p-4 text-left"
              style={{ backgroundColor: templateType === option.id ? "#EFF6FF" : "#F9FAFB", border: `1px solid ${templateType === option.id ? "#93C5FD" : "#E5E7EB"}` }}
            >
              <p style={{ color: "#111827", fontWeight: 800 }}>{option.label}</p>
              <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="my-6 flex flex-wrap gap-2">{(builderMode === "rpa" ? ["Cadrage", "Ressources", "Regles & anti-patterns", "Output & Validation", "Publication"] : ["Template", "Fond", "Blocs", "Publication"]).map((item, index) => <button key={item} onClick={() => setStep(index + 1)} className="rounded-2xl px-4 py-2.5 text-sm" style={{ backgroundColor: step === index + 1 ? "#005EFA" : "#F3F4F6", color: step === index + 1 ? "#FFFFFF" : "#6B7280", fontWeight: 700 }}>{item}</button>)}</div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#005EFA", fontWeight: 800 }}>Mode de creation</p>
              <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>Choisis le niveau de guidage du builder selon ton besoin. Le mode standard reste le plus equilibré.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(Object.entries(CREATION_MODE_CONFIG) as [CreationMode, { label: string; description: string }][]).map(([modeId, mode]) => (
              <button key={modeId} type="button" onClick={() => setCreationMode(modeId)} className="rounded-[20px] p-4 text-left" style={{ backgroundColor: creationMode === modeId ? "#EFF6FF" : "#F8FAFC", border: `1px solid ${creationMode === modeId ? "#93C5FD" : "#E5E7EB"}` }}>
                <p style={{ color: "#111827", fontWeight: 800 }}>{mode.label}</p>
                <p className="mt-2 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{mode.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#00A05A", fontWeight: 800 }}>Validation avant publication</p>
              <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                {blockingItems.length > 0 ? "Certaines informations bloquent encore la publication." : warningItems.length > 0 ? "Le cours peut etre publie mais quelques points restent a renforcer." : "Le cours est coherent et pret a etre publie."}
              </p>
            </div>
            <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: blockingItems.length > 0 ? "#FEE2E2" : warningItems.length > 0 ? "#FEF3C7" : "#DCFCE7", color: blockingItems.length > 0 ? "#B91C1C" : warningItems.length > 0 ? "#92400E" : "#166534", fontWeight: 800 }}>
              {blockingItems.length > 0 ? `${blockingItems.length} blocage(s)` : warningItems.length > 0 ? `${warningItems.length} attention(s)` : "Pret"}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {validationSummary.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                <span className="text-sm" style={{ color: "#374151", fontWeight: 700 }}>{item.label}</span>
                <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: item.status === "blocking" ? "#FEE2E2" : item.status === "warning" ? "#FEF3C7" : "#DCFCE7", color: item.status === "blocking" ? "#B91C1C" : item.status === "warning" ? "#92400E" : "#166534", fontWeight: 800 }}>
                  {item.status === "blocking" ? "Bloquant" : item.status === "warning" ? "A renforcer" : "OK"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl p-4 md:col-span-2" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Template actif</p>
              <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                {TEMPLATE_OPTIONS.find((option) => option.id === templateType)?.description}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="mb-3 text-sm" style={{ color: "#111827", fontWeight: 800 }}>Pack de regles pre-rempli</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(Object.entries(RULE_PACK_CONFIG) as [RulePackId, typeof RULE_PACK_CONFIG[RulePackId]][]).map(([packId, pack]) => (
                  <button
                    key={packId}
                    type="button"
                    onClick={() => applyRulePack(packId)}
                    className="rounded-2xl p-4 text-left"
                    style={{ backgroundColor: rulePackId === packId ? "#EFF6FF" : "#F9FAFB", border: `1px solid ${rulePackId === packId ? "#93C5FD" : "#E5E7EB"}` }}
                  >
                    <p style={{ color: "#111827", fontWeight: 800 }}>{pack.label}</p>
                    <p className="mt-2 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{pack.description}</p>
                  </button>
                ))}
              </div>
            </div>
            {builderMode === "generic" && COURSE_TYPES.map((item) => <button key={item} onClick={() => { setCourseType(item); setBlocks(createDefaultBlocks(item)); }} className="rounded-2xl p-4 text-left" style={{ backgroundColor: courseType === item ? "#EFF6FF" : "#F9FAFB", border: `1px solid ${courseType === item ? "#93C5FD" : "#E5E7EB"}` }}><p style={{ color: "#111827", fontWeight: 800 }}>{item}</p></button>)}
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={builderMode === "rpa" ? "Titre du parcours RPA" : "Titre du cours"} className="rounded-2xl px-4 py-3 text-sm outline-none md:col-span-2" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder={builderMode === "rpa" ? "Contexte metier, objectif du workflow, attendus..." : "Description, objectifs, contexte..."} className="resize-none rounded-2xl px-4 py-3 text-sm outline-none md:col-span-2" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>{["Debutant", "Intermediaire", "Avance", "Expert"].map((item) => <option key={item}>{item}</option>)}</select>
            <input value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(event.target.value)} placeholder="45" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
            <div className="flex gap-2 md:col-span-2">
              <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addTag())} placeholder="Ajouter un tag" className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
              <button onClick={addTag} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#111827", color: "#FFFFFF", fontWeight: 700 }}>Ajouter</button>
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">{tags.map((tag) => <button key={tag} onClick={() => setTags((prev) => prev.filter((item) => item !== tag))} className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{tag}</button>)}</div>
          </div>
        )}

        {builderMode === "generic" && step === 2 && (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Fond pedagogique</p>
                <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                  Cette etape ne doit pas etre vide. Elle sert a poser le message d'accueil, la promesse apprenant et le ton du module avant l'edition fine des blocs.
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm" style={{ color: "#374151", fontWeight: 700 }}>Titre visible par l'apprenant</label>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                </div>
                <div>
                  <label className="block text-sm" style={{ color: "#374151", fontWeight: 700 }}>Message d'introduction</label>
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="mt-2 w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm" style={{ color: "#374151", fontWeight: 700 }}>Difficulte</label>
                    <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                      {["Debutant", "Intermediaire", "Avance", "Expert"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm" style={{ color: "#374151", fontWeight: 700 }}>Duree estimee (minutes)</label>
                    <input value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(event.target.value)} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Blocs pre-remplis du template</p>
                    <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>Tu peux les retoucher ici avant de passer a l'etape `Blocs`.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {blocks.slice(0, 3).map((block) => (
                    <div key={block.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#6B7280", fontWeight: 800 }}>{block.type}</p>
                      <input
                        value={block.title}
                        onChange={(event) => setBlocks((prev) => prev.map((item) => item.id === block.id ? { ...item, title: event.target.value } : item))}
                        className="mt-3 w-full rounded-2xl px-4 py-3 text-sm outline-none"
                        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                      />
                      {"body" in block && (
                        <textarea
                          value={block.body}
                          onChange={(event) => setBlocks((prev) => prev.map((item) => item.id === block.id && "body" in item ? { ...item, body: event.target.value } : item))}
                          rows={3}
                          className="mt-3 w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none"
                          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "#005EFA", fontWeight: 800 }}>Apercu apprenant</p>
                  <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>Mise a jour en direct pendant la creation.</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{templateType}</span>
              </div>

              <div className="mt-5 rounded-[24px] p-5" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0F2954 100%)" }}>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#93C5FD", fontWeight: 800 }}>Carte du module</p>
                <h3 className="mt-3" style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "1.2rem" }}>{title || "Titre du cours"}</h3>
                <p className="mt-3 text-sm" style={{ color: "#BFDBFE", lineHeight: 1.7 }}>{description || "Le message d'introduction apparaitra ici."}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.length > 0 ? tags.map((tag) => <span key={tag} className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#FFFFFF", fontWeight: 700 }}>{tag}</span>) : <span className="text-xs" style={{ color: "#94A3B8" }}>Ajoute des tags pour enrichir la carte.</span>}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {previewBlocks.map((block) => (
                  <div key={block.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                    <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#6B7280", fontWeight: 800 }}>{block.type}</p>
                    <p className="mt-2 text-sm" style={{ color: "#111827", fontWeight: 800 }}>{block.title}</p>
                    {"body" in block && <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>{block.body || "Contenu a completer."}</p>}
                    {"questions" in block && <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>{block.questions.length} question(s) configuree(s)</p>}
                    {"videoUrl" in block && <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>Video obligatoire {block.lockedSpeed ? "avec vitesse verrouillee" : ""}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {builderMode === "rpa" && step === 2 && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">{["UiPath", "REFramework", "Orchestrator", "Queues", "Assets", "SAP", "Excel"].map((item) => { const active = techStack.includes(item); return <button key={item} onClick={() => setTechStack((prev) => active ? prev.filter((value) => value !== item) : [...prev, item])} className="rounded-full px-3 py-1.5 text-xs" style={{ backgroundColor: active ? "#DBEAFE" : "#F3F4F6", color: active ? "#1D4ED8" : "#374151", fontWeight: 700 }}>{item}</button>; })}</div>
            <div className="space-y-3">{resources.map((resource) => <div key={resource.id} className="grid gap-3 md:grid-cols-[1.1fr_0.8fr_1.1fr_auto]"><input value={resource.name} onChange={(event) => setResources((prev) => prev.map((item) => item.id === resource.id ? { ...item, name: event.target.value } : item))} placeholder="Ressource" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} /><input value={resource.type} onChange={(event) => setResources((prev) => prev.map((item) => item.id === resource.id ? { ...item, type: event.target.value } : item))} placeholder="Type" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} /><input value={resource.url} onChange={(event) => setResources((prev) => prev.map((item) => item.id === resource.id ? { ...item, url: event.target.value } : item))} placeholder="URL" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} /><button onClick={() => setResources((prev) => prev.filter((item) => item.id !== resource.id))} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}><Trash2 size={14} /></button></div>)}</div>
            <button onClick={() => setResources((prev) => [...prev, { id: Date.now(), name: "", type: "PDF", url: "" }])} className="mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 700 }}><Plus size={14} /> Ajouter une ressource</button>
          </>
        )}

        {builderMode === "rpa" && step === 3 && (
          <>
            <div className="mb-5 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Pack de regles actif : {RULE_PACK_CONFIG[rulePackId].label}</p>
              <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{RULE_PACK_CONFIG[rulePackId].description}</p>
            </div>
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-2xl">
                      <p style={{ color: "#111827", fontWeight: 800 }}>{rule.label ?? rule.type}</p>
                      <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{rule.description ?? "Regle d'evaluation IA du correcteur."}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {rule.category && <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{rule.category}</span>}
                        <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: rule.severity === "blocking" ? "#FEE2E2" : "#FEF3C7", color: rule.severity === "blocking" ? "#B91C1C" : "#92400E", fontWeight: 700 }}>{rule.severity}</span>
                        <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>{rule.type}</span>
                      </div>
                    </div>
                    <button onClick={() => setRules((prev) => prev.map((item) => item.id === rule.id ? { ...item, enabled: item.enabled === false } : item))} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: rule.enabled === false ? "#F3F4F6" : "#DBEAFE", color: rule.enabled === false ? "#6B7280" : "#1D4ED8", fontWeight: 700 }}>
                      {rule.enabled === false ? "Inactif" : "Actif"}
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.7fr]">
                    <textarea value={rule.value} onChange={(event) => setRules((prev) => prev.map((item) => item.id === rule.id ? { ...item, value: event.target.value } : item))} rows={3} placeholder={rule.placeholder ?? "Consigne du correcteur"} className="resize-none rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                    <select value={rule.severity} onChange={(event) => setRules((prev) => prev.map((item) => item.id === rule.id ? { ...item, severity: event.target.value as "blocking" | "warning" } : item))} className="rounded-2xl px-4 py-3 text-sm outline-none self-start" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                      <option value="blocking">blocking</option>
                      <option value="warning">warning</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setRules((prev) => [...prev, { id: Date.now(), key: "custom_ai_rule", label: "Regle personnalisee", description: "Regle libre pour renforcer l'evaluation IA sur un besoin specifique.", category: "Personnalise", enabled: true, type: "Custom rule", value: "", placeholder: "Decris ici la consigne que le correcteur doit appliquer.", severity: "warning" }])} className="mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 700 }}><Plus size={14} /> Ajouter une regle personnalisee</button>
            <div className="mt-6 rounded-2xl p-4" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
              <p style={{ color: "#9A3412", fontWeight: 800 }}>Regles Python du correcteur</p>
              <p className="mt-2 text-sm" style={{ color: "#C2410C", lineHeight: 1.7 }}>
                Ces scripts servent de garde-fous techniques. Ils structurent le correcteur et reduisent la confiance aveugle dans l'IA.
              </p>
              <p className="mt-2 text-xs" style={{ color: "#9A3412", lineHeight: 1.6 }}>
                Scripts attendus dans <code>validators/python/rules</code> pour l'execution backend.
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {pythonRules.map((rule) => (
                <div key={rule.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-2xl">
                      <p style={{ color: "#111827", fontWeight: 800 }}>{rule.label}</p>
                      <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{rule.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{rule.category}</span>
                        <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: rule.severity === "blocking" ? "#FEE2E2" : "#FEF3C7", color: rule.severity === "blocking" ? "#B91C1C" : "#92400E", fontWeight: 700 }}>{rule.severity}</span>
                        <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>{rule.scriptName}</span>
                      </div>
                    </div>
                    <button onClick={() => setPythonRules((prev) => prev.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: rule.enabled ? "#DBEAFE" : "#F3F4F6", color: rule.enabled ? "#1D4ED8" : "#6B7280", fontWeight: 700 }}>
                      {rule.enabled ? "Actif" : "Inactif"}
                    </button>
                  </div>
                  {rule.paramLabel && (
                    <div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1fr]">
                      <label className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>{rule.paramLabel}</label>
                      <input value={rule.param ?? ""} onChange={(event) => setPythonRules((prev) => prev.map((item) => item.id === rule.id ? { ...item, param: event.target.value } : item))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Zone anti-patterns explicite</p>
                  <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                    Ces anti-patterns structurent la correction pour ne pas donner une confiance totale a l'IA.
                  </p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>
                  {antiPatterns.filter((item) => item.enabled && item.severity === "blocking").length} bloquants
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {antiPatterns.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${item.severity === "blocking" ? "#FECACA" : "#FDE68A"}` }}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-2xl">
                        <p style={{ color: "#111827", fontWeight: 800 }}>{item.label}</p>
                        <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{item.description}</p>
                      </div>
                      <button onClick={() => setAntiPatterns((prev) => prev.map((pattern) => pattern.id === item.id ? { ...pattern, enabled: !pattern.enabled } : pattern))} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: item.enabled ? "#DBEAFE" : "#F3F4F6", color: item.enabled ? "#1D4ED8" : "#6B7280", fontWeight: 700 }}>
                        {item.enabled ? "Actif" : "Inactif"}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.6fr]">
                      <input value={item.description} onChange={(event) => setAntiPatterns((prev) => prev.map((pattern) => pattern.id === item.id ? { ...pattern, description: event.target.value } : pattern))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                      <select value={item.severity} onChange={(event) => setAntiPatterns((prev) => prev.map((pattern) => pattern.id === item.id ? { ...pattern, severity: event.target.value as "blocking" | "warning" } : pattern))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                        <option value="blocking">blocking</option>
                        <option value="warning">warning</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {builderMode === "generic" && step === 3 && (
          <>
            <div className="mb-5 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Builder visuel du cours</p>
                  <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                    Reorganise les blocs par glisser-deposer, reutilise tes blocs favoris et edite les parametres du bloc actif dans le panneau de droite.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={undoBuilder}
                    disabled={!canUndo}
                    className="rounded-full px-3 py-1.5 text-xs"
                    style={{ backgroundColor: canUndo ? "#EEF2FF" : "#E5E7EB", color: canUndo ? "#4338CA" : "#94A3B8", fontWeight: 700 }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={redoBuilder}
                    disabled={!canRedo}
                    className="rounded-full px-3 py-1.5 text-xs"
                    style={{ backgroundColor: canRedo ? "#EFF6FF" : "#E5E7EB", color: canRedo ? "#1D4ED8" : "#94A3B8", fontWeight: 700 }}
                  >
                    Retablir
                  </button>
                  <span className="rounded-full px-3 py-1.5 text-xs" style={{ backgroundColor: "#F9FAFB", color: "#6B7280", fontWeight: 700 }}>
                    Historique {Math.max(historyIndex + 1, 0)}/{history.length}
                  </span>
                  {(["desktop", "tablet", "mobile"] as const).map((viewport) => (
                    <button
                      key={viewport}
                      type="button"
                      onClick={() => setPreviewViewport(viewport)}
                      className="rounded-full px-3 py-1.5 text-xs"
                      style={{ backgroundColor: previewViewport === viewport ? "#DBEAFE" : "#F3F4F6", color: previewViewport === viewport ? "#1D4ED8" : "#374151", fontWeight: 700 }}
                    >
                      {viewport}
                    </button>
                  ))}
                  {(["learner", "admin"] as const).map((persona) => (
                    <button
                      key={persona}
                      type="button"
                      onClick={() => setPreviewPersona(persona)}
                      className="rounded-full px-3 py-1.5 text-xs"
                      style={{ backgroundColor: previewPersona === persona ? "#EDE9FE" : "#F3F4F6", color: previewPersona === persona ? "#6D28D9" : "#374151", fontWeight: 700 }}
                    >
                      Vue {persona === "learner" ? "apprenant" : "admin"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
              <aside className="space-y-4">
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Bibliotheque de blocs</p>
                  <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>Ajoute rapidement un bloc de base ou un bloc reutilisable deja structure.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {GENERIC_BLOCK_TYPES.map((type) => (
                      <button key={type} type="button" onClick={() => insertNewBlock(type)} className="rounded-2xl px-3 py-2 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
                        {type}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const quizBlock: CourseBlock = { id: `quiz-ai-${Date.now()}`, type: "quiz", title: "Quiz IA", questions: generateAiQuizSuggestions({ title, workspaceName: workspace?.name ?? "Espace", courseType }) };
                        setBlocks((prev) => [...prev, quizBlock]);
                        setSelectedBlockId(quizBlock.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs"
                      style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 700 }}
                    >
                      <Bot size={12} /> Quiz IA
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Blocs reutilisables</p>
                    <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>{blockLibrary.length}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {blockLibrary.map((template) => (
                      <div key={template.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p style={{ color: "#111827", fontWeight: 700 }}>{template.name}</p>
                            <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.5 }}>{template.description}</p>
                          </div>
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: template.accent }} />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => insertReusableBlock(template)} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>Inserer</button>
                          {!template.id.startsWith("lib-") && (
                            <button type="button" onClick={() => removeReusableBlock(template.id)} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>Supprimer</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="space-y-4">
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Structure du cours</p>
                      <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>Fais glisser les cartes pour changer l'ordre. Le bloc actif alimente le panneau de droite.</p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EEF2FF", color: "#4338CA", fontWeight: 700 }}>{blocks.length} bloc(s)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {blocks.map((block, index) => {
                    const isSelected = selectedBlockId === block.id;
                    const isCollapsed = collapsedBlockIds.includes(block.id);
                    const isDragTarget = dragOverBlockId === block.id && draggedBlockId !== block.id;
                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={() => setDraggedBlockId(block.id)}
                        onDragEnd={() => { setDraggedBlockId(null); setDragOverBlockId(null); }}
                        onDragOver={(event) => { event.preventDefault(); setDragOverBlockId(block.id); }}
                        onDrop={(event) => { event.preventDefault(); reorderBlocks(draggedBlockId ?? "", block.id); }}
                        onClick={() => setSelectedBlockId(block.id)}
                        className="rounded-2xl border p-4 transition-all"
                        style={{
                          borderColor: isDragTarget ? "#60A5FA" : isSelected ? "#93C5FD" : "#E5E7EB",
                          backgroundColor: isSelected ? "#F8FBFF" : "#FFFFFF",
                          boxShadow: draggedBlockId === block.id ? "0 18px 36px rgba(15,23,42,0.12)" : "none",
                          opacity: draggedBlockId === block.id ? 0.82 : 1,
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <button type="button" className="cursor-grab rounded-xl p-2" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                              <GripVertical size={14} />
                            </button>
                            <div>
                              <p style={{ color: "#111827", fontWeight: 700 }}>{block.title || `Bloc ${index + 1}`}</p>
                              <p className="text-xs" style={{ color: "#6B7280" }}>Bloc {index + 1} · {block.type}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={(event) => { event.stopPropagation(); setCollapsedBlockIds((prev) => prev.includes(block.id) ? prev.filter((id) => id !== block.id) : [...prev, block.id]); }} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
                              {isCollapsed ? "Developper" : "Replier"}
                            </button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); moveBlock(block.id, -1); }} disabled={index === 0} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: index === 0 ? "#E5E7EB" : "#F3F4F6", color: index === 0 ? "#94A3B8" : "#374151", fontWeight: 700 }}>Monter</button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); moveBlock(block.id, 1); }} disabled={index === blocks.length - 1} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: index === blocks.length - 1 ? "#E5E7EB" : "#F3F4F6", color: index === blocks.length - 1 ? "#94A3B8" : "#374151", fontWeight: 700 }}>Descendre</button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); duplicateBlock(block.id); }} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>Dupliquer</button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); saveBlockToLibrary(block.id); }} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#FFF7ED", color: "#9A3412", fontWeight: 700 }}>
                              <Star size={12} /> Sauver
                            </button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); setBlocks((prev) => prev.filter((item) => item.id !== block.id)); }} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}><Trash2 size={12} /></button>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="mt-4 space-y-3">
                            <input
                              value={block.title}
                              onChange={(event) => updateBlock(block.id, (item) => ({ ...item, title: event.target.value }))}
                              placeholder="Titre du bloc"
                              className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                              style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                            />
                            {"body" in block && (
                              <textarea
                                value={block.body}
                                onChange={(event) => updateBlock(block.id, (item) => "body" in item ? { ...item, body: event.target.value } : item)}
                                rows={3}
                                className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none"
                                style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                              />
                            )}
                            {"tone" in block && (
                              <div className="grid gap-3 md:grid-cols-3">
                                {(["info", "warning", "required"] as const).map((tone) => {
                                  const palette = getCalloutToneStyle(tone);
                                  return (
                                    <button
                                      key={tone}
                                      type="button"
                                      onClick={() => updateBlock(block.id, (item) => "tone" in item ? { ...item, tone } : item)}
                                      className="rounded-2xl px-4 py-3 text-sm text-left"
                                      style={{ backgroundColor: block.tone === tone ? palette.bg : "#F9FAFB", border: `1px solid ${block.tone === tone ? palette.border : "#E5E7EB"}`, color: block.tone === tone ? palette.text : "#374151", fontWeight: 700 }}
                                    >
                                      {tone}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {"variant" in block && (
                              <div className="grid gap-3 md:grid-cols-2">
                                {(["correct", "incorrect"] as const).map((variant) => {
                                  const palette = getExampleVariantStyle(variant);
                                  return (
                                    <button
                                      key={variant}
                                      type="button"
                                      onClick={() => updateBlock(block.id, (item) => "variant" in item ? { ...item, variant } : item)}
                                      className="rounded-2xl px-4 py-3 text-sm text-left"
                                      style={{ backgroundColor: block.variant === variant ? palette.bg : "#F9FAFB", border: `1px solid ${block.variant === variant ? palette.border : "#E5E7EB"}`, color: block.variant === variant ? palette.text : "#374151", fontWeight: 700 }}
                                    >
                                      {palette.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {"imageUrl" in block && (
                              <>
                                <input value={block.imageUrl} onChange={(event) => updateBlock(block.id, (item) => "imageUrl" in item ? { ...item, imageUrl: event.target.value } : item)} placeholder="URL image" className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                                <input value={block.caption} onChange={(event) => updateBlock(block.id, (item) => "caption" in item ? { ...item, caption: event.target.value } : item)} placeholder="Legende" className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                              </>
                            )}
                            {"videoUrl" in block && (
                              <div className="grid gap-3 md:grid-cols-2">
                                <input value={block.videoUrl} onChange={(event) => updateBlock(block.id, (item) => "videoUrl" in item ? { ...item, videoUrl: event.target.value } : item)} placeholder="URL video" className="rounded-2xl px-4 py-3 text-sm outline-none md:col-span-2" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                                <input value={String(block.durationSeconds)} onChange={(event) => updateBlock(block.id, (item) => "durationSeconds" in item ? { ...item, durationSeconds: Number(event.target.value || 0) } : item)} placeholder="Duree (sec)" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                                <button type="button" onClick={() => updateBlock(block.id, (item) => "lockedSpeed" in item ? { ...item, lockedSpeed: !item.lockedSpeed } : item)} className="rounded-2xl px-4 py-3 text-sm text-left" style={{ backgroundColor: block.lockedSpeed ? "#EEF2FF" : "#F3F4F6", color: block.lockedSpeed ? "#4338CA" : "#374151", fontWeight: 700 }}>
                                  Lecture acceleree {block.lockedSpeed ? "bloquee" : "autorisee"}
                                </button>
                              </div>
                            )}
                            {"questions" in block && (
                              <div className="space-y-2">
                                {block.questions.map((question, questionIndex) => (
                                  <input
                                    key={question.id}
                                    value={question.prompt}
                                    onChange={(event) => updateBlock(block.id, (item) => "questions" in item ? { ...item, questions: item.questions.map((entry) => entry.id === question.id ? { ...entry, prompt: event.target.value } : entry) } : item)}
                                    placeholder={`Question ${questionIndex + 1}`}
                                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                                    style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                                  />
                                ))}
                              </div>
                            )}
                            {"items" in block && block.type === "checklist" && (
                              <div className="space-y-2">
                                {block.items.map((item, itemIndex) => (
                                  <div key={item.id} className="flex items-center gap-2">
                                    <input
                                      value={item.label}
                                      onChange={(event) => updateBlock(block.id, (entry) => "items" in entry && entry.type === "checklist" ? { ...entry, items: entry.items.map((current) => current.id === item.id ? { ...current, label: event.target.value } : current) } : entry)}
                                      placeholder={`Etape ${itemIndex + 1}`}
                                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                                      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                                    />
                                    <button type="button" onClick={() => updateBlock(block.id, (entry) => "items" in entry && entry.type === "checklist" ? { ...entry, items: entry.items.filter((current) => current.id !== item.id) } : entry)} className="rounded-xl px-3 py-3 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>
                                      Retirer
                                    </button>
                                  </div>
                                ))}
                                <button type="button" onClick={() => updateBlock(block.id, (entry) => "items" in entry && entry.type === "checklist" ? { ...entry, items: [...entry.items, { id: `check-${Date.now()}`, label: "Nouvelle etape" }] } : entry)} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                                  Ajouter une etape
                                </button>
                              </div>
                            )}
                            {"columns" in block && "rows" in block && (
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  {block.columns.map((column, columnIndex) => (
                                    <div key={`${block.id}-column-${columnIndex}`} className="flex items-center gap-2">
                                      <input
                                        value={column}
                                        onChange={(event) => updateBlock(block.id, (entry) => "columns" in entry && "rows" in entry ? { ...entry, columns: entry.columns.map((current, currentIndex) => currentIndex === columnIndex ? event.target.value : current) } : entry)}
                                        placeholder={`Colonne ${columnIndex + 1}`}
                                        className="rounded-2xl px-4 py-3 text-sm outline-none"
                                        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                                      />
                                      <button type="button" onClick={() => updateBlock(block.id, (entry) => "columns" in entry && "rows" in entry ? { ...entry, columns: entry.columns.filter((_, currentIndex) => currentIndex !== columnIndex), rows: entry.rows.map((row) => row.filter((_, currentIndex) => currentIndex !== columnIndex)) } : entry)} className="rounded-xl px-3 py-3 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>
                                        x
                                      </button>
                                    </div>
                                  ))}
                                  <button type="button" onClick={() => updateBlock(block.id, (entry) => "columns" in entry && "rows" in entry ? { ...entry, columns: [...entry.columns, `Colonne ${entry.columns.length + 1}`], rows: entry.rows.map((row) => [...row, ""]) } : entry)} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                                    Ajouter une colonne
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {block.rows.map((row, rowIndex) => (
                                    <div key={`${block.id}-row-${rowIndex}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(block.columns.length, 1)}, minmax(0, 1fr)) auto` }}>
                                      {block.columns.map((_, columnIndex) => (
                                        <input
                                          key={`${block.id}-cell-${rowIndex}-${columnIndex}`}
                                          value={row[columnIndex] ?? ""}
                                          onChange={(event) => updateBlock(block.id, (entry) => "rows" in entry && "columns" in entry ? { ...entry, rows: entry.rows.map((currentRow, currentRowIndex) => currentRowIndex === rowIndex ? currentRow.map((cell, currentColumnIndex) => currentColumnIndex === columnIndex ? event.target.value : cell) : currentRow) } : entry)}
                                          placeholder="Valeur"
                                          className="rounded-2xl px-4 py-3 text-sm outline-none"
                                          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                                        />
                                      ))}
                                      <button type="button" onClick={() => updateBlock(block.id, (entry) => "rows" in entry ? { ...entry, rows: entry.rows.filter((_, currentRowIndex) => currentRowIndex !== rowIndex) } : entry)} className="rounded-xl px-3 py-3 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>
                                        Retirer
                                      </button>
                                    </div>
                                  ))}
                                  <button type="button" onClick={() => updateBlock(block.id, (entry) => "rows" in entry && "columns" in entry ? { ...entry, rows: [...entry.rows, entry.columns.map(() => "")] } : entry)} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                                    Ajouter une ligne
                                  </button>
                                </div>
                              </div>
                            )}
                            {"items" in block && block.type === "accordion" && (
                              <div className="space-y-3">
                                {block.items.map((item, itemIndex) => (
                                  <div key={item.id} className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                                    <div className="flex items-center gap-2">
                                      <input
                                        value={item.title}
                                        onChange={(event) => updateBlock(block.id, (entry) => "items" in entry && entry.type === "accordion" ? { ...entry, items: entry.items.map((current) => current.id === item.id ? { ...current, title: event.target.value } : current) } : entry)}
                                        placeholder={`Section ${itemIndex + 1}`}
                                        className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                                        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                                      />
                                      <button type="button" onClick={() => updateBlock(block.id, (entry) => "items" in entry && entry.type === "accordion" ? { ...entry, items: entry.items.filter((current) => current.id !== item.id) } : entry)} className="rounded-xl px-3 py-3 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>
                                        Retirer
                                      </button>
                                    </div>
                                    <textarea
                                      value={item.body}
                                      onChange={(event) => updateBlock(block.id, (entry) => "items" in entry && entry.type === "accordion" ? { ...entry, items: entry.items.map((current) => current.id === item.id ? { ...current, body: event.target.value } : current) } : entry)}
                                      rows={3}
                                      className="mt-2 w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none"
                                      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                                    />
                                  </div>
                                ))}
                                <button type="button" onClick={() => updateBlock(block.id, (entry) => "items" in entry && entry.type === "accordion" ? { ...entry, items: [...entry.items, { id: `accordion-${Date.now()}`, title: "Nouvelle section", body: "Contenu detaille." }] } : entry)} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                                  Ajouter une section
                                </button>
                              </div>
                            )}
                            {"fileName" in block && (
                              <div className="grid gap-3 md:grid-cols-2">
                                <input value={block.fileName} onChange={(event) => updateBlock(block.id, (entry) => "fileName" in entry ? { ...entry, fileName: event.target.value } : entry)} placeholder="Nom du fichier" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                                <input value={block.fileType} onChange={(event) => updateBlock(block.id, (entry) => "fileType" in entry ? { ...entry, fileType: event.target.value } : entry)} placeholder="Type (PDF, ZIP, XLSX...)" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                                <input value={block.url} onChange={(event) => updateBlock(block.id, (entry) => "url" in entry ? { ...entry, url: event.target.value } : entry)} placeholder="URL ou chemin" className="rounded-2xl px-4 py-3 text-sm outline-none md:col-span-2" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                                <textarea value={block.helperText} onChange={(event) => updateBlock(block.id, (entry) => "helperText" in entry ? { ...entry, helperText: event.target.value } : entry)} rows={3} placeholder="Aide contextuelle" className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none md:col-span-2" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Parametres du bloc</p>
                  {selectedBlock ? (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#6B7280", fontWeight: 800 }}>{selectedBlock.type}</p>
                        <p className="mt-2 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{selectedBlock.title || "Bloc sans titre"}</p>
                      </div>
                      <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Titre du bloc</label>
                      <input value={selectedBlock.title} onChange={(event) => updateBlock(selectedBlock.id, (item) => ({ ...item, title: event.target.value }))} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                      {"body" in selectedBlock && <>
                        <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Contenu</label>
                        <textarea value={selectedBlock.body} onChange={(event) => updateBlock(selectedBlock.id, (item) => "body" in item ? { ...item, body: event.target.value } : item)} rows={6} className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                      </>}
                      {"tone" in selectedBlock && <>
                        <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Niveau d'alerte</label>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {(["info", "warning", "required"] as const).map((tone) => {
                            const palette = getCalloutToneStyle(tone);
                            return (
                              <button
                                key={tone}
                                type="button"
                                onClick={() => updateBlock(selectedBlock.id, (item) => "tone" in item ? { ...item, tone } : item)}
                                className="rounded-2xl px-4 py-3 text-sm text-left"
                                style={{ backgroundColor: selectedBlock.tone === tone ? palette.bg : "#F3F4F6", color: selectedBlock.tone === tone ? palette.text : "#374151", border: `1px solid ${selectedBlock.tone === tone ? palette.border : "#E5E7EB"}`, fontWeight: 700 }}
                              >
                                {tone}
                              </button>
                            );
                          })}
                        </div>
                      </>}
                      {"variant" in selectedBlock && <>
                        <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Type d'exemple</label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(["correct", "incorrect"] as const).map((variant) => {
                            const palette = getExampleVariantStyle(variant);
                            return (
                              <button
                                key={variant}
                                type="button"
                                onClick={() => updateBlock(selectedBlock.id, (item) => "variant" in item ? { ...item, variant } : item)}
                                className="rounded-2xl px-4 py-3 text-sm text-left"
                                style={{ backgroundColor: selectedBlock.variant === variant ? palette.bg : "#F3F4F6", color: selectedBlock.variant === variant ? palette.text : "#374151", border: `1px solid ${selectedBlock.variant === variant ? palette.border : "#E5E7EB"}`, fontWeight: 700 }}
                              >
                                {palette.label}
                              </button>
                            );
                          })}
                        </div>
                      </>}
                      {"imageUrl" in selectedBlock && <>
                        <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Image</label>
                        <input value={selectedBlock.imageUrl} onChange={(event) => updateBlock(selectedBlock.id, (item) => "imageUrl" in item ? { ...item, imageUrl: event.target.value } : item)} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                        <input value={selectedBlock.caption} onChange={(event) => updateBlock(selectedBlock.id, (item) => "caption" in item ? { ...item, caption: event.target.value } : item)} placeholder="Legende visible" className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                      </>}
                      {"videoUrl" in selectedBlock && <>
                        <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Video</label>
                        <input value={selectedBlock.videoUrl} onChange={(event) => updateBlock(selectedBlock.id, (item) => "videoUrl" in item ? { ...item, videoUrl: event.target.value } : item)} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button type="button" onClick={() => updateBlock(selectedBlock.id, (item) => "mandatory" in item ? { ...item, mandatory: !item.mandatory } : item)} className="rounded-2xl px-4 py-3 text-sm text-left" style={{ backgroundColor: selectedBlock.mandatory ? "#ECFDF5" : "#F3F4F6", color: selectedBlock.mandatory ? "#166534" : "#374151", fontWeight: 700 }}>
                            Video {selectedBlock.mandatory ? "obligatoire" : "facultative"}
                          </button>
                          <button type="button" onClick={() => updateBlock(selectedBlock.id, (item) => "lockedSpeed" in item ? { ...item, lockedSpeed: !item.lockedSpeed } : item)} className="rounded-2xl px-4 py-3 text-sm text-left" style={{ backgroundColor: selectedBlock.lockedSpeed ? "#EEF2FF" : "#F3F4F6", color: selectedBlock.lockedSpeed ? "#4338CA" : "#374151", fontWeight: 700 }}>
                            Vitesse {selectedBlock.lockedSpeed ? "verrouillee" : "libre"}
                          </button>
                        </div>
                      </>}
                      {"questions" in selectedBlock && <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
                        <p className="text-xs" style={{ color: "#9A3412", fontWeight: 800 }}>{selectedBlock.questions.length} question(s)</p>
                        <p className="mt-1 text-xs" style={{ color: "#C2410C", lineHeight: 1.6 }}>Le detail des questions reste editable au centre pour garder la structure du quiz visible.</p>
                      </div>}
                      {"items" in selectedBlock && selectedBlock.type === "checklist" && <div className="rounded-2xl p-4" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                        <p className="text-xs" style={{ color: "#166534", fontWeight: 800 }}>{selectedBlock.items.length} etape(s)</p>
                        <p className="mt-1 text-xs" style={{ color: "#15803D", lineHeight: 1.6 }}>Checklist interactive ideale pour des verifications ou pre-requis avant soumission.</p>
                      </div>}
                      {"columns" in selectedBlock && "rows" in selectedBlock && <div className="rounded-2xl p-4" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                        <p className="text-xs" style={{ color: "#1D4ED8", fontWeight: 800 }}>{selectedBlock.columns.length} colonne(s) x {selectedBlock.rows.length} ligne(s)</p>
                        <p className="mt-1 text-xs" style={{ color: "#2563EB", lineHeight: 1.6 }}>Le tableau sert a exposer un mapping, des cas de sortie ou des exemples de donnees.</p>
                      </div>}
                      {"items" in selectedBlock && selectedBlock.type === "accordion" && <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                        <p className="text-xs" style={{ color: "#334155", fontWeight: 800 }}>{selectedBlock.items.length} section(s) repliables</p>
                        <p className="mt-1 text-xs" style={{ color: "#475569", lineHeight: 1.6 }}>Pratique pour segmenter des consignes longues sans alourdir la lecture du cours.</p>
                      </div>}
                      {"fileName" in selectedBlock && <>
                        <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Piece jointe</label>
                        <input value={selectedBlock.fileName} onChange={(event) => updateBlock(selectedBlock.id, (item) => "fileName" in item ? { ...item, fileName: event.target.value } : item)} placeholder="Nom du fichier" className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input value={selectedBlock.fileType} onChange={(event) => updateBlock(selectedBlock.id, (item) => "fileType" in item ? { ...item, fileType: event.target.value } : item)} placeholder="Type" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                          <input value={selectedBlock.url} onChange={(event) => updateBlock(selectedBlock.id, (item) => "url" in item ? { ...item, url: event.target.value } : item)} placeholder="Lien / stockage" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                        </div>
                        <textarea value={selectedBlock.helperText} onChange={(event) => updateBlock(selectedBlock.id, (item) => "helperText" in item ? { ...item, helperText: event.target.value } : item)} rows={4} placeholder="Aide de telechargement" className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                      </>}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl p-4 text-sm" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB", color: "#6B7280" }}>
                      Selectionne un bloc au centre pour afficher ses parametres.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Apercu apprenant</p>
                      <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>{previewPersona === "learner" ? "Rendu epure cote apprenant" : "Lecture admin avec labels de pilotage"}</p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>{previewViewport}</span>
                  </div>
                  <div className="mt-4 rounded-[24px] p-4" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0F2954 100%)" }}>
                    <div className="mx-auto rounded-[20px] bg-white p-4" style={{ width: previewViewport === "desktop" ? "100%" : previewViewport === "tablet" ? "86%" : "72%" }}>
                      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#1D4ED8", fontWeight: 800 }}>{previewPersona === "learner" ? "cours" : "builder"}</p>
                      <h3 className="mt-2" style={{ color: "#111827", fontWeight: 800, fontSize: previewViewport === "mobile" ? "1rem" : "1.1rem" }}>{title || "Titre du cours"}</h3>
                      <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>{description || "Le resume du cours apparaitra ici dans le meme esprit que l'ecran apprenant."}</p>
                      <div className="mt-4 space-y-3">
                        {blocks.slice(0, previewViewport === "mobile" ? 2 : 3).map((block) => (
                          <div key={`preview-${block.id}`} className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#6B7280", fontWeight: 800 }}>{block.type}</p>
                            <p className="mt-2 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{block.title || "Bloc sans titre"}</p>
                            {"body" in block && <p className="mt-2 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{block.body}</p>}
                            {"tone" in block && <div className="mt-2 rounded-2xl px-3 py-2 text-xs" style={{ ...getCalloutToneStyle(block.tone), border: `1px solid ${getCalloutToneStyle(block.tone).border}` }}>{block.tone === "required" ? "Bloc obligatoire" : block.tone === "warning" ? "Point de vigilance" : "Information utile"}</div>}
                            {"variant" in block && <div className="mt-2 rounded-2xl px-3 py-2 text-xs" style={{ ...getExampleVariantStyle(block.variant), border: `1px solid ${getExampleVariantStyle(block.variant).border}` }}>{getExampleVariantStyle(block.variant).label}</div>}
                            {"caption" in block && <p className="mt-2 text-xs" style={{ color: "#6B7280" }}>{block.caption || "Legende image"}</p>}
                            {"questions" in block && <p className="mt-2 text-xs" style={{ color: "#6B7280" }}>{block.questions.length} question(s)</p>}
                            {"videoUrl" in block && <p className="mt-2 text-xs" style={{ color: "#6B7280" }}>{block.mandatory ? "Visionnage obligatoire" : "Visionnage facultatif"}</p>}
                            {"items" in block && block.type === "checklist" && <div className="mt-2 space-y-1">{block.items.slice(0, 3).map((item) => <div key={item.id} className="text-xs" style={{ color: "#6B7280" }}>• {item.label}</div>)}</div>}
                            {"columns" in block && "rows" in block && <div className="mt-2 overflow-hidden rounded-2xl border" style={{ borderColor: "#E5E7EB" }}>
                              <div className="grid text-[11px]" style={{ gridTemplateColumns: `repeat(${Math.max(block.columns.length, 1)}, minmax(0, 1fr))` }}>
                                {block.columns.map((column, columnIndex) => <div key={`${block.id}-preview-column-${columnIndex}`} className="border-b px-2 py-2" style={{ borderColor: "#E5E7EB", backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{column}</div>)}
                                {(block.rows[0] ?? []).map((cell, cellIndex) => <div key={`${block.id}-preview-cell-${cellIndex}`} className="px-2 py-2" style={{ borderTop: "1px solid #E5E7EB", color: "#6B7280" }}>{cell || "-"}</div>)}
                              </div>
                            </div>}
                            {"items" in block && block.type === "accordion" && <div className="mt-2 space-y-2">{block.items.slice(0, 2).map((item) => <div key={item.id} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#FFFFFF", color: "#374151", border: "1px solid #E5E7EB" }}>{item.title}</div>)}</div>}
                            {"fileName" in block && <div className="mt-2 rounded-2xl px-3 py-2 text-xs" style={{ backgroundColor: "#FFFFFF", color: "#374151", border: "1px solid #E5E7EB" }}>{block.fileName} • {block.fileType}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        {builderMode === "rpa" && step === 4 && (
          <>
            <div className="mb-5 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Output & Validation</p>
              <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                Configure ici la structure de sortie, la politique de soumission, les cas de test et le comportement du correcteur.
              </p>
            </div>
              <div className="mb-5 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Types de fichiers attendus pour la soumission</p>
                <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                  Definis ici les formats autorises pour le rendu final du participant.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Type principal attendu</label>
                    <select value={primaryFileType} onChange={(event) => setPrimaryFileType(event.target.value)} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                      {SUBMISSION_FILE_TYPES.map((fileType) => <option key={fileType} value={fileType}>.{fileType}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Taille max (MB)</label>
                    <input value={maxFileSizeMb} onChange={(event) => setMaxFileSizeMb(event.target.value)} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                  </div>
                  <div>
                    <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Nombre max de fichiers</label>
                    <input value={maxFiles} onChange={(event) => setMaxFiles(event.target.value)} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                  </div>
                  <div>
                    <label className="block text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Nommage attendu</label>
                    <input value={namingPattern} onChange={(event) => setNamingPattern(event.target.value)} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUBMISSION_FILE_TYPES.map((fileType) => {
                    const active = submissionFileTypes.includes(fileType);
                    return (
                      <button
                        key={fileType}
                        onClick={() => setSubmissionFileTypes((prev) => active ? prev.filter((item) => item !== fileType) : [...prev, fileType])}
                        className="rounded-full px-3 py-1.5 text-xs"
                        style={{ backgroundColor: active ? "#DBEAFE" : "#F3F4F6", color: active ? "#1D4ED8" : "#374151", fontWeight: 700 }}
                      >
                        .{fileType}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs" style={{ color: "#6B7280" }}>
                  Selection actuelle : {submissionFileTypes.length ? submissionFileTypes.map((item) => `.${item}`).join(", ") : "aucun format"}
                </p>
                <div className="mt-4">
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Pieces jointes autorisees</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SUBMISSION_FILE_TYPES.filter((fileType) => fileType !== primaryFileType).map((fileType) => {
                      const active = attachmentFileTypes.includes(fileType);
                      return (
                        <button key={fileType} type="button" onClick={() => setAttachmentFileTypes((prev) => active ? prev.filter((item) => item !== fileType) : [...prev, fileType])} className="rounded-full px-3 py-1.5 text-xs" style={{ backgroundColor: active ? "#E0F2FE" : "#F3F4F6", color: active ? "#0369A1" : "#374151", fontWeight: 700 }}>
                          .{fileType}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mb-5 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Generation automatique du schema</p>
                <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>Choisis la source de generation la plus adaptee puis pre-remplis le schema de sortie.</p>
                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                  {OUTPUT_SCHEMA_SOURCES.map((source) => (
                    <button key={source.id} type="button" onClick={() => setSchemaGenerationMode(source.id)} className="rounded-2xl p-4 text-left" style={{ backgroundColor: schemaGenerationMode === source.id ? "#EFF6FF" : "#FFFFFF", border: `1px solid ${schemaGenerationMode === source.id ? "#93C5FD" : "#E5E7EB"}` }}>
                      <p style={{ color: "#111827", fontWeight: 800 }}>{source.label}</p>
                      <p className="mt-2 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{source.description}</p>
                    </button>
                  ))}
                </div>
                {schemaGenerationMode === "file_example" && (
                  <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-5 text-sm" style={{ borderColor: "#BFDBFE", backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                    <input
                      type="file"
                      accept=".csv,.json,.xlsx,.xls"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void importOutputFile(file);
                        event.currentTarget.value = "";
                      }}
                    />
                    Importer un fichier exemple
                  </label>
                )}
                {schemaGenerationMode === "text_brief" && (
                  <textarea value={outputBriefText} onChange={(event) => setOutputBriefText(event.target.value)} rows={4} placeholder="Ex: Produire un xlsx RH avec matricule, email, departement, manager et date d'arrivee." className="mt-4 w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                )}
                {schemaGenerationMode === "ai_prompt" && (
                  <textarea value={outputAiPrompt} onChange={(event) => setOutputAiPrompt(event.target.value)} rows={4} placeholder="Ex: Genere un schema de sortie stable pour un robot UiPath de traitement de contrats avec colonnes strictes et types explicites." className="mt-4 w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                )}
                {importedOutputFileName && (
                  <p className="mt-3 text-xs" style={{ color: "#2563EB", fontWeight: 700 }}>
                    Fichier importe : {importedOutputFileName}
                  </p>
                )}
              </div>

              <label className="block text-sm" style={{ color: "#374151", fontWeight: 700 }}>Type de sortie</label>
              <select value={outputType} onChange={(event) => setOutputType(event.target.value)} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>{OUTPUT_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={generateOutputSchema} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 700 }}>
                  <Wand2 size={14} /> Generer les colonnes automatiquement
                </button>
                <button onClick={downloadOutputTemplate} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
                  <Download size={14} /> Telecharger le template
                </button>
                <button onClick={() => setOutputColumns((prev) => [...prev, { id: Date.now(), name: "", type: "string", required: true, sampleValue: "" }])} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 700 }}>
                  <Plus size={14} /> Ajouter une colonne
                </button>
              </div>

              <div className="mt-5 rounded-2xl border" style={{ borderColor: "#E5E7EB", overflow: "hidden" }}>
                <div className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_0.7fr_0.6fr_1fr_auto]" style={{ backgroundColor: "#F8FAFC" }}>
                  {["Colonne", "Type", "Requis", "Exemple", ""].map((label) => (
                    <p key={label} className="text-xs" style={{ color: "#9CA3AF", fontWeight: 800 }}>{label}</p>
                  ))}
                </div>
                <div className="space-y-3 p-4">
                  {outputColumns.map((column) => (
                    <div key={column.id} className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.6fr_1fr_auto]">
                      <input value={column.name} onChange={(event) => setOutputColumns((prev) => prev.map((item) => item.id === column.id ? { ...item, name: event.target.value } : item))} placeholder="Colonne" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                      <input value={column.type} onChange={(event) => setOutputColumns((prev) => prev.map((item) => item.id === column.id ? { ...item, type: event.target.value } : item))} placeholder="Type" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                      <select value={String(column.required)} onChange={(event) => setOutputColumns((prev) => prev.map((item) => item.id === column.id ? { ...item, required: event.target.value === "true" } : item))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                        <option value="true">Oui</option>
                        <option value="false">Non</option>
                      </select>
                      <input value={column.sampleValue} onChange={(event) => setOutputColumns((prev) => prev.map((item) => item.id === column.id ? { ...item, sampleValue: event.target.value } : item))} placeholder="Exemple" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} />
                      <button onClick={() => setOutputColumns((prev) => prev.filter((item) => item.id !== column.id))} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Apercu du fichier attendu</p>
                <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>Le participant devra produire un fichier de sortie respectant cette structure.</p>
                {outputType === "JSON" ? (
                  <pre className="mt-4 overflow-x-auto rounded-2xl p-4 text-xs" style={{ backgroundColor: "#111827", color: "#E5E7EB", lineHeight: 1.7 }}>{outputPreview || "Ajoutez ou generez des colonnes pour afficher un apercu."}</pre>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: "#E5E7EB" }}>
                    <div className="grid px-4 py-3 text-xs" style={{ gridTemplateColumns: `repeat(${Math.max(1, outputColumns.length)}, minmax(120px, 1fr))`, backgroundColor: "#F8FAFC", color: "#6B7280", fontWeight: 800 }}>
                      {outputColumns.map((column) => <span key={`header-${column.id}`}>{column.name || "colonne"}</span>)}
                    </div>
                    <div className="space-y-2 bg-white p-4">
                      {outputPreviewRows.map((row, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="grid gap-3 rounded-2xl px-3 py-3 text-sm" style={{ gridTemplateColumns: `repeat(${Math.max(1, outputColumns.length)}, minmax(120px, 1fr))`, backgroundColor: rowIndex === 0 ? "#EFF6FF" : "#F9FAFB" }}>
                          {outputColumns.map((column) => <span key={`${rowIndex}-${column.id}`} style={{ color: "#111827" }}>{String(row[column.name] ?? "")}</span>)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Cas de test output</p>
                    <p className="text-xs" style={{ color: "#6B7280" }}>Utilises pour verifier automatiquement la sortie du robot.</p>
                  </div>
                  <button onClick={() => setSampleRows((prev) => [...prev, { id: Date.now(), input: "", expectedOutput: outputPreview || "" }])} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 700 }}>
                    <Plus size={14} /> Ajouter un cas
                  </button>
                </div>
                <div className="space-y-3">{sampleRows.map((row) => <div key={row.id} className="rounded-2xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}><div className="mb-3 grid gap-3 md:grid-cols-[1fr_0.7fr_auto]"><input value={row.title} onChange={(event) => setSampleRows((prev) => prev.map((item) => item.id === row.id ? { ...item, title: event.target.value } : item))} placeholder="Titre du cas" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} /><select value={row.status} onChange={(event) => setSampleRows((prev) => prev.map((item) => item.id === row.id ? { ...item, status: event.target.value as "required" | "bonus" } : item))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}><option value="required">obligatoire</option><option value="bonus">bonus</option></select><button onClick={() => setSampleRows((prev) => prev.filter((item) => item.id !== row.id))} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}><Trash2 size={14} /></button></div><div className="grid gap-3 md:grid-cols-2"><textarea value={row.input} onChange={(event) => setSampleRows((prev) => prev.map((item) => item.id === row.id ? { ...item, input: event.target.value } : item))} rows={3} placeholder="Input" className="resize-none rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }} /><textarea value={row.expectedOutput} onChange={(event) => setSampleRows((prev) => prev.map((item) => item.id === row.id ? { ...item, expectedOutput: event.target.value } : item))} rows={3} placeholder="Output attendu" className="resize-none rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }} /></div></div>)}</div>
              </div>
              <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Parametres de correction</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <button type="button" onClick={() => setAllowPythonRerun((prev) => !prev)} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: allowPythonRerun ? "#DBEAFE" : "#F3F4F6", color: allowPythonRerun ? "#1D4ED8" : "#374151", fontWeight: 700 }}>Relance Python {allowPythonRerun ? "active" : "inactive"}</button>
                  <button type="button" onClick={() => setAllowSecondAiRead((prev) => !prev)} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: allowSecondAiRead ? "#EDE9FE" : "#F3F4F6", color: allowSecondAiRead ? "#6D28D9" : "#374151", fontWeight: 700 }}>Seconde lecture IA {allowSecondAiRead ? "active" : "inactive"}</button>
                  <input value={secondAiTemperature} onChange={(event) => setSecondAiTemperature(event.target.value)} placeholder="0.1" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                </div>
              </div>
          </>
        )}

        {step === 4 && builderMode === "generic" && (
          <>
            <div className="mt-6 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Prerequis du parcours</p>
                  <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                    Si aucun prerequis n'est defini, le moteur appliquera automatiquement la logique sequentielle P1 avant P2 avant P3.
                  </p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EEF2FF", color: "#4338CA", fontWeight: 700 }}>
                  {prerequisites.length ? `${prerequisites.length} prerequis` : "Sequentiel par defaut"}
                </span>
              </div>
            </div>
          </>
        )}

        {((builderMode === "rpa" && step === 5) || (builderMode === "generic" && step === 4)) && (
          <>
            <div className="mt-6 rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Prerequis du parcours</p>
                  <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                    Si aucun prerequis n'est defini, le moteur appliquera automatiquement la logique sequentielle P1 avant P2 avant P3.
                  </p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EEF2FF", color: "#4338CA", fontWeight: 700 }}>
                  {prerequisites.length ? `${prerequisites.length} prerequis` : "Sequentiel par defaut"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[0.9fr_1fr_1fr_auto]">
                <select value={prerequisiteMode} onChange={(event) => setPrerequisiteMode(event.target.value as "course_completed" | "quiz_passed")} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  <option value="course_completed">Cours valide</option>
                  <option value="quiz_passed">Quiz obligatoire</option>
                </select>
                <select value={prerequisiteCourseId} onChange={(event) => setPrerequisiteCourseId(event.target.value)} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  <option value="">Choisir un cours</option>
                  {workspaceCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                </select>
                {prerequisiteMode === "quiz_passed" ? (
                  <select value={prerequisiteQuizKey} onChange={(event) => setPrerequisiteQuizKey(event.target.value)} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                    <option value="">Choisir un quiz</option>
                    {prerequisiteQuizOptions.map((target) => <option key={`${target.courseId}-${target.quizBlockId}`} value={`${target.courseId}:${target.quizBlockId}`}>{target.quizTitle}</option>)}
                  </select>
                ) : (
                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", color: "#6B7280" }}>
                    Le participant doit terminer le cours choisi.
                  </div>
                )}
                <button onClick={addPrerequisite} disabled={!prerequisiteCourseId || (prerequisiteMode === "quiz_passed" && !prerequisiteQuizKey)} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: !prerequisiteCourseId || (prerequisiteMode === "quiz_passed" && !prerequisiteQuizKey) ? "#CBD5E1" : "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
                  Ajouter
                </button>
              </div>

              {prerequisites.length > 0 && (
                <div className="mt-4 space-y-2">
                  {prerequisites.map((prerequisite) => (
                    <div key={prerequisite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                      <div>
                        <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>
                          {prerequisite.type === "course_completed" ? "Cours obligatoire" : "Quiz obligatoire"} · {prerequisite.courseName}
                        </p>
                        <p className="text-xs" style={{ color: "#6B7280" }}>
                          {prerequisite.type === "course_completed" ? "Validation complete du cours requise." : prerequisite.quizTitle}
                        </p>
                      </div>
                      <button onClick={() => setPrerequisites((prev) => prev.filter((item) => item.id !== prerequisite.id))} className="rounded-2xl px-3 py-2 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <button onClick={() => setAccessMode("all")} className="rounded-2xl p-4 text-left" style={{ backgroundColor: accessMode === "all" ? "#EFF6FF" : "#F9FAFB", border: `1px solid ${accessMode === "all" ? "#93C5FD" : "#E5E7EB"}` }}><p style={{ color: "#111827", fontWeight: 800 }}>Tout l'espace</p></button>
              <button onClick={() => setAccessMode("groups")} className="rounded-2xl p-4 text-left" style={{ backgroundColor: accessMode === "groups" ? "#EFF6FF" : "#F9FAFB", border: `1px solid ${accessMode === "groups" ? "#93C5FD" : "#E5E7EB"}` }}><p style={{ color: "#111827", fontWeight: 800 }}>Groupes</p><p className="mt-1 text-xs" style={{ color: "#6B7280" }}>Cohorte, equipe, metier, pays</p></button>
              <button onClick={() => setAccessMode("specific")} className="rounded-2xl p-4 text-left" style={{ backgroundColor: accessMode === "specific" ? "#EFF6FF" : "#F9FAFB", border: `1px solid ${accessMode === "specific" ? "#93C5FD" : "#E5E7EB"}` }}><p style={{ color: "#111827", fontWeight: 800 }}>Population cible</p></button>
            </div>
            {accessMode === "groups" && <div className="mt-4 grid gap-2 md:grid-cols-2">{availableGroups.map((group) => { const checked = selectedGroups.includes(group.id); return <button key={group.id} onClick={() => setSelectedGroups((prev) => checked ? prev.filter((id) => id !== group.id) : [...prev, group.id])} className="rounded-2xl p-4 text-left" style={{ backgroundColor: checked ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${checked ? "#86EFAC" : "#E5E7EB"}` }}><p style={{ color: "#111827", fontWeight: 700 }}>{group.label}</p><p className="mt-1 text-xs" style={{ color: "#6B7280" }}>{group.count} personne(s)</p></button>; })}</div>}
            {accessMode === "specific" && <div className="mt-4 grid gap-2 md:grid-cols-2">{learners.map((entry) => { const checked = selectedStudents.includes(entry.personId); return <button key={entry.personId} onClick={() => setSelectedStudents((prev) => checked ? prev.filter((id) => id !== entry.personId) : [...prev, entry.personId])} className="rounded-2xl p-4 text-left" style={{ backgroundColor: checked ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${checked ? "#86EFAC" : "#E5E7EB"}` }}><p style={{ color: "#111827", fontWeight: 700 }}>{entry.person?.name ?? "Utilisateur"}</p><p className="mt-1 text-xs" style={{ color: "#6B7280" }}>{entry.person?.title ?? "-"}</p></button>; })}</div>}
            <button onClick={() => setAiAssist((prev) => !prev)} className="mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: aiAssist ? "#EEF2FF" : "#F3F4F6", color: aiAssist ? "#4338CA" : "#374151", fontWeight: 700 }}><Sparkles size={14} /> Assistance IA {aiAssist ? "active" : "inactive"}</button>
            <button onClick={publish} disabled={!canPublish} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm" style={{ backgroundColor: !canPublish ? "#475569" : "#00A05A", color: "#FFFFFF", fontWeight: 800 }}><CheckCircle2 size={14} /> {editingCourse ? "Mettre a jour le cours" : builderMode === "rpa" ? "Publier le parcours RPA" : "Publier le cours"}</button>
          </>
        )}
      </div>
    </div>
  );
}
