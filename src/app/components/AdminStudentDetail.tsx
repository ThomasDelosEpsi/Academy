import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Lock,
  PlayCircle,
  AlertTriangle,
  ShieldCheck,
  MessageCircle,
  Download,
  Wifi,
  BarChart2,
  FileText,
  X,
  Lightbulb,
  Bot,
  RefreshCcw,
  Calendar,
  Activity,
  UserCheck,
  ChevronDown,
  TrendingUp,
  Star,
  Target,
  Edit3,
  Users,
  Plus,
  Video,
  Coffee,
  Printer,
  Check,
  BookOpen,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { STUDENTS, TUTORS } from "./AdminDashboard";
import {
  getCourseCatalog,
  isStudentEnrolledInCourse,
  saveCourseAccessRule,
  getCourseAccessRules,
} from "../data/courseStore";
import {
  addStudentSession,
  assignTutor,
  forceValidateStudentProject,
  getAssignedTutorId,
  getStudentSessions,
  isStudentForceValidated,
  updateStudentSessionStatus,
  useAcademyStore,
} from "../data/academyStore";
import { getCurrentTenant, getCurrentWorkspace, getWorkspaceRoster } from "../data/tenantStore";
import { MessagingPanel } from "./MessagingPanel";
import { useConfirm } from "./FeedbackProvider";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ── Shared data ───────────────────────────────────────────────────────────────
const STUDENT_DETAILS: Record<string, any> = {
  "benjamin-leclerc": {
    email: "b.leclerc@lyreco.com",
    department: "Digital & IT",
    startDate: "12 Mars 2026",
    totalTime: "6j 08h",
    submissions: [
      { id: 1, project: "P1 — SAP & SharePoint",    date: "18 Mars 2026", status: "validated",   score: 94, time: "2j 01h" },
      { id: 2, project: "P2 — Contrats Juridiques", date: "24 Mars 2026", status: "validated",   score: 88, time: "3j 02h" },
      { id: 3, project: "P3 — Reporting Finance",   date: "26 Mars 2026", status: "validated",   score: 91, time: "2j 17h" },
      { id: 4, project: "P4 — Onboarding RH",       date: "28 Mars 2026", status: "blocked",    score: null, time: "16j 11h", attempts: 4 },
    ],
    aiErrors: [
      { severity: "critical", rule: "Nombre max d'activités dépassé",  detail: "Main.xaml contient 74 activités (limite : 50).",        tip: "Créez des sous-workflows via Invoke Workflow File." },
      { severity: "critical", rule: "Credentials en dur détectés",      detail: "Ligne 23 : SAPPassword en clair.",                      tip: "Utilisez un Orchestrator Asset Credential." },
    ],
    improvements: [
      { category: "Architecture",   priority: "high",   icon: "🏗️",  title: "Modulariser les workflows",              detail: "Le workflow principal dépasse 70 activités. Créer des sous-workflows dédiés pour SAP (Init, Process, Finalize) améliorerait drastiquement la lisibilité et la maintenabilité.",                              action: "Utiliser Invoke Workflow File sur chaque bloc métier distinct." },
      { category: "Sécurité",       priority: "high",   icon: "🔐",  title: "Sécuriser les credentials",              detail: "Des mots de passe SAP et SQL sont définis en clair dans les activités Assign. Cela représente un risque de sécurité critique en production.",                                                                action: "Migrer vers des Orchestrator Assets de type Credential." },
      { category: "Qualité",        priority: "medium", icon: "📋",  title: "Structurer les logs",                    detail: "Les 12 messages de log ne suivent pas le format JSON attendu par le système de monitoring. Difficile de tracer les erreurs en production.",                                                                   action: "Adopter le template JSON : { 'ProjectId', 'Status', 'Duration', 'Error' }." },
      { category: "Robustesse",     priority: "medium", icon: "🛡️",  title: "Ajouter la gestion des exceptions",      detail: "5 activités sensibles (lecture SAP, écriture SQL) ne sont pas encadrées par un bloc Try/Catch. En cas d'erreur réseau ou timeout, le robot plantera sans récupération.",                                  action: "Envelopper chaque activité critique dans un Try/Catch avec retry logic." },
      { category: "Performance",    priority: "low",    icon: "⚡",  title: "Optimiser les sélecteurs SAP",           detail: "Les sélecteurs utilisés pour SAP sont trop génériques (wildcards) et pourraient casser après une mise à jour de l'interface SAP. Le temps de timeout est aussi trop élevé.",                             action: "Utiliser des sélecteurs dynamiques avec ancres et réduire les timeouts à 10s." },
      { category: "Documentation",  priority: "low",    icon: "📝",  title: "Commenter les séquences principales",    detail: "Aucune annotation ni Display Name descriptif sur les Sequences principales. Difficile pour un autre développeur de reprendre le code.",                                                                       action: "Ajouter des annotations sur chaque Sequence et des Display Names explicites." },
    ],
  },
  "camille-durand": {
    email: "c.durand@lyreco.com",
    department: "Finance & Contrôle",
    startDate: "20 Mars 2026",
    totalTime: "4j 15h",
    submissions: [
      { id: 1, project: "P1 — SAP & SharePoint",    date: "25 Mars 2026", status: "validated",   score: 90, time: "1j 20h" },
      { id: 2, project: "P2 — Contrats Juridiques", date: "29 Mars 2026", status: "validated",   score: 82, time: "2j 10h" },
      { id: 3, project: "P4 — Onboarding RH",       date: "01 Avril 2026", status: "blocked",   score: null, time: "13j 08h", attempts: 3 },
    ],
    aiErrors: [
      { severity: "critical", rule: "Structure REFramework manquante",   detail: "Le workflow n'implémente pas le pattern REFramework.", tip: "Partez du template REFramework des ressources." },
      { severity: "critical", rule: "Nombre max d'activités dépassé",    detail: "61 activités (limite : 50).",                          tip: "Décomposez le bloc Init." },
    ],
    improvements: [
      { category: "Architecture",  priority: "high",   icon: "🏗️",  title: "Implémenter le pattern REFramework",    detail: "Sans REFramework, le robot ne gère pas correctement les items en erreur et les retries. Ce pattern est obligatoire pour les projets de niveau Onboarding RH.",          action: "Partir du template REFramework fourni dans les ressources du projet." },
      { category: "Architecture",  priority: "high",   icon: "🔀",  title: "Décomposer le workflow principal",       detail: "61 activités dans Main.xaml est au-dessus du seuil autorisé. La logique métier et la logique de présentation sont mélangées.",                                        action: "Séparer en au moins 3 workflows : Init, Process_Transaction, End_Process." },
      { category: "Qualité",       priority: "medium", icon: "✅",  title: "Ajouter des validations d'entrée",       detail: "Le robot ne valide pas le format des données SAP avant de les traiter. Une entrée malformée peut provoquer une exception non gérée.",                                   action: "Ajouter des conditions de validation sur chaque champ extrait de SAP." },
    ],
  },
  "alice-martin": {
    email: "a.martin@lyreco.com",
    department: "Juridique",
    startDate: "08 Avril 2026",
    totalTime: "3j 04h",
    submissions: [
      { id: 1, project: "P1 — SAP & SharePoint",    date: "10 Avril 2026", status: "validated",   score: 96, time: "1j 08h" },
      { id: 2, project: "P2 — Contrats Juridiques", date: "13 Avril 2026", status: "in_progress", score: null, time: "1j 20h" },
    ],
    aiErrors: [],
    improvements: [
      { category: "Performance",   priority: "low",   icon: "⚡",  title: "Optimiser l'extraction PDF",             detail: "L'extraction des clauses pourrait être accélérée avec un pre-filtering par regex avant d'appeler le moteur NLP, réduisant le temps de traitement de ~40%.",       action: "Implémenter un filtre regex sur les sections de contrat avant NLP." },
      { category: "Qualité",       priority: "low",   icon: "🔍",  title: "Améliorer la précision NLP",             detail: "Le taux de précision de l'extraction de clauses est bon (94%) mais peut atteindre 98% avec un prompt plus spécifique pour les clauses de résiliation.",          action: "Affiner le prompt NLP avec des exemples de clauses de résiliation métier." },
    ],
  },
};

function getDefaultDetail(student: any) {
  return {
    email: `${student.id.split("-")[0]}.${student.id.split("-")[1]}@lyreco.com`,
    department: "Automation Team",
    startDate: "01 Avril 2026",
    totalTime: student.timeOnModule,
    submissions: [
      { id: 1, project: "P1 — SAP & SharePoint", date: "05 Avril 2026", status: "validated", score: 89, time: "2j 00h" },
    ],
    aiErrors: [],
    improvements: [],
  };
}

function getAvatarFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const ACTIVITY = [
  { time: "Il y a 2h",  text: "Tentative de soumission #4 — Analyse IA : Échec (2 erreurs critiques)" },
  { time: "Il y a 6h",  text: "Connexion à la plateforme" },
  { time: "Hier 18:30", text: "Tentative de soumission #3 — Analyse IA : Échec (3 erreurs critiques)" },
  { time: "Hier 14:00", text: "Téléchargement : Guide de Soumission.pdf" },
  { time: "30 Mars",    text: "Tentative de soumission #2 — Analyse IA : Échec" },
  { time: "28 Mars",    text: "Tentative de soumission #1 — Analyse IA : Échec" },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  high:   { label: "Priorité haute",   color: "#991B1B", bg: "#FEF2F2", dot: "#EF4444" },
  medium: { label: "Priorité moyenne", color: "#92400E", bg: "#FFFBEB", dot: "#F59E0B" },
  low:    { label: "Priorité basse",   color: "#065F46", bg: "#ECFDF5", dot: "#10B981" },
};

// ── Session types ─────────────────────────────────────────────────────────────
type SessionStatus = "upcoming" | "completed" | "cancelled";
interface MentoringSession {
  id: number;
  date: string;
  time: string;
  duration: string;
  type: "video" | "chat" | "in_person";
  topic: string;
  status: SessionStatus;
  notes?: string;
}

const INITIAL_SESSIONS: MentoringSession[] = [
  { id: 1, date: "28 Mars 2026", time: "09:00", duration: "30 min", type: "video",     topic: "Point de blocage sur la limite d'activités — workflow decomposition",        status: "completed", notes: "Benjamin a bien compris le principe Invoke Workflow File. Doit retravailler la partie Init SAP." },
  { id: 2, date: "04 Avril 2026",time: "14:00", duration: "45 min", type: "video",     topic: "Revue du code après tentative #3 — credentials et Try/Catch",                status: "completed", notes: "Credentials déplacés vers Orchestrator Assets. Try/Catch ajouté sur les activités SAP." },
  { id: 3, date: "11 Avril 2026",time: "10:00", duration: "30 min", type: "chat",      topic: "Validation des corrections avant soumission #4",                             status: "completed", notes: "Revue rapide par messagerie, soumission prévue dans la journée." },
  { id: 4, date: "18 Avril 2026",time: "11:00", duration: "1h",     type: "video",     topic: "Session de déblocage et préparation pour Projet 5",                          status: "upcoming" },
];

// ── Competency radar data ──────────────────────────────────────────────────────
function computeRadarData(improvements: any[], submissions: any[]) {
  const avgScore = submissions.filter((s: any) => s.score !== null).reduce((acc: number, s: any, _: any, arr: any[]) => acc + s.score / arr.length, 0);

  const scoreForCategory = (cat: string) => {
    const items = improvements.filter((i: any) => i.category?.toLowerCase().includes(cat.toLowerCase()));
    if (items.length === 0) return Math.min(95, Math.max(60, avgScore || 80));
    const highCount = items.filter((i: any) => i.priority === "high").length;
    const medCount  = items.filter((i: any) => i.priority === "medium").length;
    const base = avgScore || 75;
    return Math.max(20, Math.round(base - highCount * 18 - medCount * 8));
  };

  return [
    { subject: "Architecture",  score: scoreForCategory("architecture"),  fullMark: 100 },
    { subject: "Sécurité",      score: scoreForCategory("sécurité"),      fullMark: 100 },
    { subject: "Qualité",       score: scoreForCategory("qualité"),       fullMark: 100 },
    { subject: "Robustesse",    score: scoreForCategory("robustesse"),    fullMark: 100 },
    { subject: "Performance",   score: scoreForCategory("performance"),   fullMark: 100 },
    { subject: "Documentation", score: scoreForCategory("documentation"), fullMark: 100 },
  ];
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminStudentDetail() {
  const academyState = useAcademyStore();
  const confirm = useConfirm();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const forceAction = searchParams.get("action") === "force";
  const currentTenant = getCurrentTenant();
  const currentWorkspace = getCurrentWorkspace();
  const workspaceRoster = currentWorkspace ? getWorkspaceRoster(currentTenant, currentWorkspace.id) : [];
  const rosterEntry = workspaceRoster.find((entry) => entry.personId === id);
  const tenantPerson = currentTenant.people.find((person) => person.id === id);
  const fallbackStudent = tenantPerson ? {
    id: tenantPerson.id,
    name: tenantPerson.name,
    avatar: getAvatarFromName(tenantPerson.name),
    module: rosterEntry?.role === "tutor" ? "Tutorat de l'espace" : "P1 — Parcours en cours",
    moduleId: rosterEntry?.role === "tutor" ? 0 : 1,
    timeOnModule: "0j 00h",
    lastSeen: "Recemment",
    status: "active",
    risk: false,
    tutorId: TUTORS[0]?.id,
  } : null;
  const student = STUDENTS.find((s) => s.id === id) ?? fallbackStudent;
  const details = (id && STUDENT_DETAILS[id]) || (student && getDefaultDetail(student));
  const tutor = TUTORS.find((t) => t.id === student?.tutorId);
  const catalog = getCourseCatalog();
  const assignedTutorId = id ? getAssignedTutorId(id, tutor?.id) : tutor?.id;
  const initialTutor = TUTORS.find((item) => item.id === assignedTutorId) ?? tutor ?? TUTORS[0];
  const initialSessions = id ? getStudentSessions(id, INITIAL_SESSIONS) : INITIAL_SESSIONS;
  const initiallyForced = id ? isStudentForceValidated(id, student?.moduleId ?? 0) : false;

  const [showForceModal, setShowForceModal] = useState(forceAction);
  const [forceReason, setForceReason] = useState("");
  const [forced, setForced] = useState(initiallyForced);
  const [showMessaging, setShowMessaging] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "improvements" | "submissions" | "activity" | "mentorat" | "cours">("overview");
  const [showTutorDropdown, setShowTutorDropdown] = useState(false);
  const [assignedTutor, setAssignedTutor] = useState(initialTutor);

  // Sessions
  const [sessions, setSessions] = useState<MentoringSession[]>(initialSessions);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({ date: "", time: "", duration: "30 min", type: "video" as const, topic: "" });
  const [sessionSaved, setSessionSaved] = useState(false);

  // PDF Export
  const [showExportModal, setShowExportModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Course access per student
  const [courseAccessVersion, setCourseAccessVersion] = useState(0);
  const toggleCourseAccess = useCallback((courseId: string) => {
    if (!id) return;
    const rules = getCourseAccessRules();
    const course = catalog.find((c) => c.id === courseId);
    if (!course) return;
    const existing = rules.find((r) => r.courseId === courseId);
    const currentlyEnrolled = isStudentEnrolledInCourse(courseId, id);
    if (!existing || existing.accessMode === "all") {
      // Was "all" → now restrict: everyone except this student
      const allStudentIds = STUDENTS.map((s) => s.id).filter((sid) => sid !== id);
      saveCourseAccessRule({ courseId, courseName: course.name, accessMode: "specific", studentIds: allStudentIds, groupIds: [], groupLabels: [] });
    } else {
      const newIds = currentlyEnrolled
        ? existing.studentIds.filter((sid) => sid !== id)
        : [...existing.studentIds, id];
      saveCourseAccessRule({ ...existing, studentIds: newIds, groupIds: existing.groupIds ?? [], groupLabels: existing.groupLabels ?? [] });
    }
    setCourseAccessVersion((v) => v + 1);
  }, [catalog, id]);

  const handleForce = async () => {
    const accepted = await confirm({
      title: "Forcer la validation du projet ?",
      description: "Cette action debloque manuellement le projet courant pour l'apprenant et doit rester exceptionnelle.",
      confirmLabel: "Forcer la validation",
      tone: "danger",
    });

    if (!accepted) return;

    if (id && student) forceValidateStudentProject(id, student.moduleId, student.name, forceReason.trim() || "Validation manuelle administrateur");
    setForced(true);
    setTimeout(() => setShowForceModal(false), 2000);
  };

  const handleSaveSession = () => {
    if (!sessionForm.date || !sessionForm.time || !sessionForm.topic) return;
    const newSession: MentoringSession = {
      id: Date.now(),
      ...sessionForm,
      status: "upcoming",
    };
    if (id && student) addStudentSession(id, newSession, student.name);
    setSessions((p) => [...p, newSession]);
    setSessionSaved(true);
    // Auto-send a message
    setTimeout(() => {
      setSessionSaved(false);
      setShowSessionModal(false);
      setSessionForm({ date: "", time: "", duration: "30 min", type: "video", topic: "" });
    }, 2000);
  };

  const handlePrintReport = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Bilan ${student.name} — Academy</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 32px; color: #111827; background: #fff; }
        h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; }
        h2 { font-size: 1rem; font-weight: 700; margin: 24px 0 8px; border-bottom: 2px solid #E5E7EB; padding-bottom: 4px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; margin: 2px; }
        .green { background: #D1FAE5; color: #065F46; }
        .red { background: #FEE2E2; color: #991B1B; }
        .yellow { background: #FEF3C7; color: #92400E; }
        .blue { background: #DBEAFE; color: #1E3A8A; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #F9FAFB; text-align: left; padding: 8px 12px; font-size: 0.8rem; color: #6B7280; font-weight: 700; }
        td { padding: 8px 12px; font-size: 0.85rem; border-bottom: 1px solid #F3F4F6; }
        .score-high { color: #065F46; font-weight: 700; }
        .score-mid  { color: #92400E; font-weight: 700; }
        .score-low  { color: #991B1B; font-weight: 700; }
        .tip-box { background: #F0FDF4; border-left: 3px solid #00A05A; padding: 8px 12px; margin: 4px 0; font-size: 0.8rem; color: #15803D; }
        .header-info { display: flex; gap: 32px; margin-bottom: 8px; font-size: 0.9rem; color: #6B7280; }
        .header-info span strong { color: #111827; }
        .radar-placeholder { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 8px 0; }
        .radar-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 0.82rem; }
        .radar-bar-bg { flex: 1; height: 8px; background: #E5E7EB; border-radius: 99px; margin: auto 12px; }
        .radar-bar-fill { height: 8px; border-radius: 99px; }
        .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 0.75rem; color: #9CA3AF; display: flex; justify-content: space-between; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  if (!student || !details) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p style={{ color: "#6B7280" }}>Apprenant introuvable.</p>
        <Link to="/admin" className="text-sm" style={{ color: "#005EFA" }}>â† Retour au tableau de bord</Link>
      </div>
    );
  }

  const radarData = computeRadarData(details?.improvements ?? [], details?.submissions ?? []);
  const timelineEvents = [
    ...(details.submissions ?? []).map((submission: any) => ({
      dateLabel: submission.date,
      category: submission.status === "blocked" ? "Blocage" : submission.status === "validated" ? "Validation" : "Tentative",
      text: `${submission.project} · ${submission.status === "blocked" ? "bloque" : submission.status === "validated" ? "valide" : "en cours"}${submission.attempts ? ` · ${submission.attempts} tentative(s)` : ""}`,
      tone: submission.status === "blocked" ? "#EF4444" : submission.status === "validated" ? "#00A05A" : "#005EFA",
    })),
    ...sessions.map((session) => ({
      dateLabel: `${session.date} · ${session.time}`,
      category: "Mentorat",
      text: `${session.topic} · ${session.status === "completed" ? "session realisee" : session.status === "cancelled" ? "session annulee" : "session planifiee"}`,
      tone: session.status === "completed" ? "#00A05A" : session.status === "cancelled" ? "#EF4444" : "#F59E0B",
    })),
    ...(academyState.students[id ?? ""]?.lastContactAt ? [{
      dateLabel: new Date(academyState.students[id ?? ""]?.lastContactAt ?? "").toLocaleString("fr-FR"),
      category: "Message",
      text: "Dernier contact administratif enregistre.",
      tone: "#7C3AED",
    }] : []),
    ...(forced ? [{
      dateLabel: new Date().toLocaleDateString("fr-FR"),
      category: "Validation admin",
      text: "Le projet courant a ete debloque manuellement par un administrateur.",
      tone: "#00A05A",
    }] : []),
  ];

  if (!student || !details) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p style={{ color: "#6B7280" }}>Apprenant introuvable.</p>
        <Link to="/admin" className="text-sm" style={{ color: "#005EFA" }}>← Retour au tableau de bord</Link>
      </div>
    );
  }

  const improvements = details.improvements ?? [];
  const avgScore = (details.submissions ?? [])
    .filter((s: any) => s.score !== null)
    .reduce((acc: number, s: any, _: any, arr: any[]) => acc + s.score / arr.length, 0);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10 xl:py-8">
      {/* ── Back ── */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin" className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: "#6B7280" }}>
          <ArrowLeft size={15} /> Tableau de bord
        </Link>
        <span style={{ color: "#D1D5DB" }}>/</span>
        <span className="text-sm" style={{ color: "#374151" }}>{student.name}</span>
      </div>

      {/* ── Profile card ── */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0F2954 100%)", border: "1px solid #1E3A5F" }}>
        <div className="flex flex-wrap items-start gap-5">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl text-white shrink-0"
            style={{
              background: student.risk ? "linear-gradient(135deg, #DC2626, #EF4444)" : "linear-gradient(135deg, #005EFA, #3B82F6)",
              fontWeight: 800,
              border: "3px solid rgba(255,255,255,0.12)",
            }}
          >
            {student.avatar}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 style={{ color: "#F1F5F9", fontWeight: 800, fontSize: "1.3rem" }}>{student.name}</h1>
              {student.risk && <span className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: "rgba(239,68,68,0.2)", color: "#FCA5A5", fontWeight: 700 }}>⚠ À risque</span>}
              {forced && <span className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: "rgba(0,160,90,0.2)", color: "#34D399", fontWeight: 700 }}>✅ Validé Admin</span>}
            </div>
            <p className="text-sm mb-3" style={{ color: "#64748B" }}>{details.department} · {details.email}</p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-5">
              {[
                { icon: Calendar, label: "Inscrit le",    value: details.startDate },
                { icon: Clock,    label: "Temps total",   value: details.totalTime },
                { icon: Activity, label: "Module actuel", value: student.module },
                { icon: Wifi,     label: "Dernière co.",  value: student.lastSeen },
                ...(avgScore > 0 ? [{ icon: Star, label: "Score moyen", value: `${Math.round(avgScore)}/100` }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={13} color="#475569" />
                  <span className="text-xs" style={{ color: "#64748B" }}>{label} : </span>
                  <span className="text-xs" style={{ color: "#CBD5E1", fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {/* Messaging button */}
            <button
              onClick={() => setShowMessaging(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#005EFA", color: "#fff", fontWeight: 700, boxShadow: "0 4px 12px rgba(0,94,250,0.3)" }}
            >
              <MessageCircle size={13} /> Messagerie
            </button>
            {student.risk && !forced && (
              <button
                onClick={() => setShowForceModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#F59E0B", color: "#78350F", fontWeight: 700 }}
              >
                <ShieldCheck size={13} /> Forcer la validation
              </button>
            )}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#94A3B8", fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Download size={13} /> Exporter le rapport
            </button>
          </div>
        </div>

        {/* ── Tutor assignment bar ── */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <UserCheck size={14} color="#60A5FA" />
              <span className="text-xs" style={{ color: "#94A3B8", fontWeight: 600 }}>Tuteur assigné :</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowTutorDropdown((p) => !p)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#F1F5F9" }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                  style={{ backgroundColor: assignedTutor.color, fontWeight: 700, fontSize: "0.6rem" }}
                >
                  {assignedTutor.avatar}
                </div>
                <span style={{ fontWeight: 600 }}>{assignedTutor.name}</span>
                <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#94A3B8" }}>
                  {assignedTutor.specialty}
                </span>
                <ChevronDown size={12} color="#64748B" />
              </button>
              {showTutorDropdown && (
                <div
                  className="absolute top-full mt-1 left-0 rounded-xl overflow-hidden z-20 w-64"
                  style={{ backgroundColor: "#1E3A5F", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
                >
                  <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <p className="text-xs" style={{ color: "#64748B", fontWeight: 700 }}>Changer de tuteur</p>
                  </div>
                  {TUTORS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setAssignedTutor(t);
                        setShowTutorDropdown(false);
                        if (id && student) assignTutor(id, t.id, t.name, student.name);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:opacity-80 transition-opacity text-left"
                      style={{ backgroundColor: t.id === assignedTutor.id ? "rgba(0,94,250,0.15)" : "transparent" }}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white" style={{ backgroundColor: t.color, fontWeight: 700, fontSize: "0.6rem" }}>
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: "#F1F5F9", fontWeight: 600 }}>{t.name}</p>
                        <p className="text-xs" style={{ color: "#64748B" }}>{t.specialty}</p>
                      </div>
                      {t.id === assignedTutor.id && <CheckCircle2 size={13} color="#34D399" className="ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs" style={{ color: "#475569" }}>
              · {STUDENTS.filter((s) => s.tutorId === assignedTutor.id).length} apprenant(s) suivi(s) par ce tuteur
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-6 overflow-x-auto pb-1">
      <div className="flex w-max gap-1 rounded-xl p-1" style={{ backgroundColor: "#F3F4F6" }}>
        {[
          { id: "overview",      label: "Vue d'ensemble",    icon: BarChart2 },
          { id: "cours",         label: "Cours assignés",    icon: BookOpen },
          { id: "improvements",  label: `Points à améliorer ${improvements.length > 0 ? `(${improvements.length})` : ""}`, icon: TrendingUp },
          { id: "submissions",   label: "Soumissions",       icon: FileText },
          { id: "mentorat",      label: `Mentorat (${sessions.length})`, icon: Users },
          { id: "activity",      label: "Activité",          icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: activeTab === id ? "#fff" : "transparent",
              color: activeTab === id ? "#111827" : "#6B7280",
              fontWeight: activeTab === id ? 700 : 500,
              boxShadow: activeTab === id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>
      </div>

      {/* ── TAB: Overview ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">

        {/* ── Radar competency chart ── */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Target size={16} color="#7C3AED" />
              <h2 style={{ color: "#111827", fontWeight: 700 }}>Radar de compétences UiPath</h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F5F3FF", color: "#6D28D9", fontWeight: 600 }}>
              Basé sur {details.submissions.filter((s: any) => s.score !== null).length} projet(s) validé(s)
            </span>
          </div>
          <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>Scores calculés d'après les erreurs IA et l'analyse des soumissions</p>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div style={{ width: "100%", maxWidth: 320, height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#D1D5DB", fontSize: 9 }} tickCount={4} />
                  <Radar name="Score" dataKey="score" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.18} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#94A3B8", fontWeight: 700, fontSize: 11 }}
                    itemStyle={{ color: "#A78BFA", fontWeight: 700 }}
                    formatter={(v: number) => [`${v}/100`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Competency breakdown bars */}
            <div className="flex-1 w-full space-y-2.5">
              {radarData.map((item) => {
                const pct = item.score;
                const color = pct >= 80 ? "#00A05A" : pct >= 60 ? "#F59E0B" : "#EF4444";
                const bg    = pct >= 80 ? "#D1FAE5" : pct >= 60 ? "#FEF3C7" : "#FEE2E2";
                const textColor = pct >= 80 ? "#065F46" : pct >= 60 ? "#92400E" : "#991B1B";
                return (
                  <div key={item.subject} className="flex items-center gap-3">
                    <span className="text-xs w-28 shrink-0" style={{ color: "#374151", fontWeight: 600 }}>{item.subject}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F3F4F6" }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs w-12 text-right px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: bg, color: textColor, fontWeight: 700 }}>{pct}/100</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Progress */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={16} color="#005EFA" />
              <h2 style={{ color: "#111827", fontWeight: 700 }}>Progression du parcours</h2>
            </div>
            <div className="space-y-3">
              {[
                { n: 1, label: "SAP & SharePoint",   st: "completed" },
                { n: 2, label: "Contrats Juridiques", st: student.moduleId >= 3 ? "completed" : student.moduleId === 2 ? "in_progress" : "locked" },
                { n: 3, label: "Reporting Finance",   st: student.moduleId >= 4 ? "completed" : student.moduleId === 3 ? "in_progress" : "locked" },
                { n: 4, label: "Onboarding RH",       st: student.moduleId >= 5 ? "completed" : student.moduleId === 4 ? (student.risk ? "blocked" : "in_progress") : "locked" },
                { n: 5, label: "Certification Expert",st: "locked" },
              ].map((step) => (
                <div key={step.n} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{
                    backgroundColor: step.st === "completed" ? "#D1FAE5" : step.st === "in_progress" ? "#EFF6FF" : step.st === "blocked" ? "#FEE2E2" : "#F3F4F6",
                  }}>
                    {step.st === "completed"   && <CheckCircle2 size={16} color="#00A05A" />}
                    {step.st === "in_progress" && <PlayCircle   size={16} color="#005EFA" />}
                    {step.st === "blocked"     && <AlertTriangle size={14} color="#EF4444" />}
                    {step.st === "locked"      && <Lock size={13} color="#D1D5DB" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{
                      color: step.st === "completed" ? "#111827" : step.st === "in_progress" ? "#005EFA" : step.st === "blocked" ? "#EF4444" : "#9CA3AF",
                      fontWeight: step.st !== "locked" ? 600 : 400,
                    }}>
                      P{step.n} — {step.label}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{
                    backgroundColor: step.st === "completed" ? "#D1FAE5" : step.st === "in_progress" ? "#EFF6FF" : step.st === "blocked" ? "#FEE2E2" : "#F3F4F6",
                    color: step.st === "completed" ? "#15803D" : step.st === "in_progress" ? "#1D4ED8" : step.st === "blocked" ? "#991B1B" : "#9CA3AF",
                    fontWeight: 600,
                  }}>
                    {step.st === "completed" ? "✓ Validé" : step.st === "in_progress" ? "En cours" : step.st === "blocked" ? "Bloqué" : "Verrouillé"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Errors / OK */}
          {details.aiErrors.length > 0 ? (
            <div className="rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #FECACA" }}>
              <div className="flex items-center gap-2 mb-4">
                <Bot size={16} color="#EF4444" />
                <h2 style={{ color: "#991B1B", fontWeight: 700 }}>Erreurs IA actuelles</h2>
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>
                  {details.aiErrors.length} problème(s)
                </span>
              </div>
              <div className="space-y-3">
                {details.aiErrors.map((err: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: "#FFF5F5", border: `1px solid ${err.severity === "critical" ? "#FECACA" : "#FDE68A"}` }}>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: err.severity === "critical" ? "#FEE2E2" : "#FEF3C7" }}>
                        {err.severity === "critical" ? <X size={11} color="#DC2626" /> : <AlertTriangle size={11} color="#D97706" />}
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: err.severity === "critical" ? "#991B1B" : "#92400E", fontWeight: 700 }}>{err.rule}</p>
                        <p className="text-xs mb-1.5" style={{ color: "#6B7280", lineHeight: 1.5 }}>{err.detail}</p>
                        <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg" style={{ backgroundColor: "#F0FDF4" }}>
                          <Lightbulb size={10} color="#16A34A" className="shrink-0 mt-0.5" />
                          <p className="text-xs" style={{ color: "#15803D" }}>{err.tip}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
              <CheckCircle2 size={32} color="#00A05A" />
              <p className="text-sm" style={{ color: "#15803D", fontWeight: 700 }}>Aucune erreur IA détectée</p>
              <p className="text-xs" style={{ color: "#4ADE80" }}>Cet apprenant progresse sans problèmes identifiés par l'IA.</p>
              {improvements.length > 0 && (
                <button
                  onClick={() => setActiveTab("improvements")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs mt-1 hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 600 }}
                >
                  <TrendingUp size={12} /> Voir {improvements.length} point(s) à améliorer
                </button>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* ── TAB: Points à améliorer ── */}
      {activeTab === "improvements" && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl" style={{ background: "linear-gradient(135deg, #F8FAFF, #EFF6FF)", border: "1px solid #BFDBFE" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#DBEAFE" }}>
                <Bot size={20} color="#1D4ED8" />
              </div>
              <div>
                <p style={{ color: "#1E3A8A", fontWeight: 700 }}>Analyse IA — Points d'amélioration</p>
                <p className="text-xs mt-0.5" style={{ color: "#3B82F6" }}>
                  {improvements.filter((i: any) => i.priority === "high").length} critique(s) · {improvements.filter((i: any) => i.priority === "medium").length} important(s) · {improvements.filter((i: any) => i.priority === "low").length} mineur(s)
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMessaging(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#005EFA", color: "#fff", fontWeight: 700 }}
            >
              <MessageCircle size={13} /> Envoyer ces retours à l'apprenant
            </button>
          </div>

          {improvements.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Star size={32} color="#00A05A" />
              <p style={{ color: "#15803D", fontWeight: 700 }}>Excellent travail ! Aucun point d'amélioration détecté.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {["high", "medium", "low"].map((priority) => {
                const items = improvements.filter((i: any) => i.priority === priority);
                if (items.length === 0) return null;
                const cfg = PRIORITY_CONFIG[priority];
                return (
                  <div key={priority}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                      <p className="text-xs" style={{ color: cfg.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {cfg.label}
                      </p>
                      <div className="flex-1 h-px" style={{ backgroundColor: "#E5E7EB" }} />
                    </div>
                    <div className="space-y-3">
                      {items.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="rounded-2xl p-5"
                          style={{ backgroundColor: "#fff", border: `1.5px solid ${cfg.bg === "#FEF2F2" ? "#FECACA" : cfg.bg === "#FFFBEB" ? "#FDE68A" : "#D1FAE5"}` }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-2xl shrink-0 mt-0.5">{item.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <p style={{ color: "#111827", fontWeight: 700 }}>{item.title}</p>
                                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600 }}>
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-sm mb-3" style={{ color: "#4B5563", lineHeight: 1.65 }}>{item.detail}</p>
                              <div
                                className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                                style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
                              >
                                <Target size={13} color="#16A34A" className="shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs" style={{ color: "#15803D", fontWeight: 700 }}>Action recommandée :</p>
                                  <p className="text-xs" style={{ color: "#065F46", lineHeight: 1.55 }}>{item.action}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <button
                                onClick={() => setShowMessaging(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 600 }}
                              >
                                <MessageCircle size={11} /> Envoyer
                              </button>
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 600 }}
                              >
                                <Edit3 size={11} /> Annoter
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Submissions ── */}
      {activeTab === "submissions" && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center gap-2">
              <FileText size={16} color="#374151" />
              <h2 style={{ color: "#111827", fontWeight: 700 }}>Historique des soumissions</h2>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: "#F9FAFB" }}>
            {details.submissions.map((sub: any) => (
              <div key={sub.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "#111827", fontWeight: 600 }}>{sub.project}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    Soumis le {sub.date}{sub.attempts && ` · ${sub.attempts} tentative(s)`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} color="#9CA3AF" />
                  <span className="text-xs" style={{ color: "#6B7280", fontFamily: "monospace" }}>{sub.time}</span>
                </div>
                {sub.score !== null && (
                  <div className="px-3 py-1 rounded-full text-xs" style={{
                    backgroundColor: sub.score >= 90 ? "#D1FAE5" : sub.score >= 80 ? "#FEF3C7" : "#FEE2E2",
                    color: sub.score >= 90 ? "#065F46" : sub.score >= 80 ? "#92400E" : "#991B1B",
                    fontWeight: 700,
                  }}>
                    {sub.score}/100
                  </div>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{
                  backgroundColor: sub.status === "validated" ? "#D1FAE5" : sub.status === "in_progress" ? "#EFF6FF" : "#FEE2E2",
                  color: sub.status === "validated" ? "#065F46" : sub.status === "in_progress" ? "#1D4ED8" : "#991B1B",
                  fontWeight: 600,
                }}>
                  {sub.status === "validated"   && <><CheckCircle2 size={10} /> Validé</>}
                  {sub.status === "in_progress" && <><PlayCircle   size={10} /> En cours</>}
                  {sub.status === "blocked"     && <><AlertTriangle size={10} /> Bloqué</>}
                </span>
                {sub.status === "blocked" && (
                  <button onClick={() => setShowForceModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:opacity-80" style={{ backgroundColor: "#FEF3C7", color: "#92400E", fontWeight: 600 }}>
                    <ShieldCheck size={11} /> Forcer
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Mentorat ── */}
      {activeTab === "mentorat" && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl" style={{ background: "linear-gradient(135deg, #F8FAFF, #EFF6FF)", border: "1px solid #BFDBFE" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#DBEAFE" }}>
                <Users size={20} color="#1D4ED8" />
              </div>
              <div>
                <p style={{ color: "#1E3A8A", fontWeight: 700 }}>Sessions de mentorat — {assignedTutor.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#3B82F6" }}>
                  {sessions.filter((s) => s.status === "completed").length} complétée(s) · {sessions.filter((s) => s.status === "upcoming").length} à venir
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#005EFA", color: "#fff", fontWeight: 700, boxShadow: "0 4px 12px rgba(0,94,250,0.25)" }}
            >
              <Plus size={13} /> Planifier une session
            </button>
          </div>

          {/* Sessions list */}
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#fff",
                  border: `1.5px solid ${session.status === "upcoming" ? "#BFDBFE" : session.status === "completed" ? "#D1FAE5" : "#FEE2E2"}`,
                }}
              >
                <div className="flex flex-wrap items-start gap-4 p-5">
                  {/* Type icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: session.status === "upcoming" ? "#EFF6FF" : session.status === "completed" ? "#F0FDF4" : "#FEF2F2" }}
                  >
                    {session.type === "video"     && <Video  size={18} color={session.status === "upcoming" ? "#3B82F6" : session.status === "completed" ? "#00A05A" : "#EF4444"} />}
                    {session.type === "chat"      && <MessageCircle size={18} color={session.status === "upcoming" ? "#3B82F6" : session.status === "completed" ? "#00A05A" : "#EF4444"} />}
                    {session.type === "in_person" && <Coffee size={18} color={session.status === "upcoming" ? "#3B82F6" : session.status === "completed" ? "#00A05A" : "#EF4444"} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <p style={{ color: "#111827", fontWeight: 700 }}>{session.topic}</p>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: session.status === "upcoming" ? "#EFF6FF" : session.status === "completed" ? "#D1FAE5" : "#FEE2E2",
                          color: session.status === "upcoming" ? "#1D4ED8" : session.status === "completed" ? "#065F46" : "#991B1B",
                          fontWeight: 700,
                        }}
                      >
                        {session.status === "upcoming" ? "📅 À venir" : session.status === "completed" ? "✅ Complétée" : "❌ Annulée"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "#6B7280" }}>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {session.date} à {session.time}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {session.duration}</span>
                      <span className="flex items-center gap-1">
                        {session.type === "video" ? <Video size={11} /> : session.type === "chat" ? <MessageCircle size={11} /> : <Coffee size={11} />}
                        {session.type === "video" ? "Visio" : session.type === "chat" ? "Chat" : "En présentiel"}
                      </span>
                    </div>
                    {session.notes && (
                      <div className="mt-3 p-3 rounded-xl text-xs" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#4B5563", lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 600, color: "#374151" }}>📝 Notes tuteur : </span>{session.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {session.status === "upcoming" && (
                      <>
                        <button
                          onClick={() => setShowMessaging(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 600 }}
                        >
                          <MessageCircle size={11} /> Rappeler
                        </button>
                        <button
                          onClick={() => {
                            setSessions((p) => p.map((s) => s.id === session.id ? { ...s, status: "completed" } : s));
                            if (id) updateStudentSessionStatus(id, session.id, "completed");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: "#F0FDF4", color: "#15803D", fontWeight: 600 }}
                        >
                          <Check size={11} /> Marquer comme faite
                        </button>
                      </>
                    )}
                    {session.status === "completed" && (
                      <button
                        onClick={() => setShowMessaging(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: "#F0FDF4", color: "#15803D", fontWeight: 600 }}
                      >
                        <MessageCircle size={11} /> Envoyer CR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick message integration */}
          <div
            className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#F0FDF4", border: "1px dashed #86EFAC" }}
            onClick={() => setShowMessaging(true)}
          >
            <MessageCircle size={18} color="#00A05A" />
            <div>
              <p className="text-sm" style={{ color: "#15803D", fontWeight: 700 }}>Envoyer un message à {student.name}</p>
              <p className="text-xs" style={{ color: "#4ADE80" }}>Ouvrir la messagerie pour confirmer une session ou envoyer un compte-rendu</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Activity ── */}
      {activeTab === "activity" && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} color="#374151" />
            <h2 style={{ color: "#111827", fontWeight: 700 }}>Activité récente</h2>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px" style={{ backgroundColor: "#E5E7EB" }} />
            <div className="space-y-4 pl-10">
              {timelineEvents.map((a, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-7 top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: a.tone }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fff" }} />
                  </div>
                  <p className="text-xs mb-0.5" style={{ color: "#9CA3AF" }}>{a.dateLabel} · {a.category}</p>
                  <p className="text-sm" style={{ color: "#374151", lineHeight: 1.5 }}>{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Cours assignés ── */}
      {activeTab === "cours" && id && (
        <div className="space-y-4">
          <div className="rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={16} color="#005EFA" />
              <h2 style={{ color: "#111827", fontWeight: 700 }}>Cours assignés à {student?.name}</h2>
            </div>
            <p className="text-xs mb-6" style={{ color: "#9CA3AF" }}>
              Activez ou désactivez l'accès à chaque cours pour cet apprenant. Les modifications sont immédiates.
            </p>

            <div key={courseAccessVersion} className="space-y-3">
              {catalog.map((course) => {
                const enrolled = isStudentEnrolledInCourse(course.id, id);
                const studentProgress = course.moduleId <= (student?.moduleId ?? 0)
                  ? "completed"
                  : course.moduleId === (student?.moduleId ?? 0) + 1
                  ? "current"
                  : "locked";
                return (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                    style={{
                      backgroundColor: enrolled ? "#F0FDF4" : "#F9FAFB",
                      border: `1.5px solid ${enrolled ? "#86EFAC" : "#E5E7EB"}`,
                    }}
                  >
                    {/* Module number */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm"
                      style={{
                        backgroundColor: enrolled ? "#00A05A" : "#E5E7EB",
                        color: enrolled ? "#fff" : "#9CA3AF",
                        fontWeight: 800,
                      }}
                    >
                      P{course.moduleId}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{course.name}</p>
                        {studentProgress === "completed" && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 600 }}>✓ Complété</span>
                        )}
                        {studentProgress === "current" && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 600 }}>▶ En cours</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>{course.difficulty}</span>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>•</span>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>{course.duration}</span>
                        <div className="flex gap-1">
                          {course.tags.map((tag) => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 500 }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleCourseAccess(course.id)}
                      className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl text-xs transition-all"
                      style={{
                        backgroundColor: enrolled ? "#D1FAE5" : "#F3F4F6",
                        color: enrolled ? "#15803D" : "#9CA3AF",
                        fontWeight: 700,
                        border: `1px solid ${enrolled ? "#86EFAC" : "#E5E7EB"}`,
                      }}
                      title={enrolled ? "Désactiver ce cours pour cet apprenant" : "Activer ce cours pour cet apprenant"}
                    >
                      {enrolled
                        ? <><ToggleRight size={18} color="#00A05A" /> Actif</>
                        : <><ToggleLeft size={18} color="#D1D5DB" /> Inactif</>
                      }
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 p-3 rounded-xl flex items-start gap-2" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <BookOpen size={13} color="#005EFA" className="shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: "#1E40AF", lineHeight: 1.65 }}>
                <strong>Note :</strong> Désactiver un cours ne supprime pas la progression de l'apprenant. Il suffira de le réactiver pour qu'il retrouve son avancement intact.
                Pour configurer l'accès de tous les apprenants à la fois, utilisez <strong>Créer / modifier un cours → Étape 5</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Force validation modal ── */}
      {showForceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
            {forced ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#D1FAE5", border: "3px solid #86EFAC" }}>
                  <ShieldCheck size={32} color="#00A05A" />
                </div>
                <div>
                  <p className="text-base" style={{ color: "#111827", fontWeight: 800 }}>Validation forcée ✅</p>
                  <p className="text-sm mt-1" style={{ color: "#6B7280" }}>{student.name} peut maintenant accéder au Projet 5.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 border-b" style={{ borderColor: "#F3F4F6" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} color="#F59E0B" />
                      <h3 style={{ color: "#111827", fontWeight: 700 }}>Forcer la validation admin</h3>
                    </div>
                    <button onClick={() => setShowForceModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
                      <X size={15} color="#6B7280" />
                    </button>
                  </div>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-start gap-3 p-3 rounded-xl mb-4" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                    <AlertTriangle size={15} color="#D97706" className="shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: "#92400E", lineHeight: 1.6 }}>
                      Cette action contourne la validation IA. Elle sera consignée dans les logs et le tuteur <strong>{assignedTutor.name}</strong> sera notifié.
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1.5" style={{ color: "#374151", fontWeight: 600 }}>
                      Raison / Justification <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <textarea
                      value={forceReason}
                      onChange={(e) => setForceReason(e.target.value)}
                      rows={3}
                      placeholder="Ex : Session de mentorat effectuée, les erreurs corrigées en direct…"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#374151" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowForceModal(false)} className="flex-1 py-3 rounded-xl text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 600 }}>
                      Annuler
                    </button>
                    <button
                      onClick={handleForce}
                      disabled={!forceReason.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                      style={{
                        backgroundColor: forceReason.trim() ? "#F59E0B" : "#E5E7EB",
                        color: forceReason.trim() ? "#78350F" : "#9CA3AF",
                        fontWeight: 700,
                        cursor: forceReason.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      <ShieldCheck size={15} /> Confirmer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Session Planner Modal ── */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
            {sessionSaved ? (
              <div className="flex flex-col items-center gap-4 p-10 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#D1FAE5", border: "3px solid #86EFAC" }}>
                  <CheckCircle2 size={32} color="#00A05A" />
                </div>
                <p className="text-base" style={{ color: "#111827", fontWeight: 800 }}>Session planifiée ✅</p>
                <p className="text-sm" style={{ color: "#6B7280" }}>Un message de confirmation a été envoyé à {student.name} via la messagerie.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "#F3F4F6" }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} color="#005EFA" />
                    <h3 style={{ color: "#111827", fontWeight: 700 }}>Planifier une session de mentorat</h3>
                  </div>
                  <button onClick={() => setShowSessionModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
                    <X size={15} color="#6B7280" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Apprenant + tuteur */}
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-white" style={{ background: "linear-gradient(135deg, #005EFA, #3B82F6)", fontWeight: 800 }}>
                      {student.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: "#374151", fontWeight: 700 }}>{student.name}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>avec {assignedTutor.name} · {assignedTutor.specialty}</p>
                    </div>
                  </div>

                  {/* Date + heure */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "#374151", fontWeight: 600 }}>Date <span style={{ color: "#EF4444" }}>*</span></label>
                      <input
                        type="date"
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm((p) => ({ ...p, date: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "#374151", fontWeight: 600 }}>Heure <span style={{ color: "#EF4444" }}>*</span></label>
                      <input
                        type="time"
                        value={sessionForm.time}
                        onChange={(e) => setSessionForm((p) => ({ ...p, time: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827" }}
                      />
                    </div>
                  </div>

                  {/* Durée + Type */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "#374151", fontWeight: 600 }}>Durée</label>
                      <select
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm((p) => ({ ...p, duration: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                        style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827" }}
                      >
                        {["15 min", "30 min", "45 min", "1h", "1h30", "2h"].map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "#374151", fontWeight: 600 }}>Type de session</label>
                      <div className="flex gap-2">
                        {([["video", "🎥 Visio"], ["chat", "💬 Chat"], ["in_person", "☕ Présentiel"]] as const).map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => setSessionForm((p) => ({ ...p, type: val }))}
                            className="flex-1 py-2 rounded-xl text-xs"
                            style={{
                              backgroundColor: sessionForm.type === val ? "#005EFA" : "#F3F4F6",
                              color: sessionForm.type === val ? "#fff" : "#374151",
                              fontWeight: sessionForm.type === val ? 700 : 500,
                              border: sessionForm.type === val ? "none" : "1px solid #E5E7EB",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sujet */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "#374151", fontWeight: 600 }}>Sujet / Objectif de la session <span style={{ color: "#EF4444" }}>*</span></label>
                    <textarea
                      value={sessionForm.topic}
                      onChange={(e) => setSessionForm((p) => ({ ...p, topic: e.target.value }))}
                      rows={3}
                      placeholder="Ex : Revoir la gestion des exceptions Try/Catch et débloquer la soumission #5…"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#374151", lineHeight: 1.6 }}
                    />
                  </div>

                  {/* Option: send message */}
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                    <MessageCircle size={13} color="#00A05A" />
                    <p className="text-xs" style={{ color: "#15803D", lineHeight: 1.5 }}>
                      Un message de confirmation sera automatiquement envoyé à <strong>{student.name}</strong> via la messagerie lors de la planification.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowSessionModal(false)} className="flex-1 py-3 rounded-xl text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 600 }}>
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveSession}
                      disabled={!sessionForm.date || !sessionForm.time || !sessionForm.topic}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                      style={{
                        backgroundColor: (!sessionForm.date || !sessionForm.time || !sessionForm.topic) ? "#E5E7EB" : "#005EFA",
                        color: (!sessionForm.date || !sessionForm.time || !sessionForm.topic) ? "#9CA3AF" : "#fff",
                        fontWeight: 700,
                      }}
                    >
                      <Calendar size={14} /> Confirmer la session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── PDF Export Modal ── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ backgroundColor: "#fff", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "#F3F4F6", backgroundColor: "#0A1628" }}>
              <div className="flex items-center gap-2">
                <Printer size={16} color="#93C5FD" />
                <p style={{ color: "#F1F5F9", fontWeight: 700 }}>Bilan One-to-One — {student.name}</p>
              </div>
              <button onClick={() => setShowExportModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70">
                <X size={15} color="#94A3B8" />
              </button>
            </div>

            {/* Scrollable preview */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* ─── Printable content ─── */}
              <div ref={printRef} style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: "#111827" }}>
                {/* Report header */}
                <div style={{ borderBottom: "3px solid #005EFA", paddingBottom: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#111827" }}>
                        Bilan One-to-One — {student.name}
                      </h1>
                      <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#6B7280" }}>
                        {details.department} · {details.email}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#9CA3AF" }}>Academy</p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#9CA3AF" }}>
                        Généré le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#9CA3AF" }}>Tuteur : {assignedTutor.name}</p>
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                  {[
                    { label: "Module actuel",   value: student.module,                                          color: "#005EFA" },
                    { label: "Temps total",     value: details.totalTime,                                      color: "#7C3AED" },
                    { label: "Score moyen",     value: avgScore > 0 ? `${Math.round(avgScore)}/100` : "N/A",   color: "#00A05A" },
                    { label: "Sessions mentorat", value: `${sessions.filter((s) => s.status === "completed").length} effectuées`, color: "#F59E0B" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{ flex: 1, textAlign: "center", background: "#F9FAFB", borderRadius: 10, padding: "12px 8px", border: "1px solid #E5E7EB" }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: "1.2rem", color: kpi.color }}>{kpi.value}</p>
                      <p style={{ margin: "3px 0 0", fontSize: "0.7rem", color: "#9CA3AF" }}>{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* Competency scores */}
                <h2 style={{ fontSize: "0.95rem", fontWeight: 700, borderBottom: "2px solid #E5E7EB", paddingBottom: 6, marginBottom: 12 }}>📊 Radar de compétences</h2>
                <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 12, marginBottom: 20 }}>
                  {radarData.map((item) => {
                    const color = item.score >= 80 ? "#00A05A" : item.score >= 60 ? "#F59E0B" : "#EF4444";
                    return (
                      <div key={item.subject} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ width: 110, fontSize: "0.8rem", fontWeight: 600, color: "#374151", flexShrink: 0 }}>{item.subject}</span>
                        <div style={{ flex: 1, height: 8, backgroundColor: "#E5E7EB", borderRadius: 99 }}>
                          <div style={{ height: 8, width: `${item.score}%`, backgroundColor: color, borderRadius: 99 }} />
                        </div>
                        <span style={{ width: 55, textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color }}>{item.score}/100</span>
                      </div>
                    );
                  })}
                </div>

                {/* Submissions */}
                <h2 style={{ fontSize: "0.95rem", fontWeight: 700, borderBottom: "2px solid #E5E7EB", paddingBottom: 6, marginBottom: 12 }}>📁 Historique des soumissions</h2>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB" }}>
                      {["Projet", "Date", "Statut", "Score", "Temps passé"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", fontSize: "0.75rem", fontWeight: 700, color: "#6B7280", textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {details.submissions.map((sub: any) => (
                      <tr key={sub.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "8px 10px", fontSize: "0.82rem", fontWeight: 600, color: "#111827" }}>{sub.project}</td>
                        <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#6B7280" }}>{sub.date}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, backgroundColor: sub.status === "validated" ? "#D1FAE5" : sub.status === "in_progress" ? "#EFF6FF" : "#FEE2E2", color: sub.status === "validated" ? "#065F46" : sub.status === "in_progress" ? "#1D4ED8" : "#991B1B" }}>
                            {sub.status === "validated" ? "✓ Validé" : sub.status === "in_progress" ? "En cours" : "Bloqué"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: "0.82rem", fontWeight: 700, color: sub.score >= 90 ? "#065F46" : sub.score >= 80 ? "#92400E" : "#991B1B" }}>
                          {sub.score !== null ? `${sub.score}/100` : "—"}
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#6B7280", fontFamily: "monospace" }}>{sub.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Points à améliorer */}
                {(details.improvements ?? []).length > 0 && (
                  <>
                    <h2 style={{ fontSize: "0.95rem", fontWeight: 700, borderBottom: "2px solid #E5E7EB", paddingBottom: 6, marginBottom: 12 }}>🎯 Points à améliorer</h2>
                    <div style={{ marginBottom: 20 }}>
                      {(details.improvements ?? []).map((item: any, i: number) => (
                        <div key={i} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 8, backgroundColor: item.priority === "high" ? "#FEF2F2" : item.priority === "medium" ? "#FFFBEB" : "#ECFDF5", borderLeft: `3px solid ${item.priority === "high" ? "#EF4444" : item.priority === "medium" ? "#F59E0B" : "#10B981"}` }}>
                          <p style={{ margin: "0 0 4px", fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>{item.icon} {item.title} <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9CA3AF" }}>— {item.category}</span></p>
                          <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "#4B5563", lineHeight: 1.55 }}>{item.detail}</p>
                          <p style={{ margin: 0, fontSize: "0.78rem", color: "#15803D", fontWeight: 600 }}>→ {item.action}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Sessions de mentorat */}
                <h2 style={{ fontSize: "0.95rem", fontWeight: 700, borderBottom: "2px solid #E5E7EB", paddingBottom: 6, marginBottom: 12 }}>📅 Sessions de mentorat</h2>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB" }}>
                      {["Date", "Heure", "Durée", "Sujet", "Statut"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", fontSize: "0.75rem", fontWeight: 700, color: "#6B7280", textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#374151" }}>{s.date}</td>
                        <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#374151" }}>{s.time}</td>
                        <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#6B7280" }}>{s.duration}</td>
                        <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#111827", fontWeight: 600 }}>{s.topic}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, backgroundColor: s.status === "completed" ? "#D1FAE5" : s.status === "upcoming" ? "#EFF6FF" : "#FEE2E2", color: s.status === "completed" ? "#065F46" : s.status === "upcoming" ? "#1D4ED8" : "#991B1B" }}>
                            {s.status === "completed" ? "Complétée" : s.status === "upcoming" ? "À venir" : "Annulée"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer */}
                <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#9CA3AF" }}>
                  <span>Academy — Document confidentiel</span>
                  <span>Tuteur référent : {assignedTutor.name} · {assignedTutor.specialty}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: "#F3F4F6" }}>
              <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 rounded-xl text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 600 }}>
                Fermer
              </button>
              <button
                onClick={handlePrintReport}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                style={{ backgroundColor: "#005EFA", color: "#fff", fontWeight: 700, boxShadow: "0 4px 14px rgba(0,94,250,0.3)" }}
              >
                <Printer size={15} /> Imprimer / Exporter PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Messaging panel ── */}
      {showMessaging && (
        <MessagingPanel
          studentId={student.id}
          studentName={student.name}
          studentAvatar={student.avatar}
          tutorName={assignedTutor.name}
          onClose={() => setShowMessaging(false)}
        />
      )}
    </div>
  );
}
