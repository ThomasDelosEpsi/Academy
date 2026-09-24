import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Lightbulb,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  forceValidateStudentProject,
  getBlockedSubmissionState,
  markBlockedSubmissionContacted,
  markBlockedSubmissionInspected,
  rerunBlockedSubmissionAnalysis,
  useAcademyStore,
} from "../data/academyStore";

const BLOCKED = [
  {
    id: "benjamin-leclerc",
    studentName: "Benjamin Leclerc",
    avatar: "BL",
    module: "P4 — Onboarding RH",
    projectId: 4,
    daysBlocked: 16,
    submittedAt: "28 Mars 2026, 10:14",
    lastAttempt: "Il y a 2h",
    attempts: 4,
    file: "OnboardingRH_BLeclerc_v4.nupkg",
    fileSize: "18.2 MB",
    aiErrors: [
      { severity: "critical", rule: "Nombre max d'activités dépassé", detail: "Main.xaml contient 74 activités (limite : 50).", tip: "Créez des sous-workflows via Invoke Workflow File." },
      { severity: "critical", rule: "Credentials en dur détectés", detail: "Des secrets sont définis en clair dans le workflow.", tip: "Utilisez des Orchestrator Assets de type Credential." },
      { severity: "warning", rule: "Logs non structurés", detail: "Les messages ne suivent pas le format attendu.", tip: "Utilisez le template JSON fourni." },
    ],
  },
  {
    id: "camille-durand",
    studentName: "Camille Durand",
    avatar: "CD",
    module: "P4 — Onboarding RH",
    projectId: 4,
    daysBlocked: 13,
    submittedAt: "01 Avril 2026, 14:30",
    lastAttempt: "Il y a 5h",
    attempts: 3,
    file: "P4_CDurand_submission3.zip",
    fileSize: "22.7 MB",
    aiErrors: [
      { severity: "critical", rule: "Structure REFramework manquante", detail: "Le workflow n'implémente pas le pattern obligatoire.", tip: "Partez du template REFramework des ressources." },
      { severity: "critical", rule: "Nombre max d'activités dépassé", detail: "Main.xaml contient 61 activités.", tip: "Décomposez le bloc Init." },
    ],
  },
  {
    id: "francois-moreau",
    studentName: "François Moreau",
    avatar: "FM",
    module: "P4 — Onboarding RH",
    projectId: 4,
    daysBlocked: 15,
    submittedAt: "29 Mars 2026, 09:00",
    lastAttempt: "Hier",
    attempts: 5,
    file: "FMoreau_Onboarding_final.nupkg",
    fileSize: "15.8 MB",
    aiErrors: [
      { severity: "critical", rule: "Credentials en dur détectés", detail: "3 occurrences de mots de passe en clair dans Init.xaml.", tip: "Centralisez toutes les credentials dans des Orchestrator Assets." },
      { severity: "warning", rule: "Gestion des exceptions incomplète", detail: "Des activités critiques ne sont pas protégées.", tip: "Encadrez les blocs sensibles dans des Try/Catch." },
    ],
  },
];

function SubmissionCard({
  submission,
}: {
  submission: (typeof BLOCKED)[0];
}) {
  useAcademyStore();
  const [expanded, setExpanded] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const blockedState = getBlockedSubmissionState(submission.id);
  const forced = !!blockedState.forced;
  const criticals = submission.aiErrors.filter((error) => error.severity === "critical").length;
  const warnings = submission.aiErrors.filter((error) => error.severity === "warning").length;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: forced ? "2px solid #00A05A" : "2px solid #FECACA",
        boxShadow: forced ? "0 0 0 4px rgba(0,160,90,0.08)" : "0 0 0 4px rgba(239,68,68,0.06)",
      }}
    >
      <div
        className="flex flex-wrap items-center gap-4 px-6 py-4"
        style={{ background: forced ? "linear-gradient(135deg, #052E16, #14532D)" : "linear-gradient(135deg, #450A0A, #7F1D1D)" }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm text-white shrink-0"
          style={{ background: forced ? "linear-gradient(135deg,#00A05A,#34D399)" : "linear-gradient(135deg,#DC2626,#EF4444)", fontWeight: 700 }}
        >
          {submission.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <p className="text-sm" style={{ color: "#F3F4F6", fontWeight: 700 }}>{submission.studentName}</p>
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: forced ? "#00A05A" : "#EF4444", color: "#fff", fontWeight: 700 }}>
              {forced ? "VALIDÉ ADMIN" : "BLOQUÉ"}
            </span>
          </div>
          <p className="text-xs" style={{ color: forced ? "#6EE7B7" : "#FCA5A5" }}>
            {submission.module} · {submission.attempts} tentative(s) · Bloqué depuis {submission.daysBlocked} jours
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <Clock size={12} color={forced ? "#6EE7B7" : "#FCA5A5"} />
            <span className="text-xs" style={{ color: forced ? "#6EE7B7" : "#FCA5A5", fontWeight: 700, fontFamily: "monospace" }}>
              {submission.daysBlocked}j bloqué
            </span>
          </div>
          <button onClick={() => setExpanded((value) => !value)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            {expanded ? <ChevronDown size={14} color="#fff" /> : <ChevronRight size={14} color="#fff" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-6" style={{ backgroundColor: forced ? "#F0FDF4" : "#FFF5F5" }}>
          {actionNote && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }}>
              {actionNote}
            </div>
          )}

          <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ backgroundColor: "#fff", border: "1px solid #FECACA" }}>
            <div className="flex-1">
              <p className="text-sm" style={{ color: "#111827", fontWeight: 600 }}>{submission.file}</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                {submission.fileSize} · Soumis le {submission.submittedAt} · Dernière tentative : {submission.lastAttempt}
              </p>
            </div>
            <button
              onClick={() => {
                setShowPreview((value) => !value);
                markBlockedSubmissionInspected(submission.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:opacity-80"
              style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 600 }}
            >
              <Eye size={11} /> {showPreview ? "Masquer" : "Inspecter"}
            </button>
          </div>

          {showPreview && (
            <div className="mb-5 rounded-xl p-4" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
              <p className="text-sm mb-2" style={{ color: "#111827", fontWeight: 700 }}>Aperçu de la soumission</p>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Fichier : {submission.file}</p>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Blocages critiques : {criticals}</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>Warnings : {warnings} · Réanalyses : {blockedState.reanalysisCount ?? 0}</p>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Bot size={14} color="#EF4444" />
            <p className="text-xs" style={{ color: "#991B1B", fontWeight: 700 }}>
              Rapport IA — {criticals} erreur(s) bloquante(s) · {warnings} avertissement(s)
            </p>
          </div>

          <div className="space-y-3 mb-5">
            {submission.aiErrors.map((error, index) => (
              <div key={index} className="rounded-xl p-4" style={{ backgroundColor: "#fff", border: `1.5px solid ${error.severity === "critical" ? "#FECACA" : "#FDE68A"}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: error.severity === "critical" ? "#FEE2E2" : "#FEF3C7" }}>
                    {error.severity === "critical" ? <X size={12} color="#DC2626" /> : <AlertTriangle size={12} color="#D97706" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm mb-1" style={{ color: error.severity === "critical" ? "#991B1B" : "#92400E", fontWeight: 700 }}>{error.rule}</p>
                    <p className="text-xs mb-2" style={{ color: "#6B7280", lineHeight: 1.55 }}>{error.detail}</p>
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                      <Lightbulb size={11} color="#16A34A" className="shrink-0 mt-0.5" />
                      <p className="text-xs" style={{ color: "#15803D", lineHeight: 1.5 }}>
                        <strong>Conseil IA :</strong> {error.tip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => forceValidateStudentProject(submission.id, submission.projectId, submission.studentName, "Validation manuelle depuis la liste des blocages")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-opacity hover:opacity-80"
              style={{ backgroundColor: forced ? "#D1FAE5" : "#F59E0B", color: forced ? "#065F46" : "#78350F", fontWeight: 700 }}
            >
              <ShieldCheck size={13} /> {forced ? "Validation déjà forcée" : "Forcer la validation"}
            </button>
            <Link
              to={`/admin/apprenant/${submission.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 700, border: "1px solid #BFDBFE" }}
            >
              <Eye size={13} /> Voir le profil apprenant
            </Link>
            <button
              onClick={() => {
                markBlockedSubmissionContacted(submission.id, submission.studentName);
                setActionNote(`Relance envoyée à ${submission.studentName}.`);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 600, border: "1px solid #E5E7EB" }}
            >
              <MessageCircle size={13} /> Contacter
            </button>
            <button
              onClick={() => {
                rerunBlockedSubmissionAnalysis(submission.id, submission.studentName);
                setActionNote(`Nouvelle analyse IA demandée pour ${submission.studentName}.`);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 600, border: "1px solid #E5E7EB" }}
            >
              <RefreshCcw size={13} /> Relancer l'analyse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminBlockedSubmissions() {
  useAcademyStore();
  const [filterProject, setFilterProject] = useState("Tous");

  const filtered = useMemo(
    () => BLOCKED.filter((submission) => filterProject === "Tous" || submission.module.startsWith(filterProject)),
    [filterProject],
  );

  const avgDays = filtered.length
    ? (filtered.reduce((total, submission) => total + submission.daysBlocked, 0) / filtered.length).toFixed(1)
    : "0.0";

  return (
    <div className="px-6 md:px-10 py-8">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/admin" className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: "#6B7280" }}>
          <ArrowLeft size={15} /> Retour
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={20} color="#EF4444" />
            <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.45rem" }}>Soumissions bloquées</h1>
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {filtered.length} apprenant(s) nécessitent encore une correction ou une action admin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filterProject}
              onChange={(event) => setFilterProject(event.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none appearance-none pr-8"
              style={{ border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#374151", fontWeight: 600 }}
            >
              {["Tous", "P1", "P2", "P3", "P4", "P5"].map((project) => <option key={project}>{project}</option>)}
            </select>
            <Filter size={13} color="#9CA3AF" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Soumissions bloquées", value: `${filtered.length}`, color: "#EF4444", bg: "#FFF5F5", icon: X },
          { label: "Jours bloqués (moy.)", value: `${avgDays}j`, color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
          { label: "Tentatives totales", value: `${filtered.reduce((total, submission) => total + submission.attempts, 0)}`, color: "#005EFA", bg: "#EFF6FF", icon: RefreshCcw },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <p style={{ color, fontWeight: 800, fontSize: "1.4rem", lineHeight: 1 }}>{value}</p>
                <p className="text-xs" style={{ color: "#6B7280" }}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl mb-6" style={{ backgroundColor: "#FFFBEB", border: "1.5px solid #FDE68A" }}>
        <AlertTriangle size={16} color="#D97706" className="shrink-0 mt-0.5" />
        <div>
          <p className="text-sm" style={{ color: "#92400E", fontWeight: 700 }}>Goulot d'étranglement identifié sur le Projet 4</p>
          <p className="text-xs mt-0.5" style={{ color: "#B45309", lineHeight: 1.5 }}>
            Les apprenants filtrés partagent des erreurs structurelles récurrentes. La vue est maintenant interactive et persistée localement entre cette page et les fiches apprenants.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {filtered.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}
      </div>
    </div>
  );
}
