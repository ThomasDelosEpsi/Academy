import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  CheckSquare,
  Clock,
  Code2,
  Download,
  ExternalLink,
  FileArchive,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Info,
  Lightbulb,
  Loader2,
  Lock,
  PlayCircle,
  RotateCcw,
  Shield,
  Timer,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { FEATURE_FLAGS } from "../config/appConfig";
import { PROJECTS, type ProjectResource } from "../data/projectsData";
import {
  addNotification,
  getLearnerProjects,
  getProjectSubmissionHistory,
  resetProjectReviewState,
  submitProjectReview,
  useAcademyStore,
} from "../data/academyStore";
import { InlineFeedback } from "./FeedbackProvider";

type AIState = "idle" | "analyzing" | "failed" | "success";

const AI_ERRORS = [
  "Le workflow principal depasse encore la limite d'activites.",
  "Un secret reste visible en dur dans le package soumis.",
  "Les logs techniques ne suivent pas encore le format metier attendu.",
];

function useSessionTimer() {
  const [seconds, setSeconds] = useState(2712);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ResourceIcon({ type }: { type: string }) {
  if (type === "ZIP") return <FileArchive size={16} color="#7C3AED" />;
  if (type === "LIEN") return <ExternalLink size={16} color="#005EFA" />;
  if (type === "XAML") return <Code2 size={16} color="#00A05A" />;
  if (type === "XLSX") return <FileSpreadsheet size={16} color="#15803D" />;
  return <FileText size={16} color="#D97706" />;
}

function downloadResource(projectId: number, projectTitle: string, resource: ProjectResource) {
  const content = [
    `Projet ${projectId} - ${projectTitle}`,
    `Ressource : ${resource.label}`,
    `Type : ${resource.type}`,
    `Description : ${resource.desc}`,
    resource.size ? `Taille : ${resource.size}` : "Taille : ressource en ligne",
    "",
    "Prototype local : cette ressource sera remplacee par un vrai fichier cote backend.",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${resource.label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resource"}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AIFeedbackPanel({
  state,
  onRetry,
  onNext,
  nextLabel,
}: {
  state: AIState;
  onRetry: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  if (state === "idle") return null;

  if (state === "analyzing") {
    return (
      <div className="rounded-[26px] p-6 text-center" style={{ border: "2px solid #F59E0B", background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)" }}>
        <div className="flex items-center justify-center gap-3">
          <Loader2 size={24} color="#D97706" className="animate-spin" />
          <Bot size={24} color="#D97706" />
        </div>
        <p className="mt-4 text-sm" style={{ color: "#92400E", fontWeight: 800 }}>Analyse IA en cours</p>
        <p className="mt-2 text-xs" style={{ color: "#B45309", lineHeight: 1.6 }}>Le moteur controle la structure, la securite et les regles metier avant validation.</p>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="overflow-hidden rounded-[26px]" style={{ border: "2px solid #EF4444" }}>
        <div className="px-5 py-4" style={{ background: "linear-gradient(135deg, #450A0A 0%, #7F1D1D 100%)" }}>
          <p className="text-sm" style={{ color: "#FECACA", fontWeight: 800 }}>Validation IA refusee</p>
          <p className="mt-1 text-xs" style={{ color: "#FCA5A5" }}>Des corrections restent necessaires avant de debloquer l'etape suivante.</p>
        </div>
        <div className="space-y-3 p-5" style={{ backgroundColor: "#FFF5F5" }}>
          {AI_ERRORS.map((error) => (
            <div key={error} className="rounded-2xl p-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #FECACA" }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} color="#DC2626" className="mt-0.5 shrink-0" />
                <p className="text-xs" style={{ color: "#6B7280", lineHeight: 1.55 }}>{error}</p>
              </div>
            </div>
          ))}
          <button onClick={onRetry} className="w-full rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EF4444", color: "#FFFFFF", fontWeight: 700 }}>
            Corriger et resoumettre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[26px]" style={{ border: "2px solid #00A05A" }}>
      <div className="px-5 py-5 text-center" style={{ background: "linear-gradient(135deg, #052E16 0%, #14532D 100%)" }}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(16,185,129,0.2)", border: "2px solid #34D399" }}>
          <CheckCircle2 size={24} color="#34D399" />
        </div>
        <p className="mt-4 text-sm" style={{ color: "#34D399", fontWeight: 800 }}>Validation IA reussie</p>
        <p className="mt-2 text-xs" style={{ color: "#6EE7B7", lineHeight: 1.6 }}>Toutes les regles sont valides. Vous pouvez passer a l'etape suivante.</p>
      </div>
      <div className="p-5" style={{ backgroundColor: "#F0FDF4" }}>
        <button onClick={onNext} className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm" style={{ backgroundColor: "#00A05A", color: "#FFFFFF", fontWeight: 700 }}>
          Passer a {nextLabel}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function ProjectDetail() {
  useAcademyStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id ?? "2");
  const learnerProjects = getLearnerProjects(PROJECTS);
  const project = learnerProjects.find((item) => item.id === projectId) ?? learnerProjects[1];
  const nextProject = learnerProjects.find((item) => item.id === projectId + 1);
  const submissionHistory = getProjectSubmissionHistory(projectId);
  const latestSubmission = submissionHistory[0];

  const isReview = project.status === "completed";
  const isLocked = project.status === "locked";

  const sessionTimer = useSessionTimer();
  const [repoUrl, setRepoUrl] = useState(latestSubmission?.repoUrl ?? "");
  const [uploadedFile, setUploadedFile] = useState<string | null>(latestSubmission?.fileName ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const [checklist, setChecklist] = useState({ structure: false, activities: false });
  const [aiState, setAiState] = useState<AIState>(isReview ? "success" : "idle");
  const [showHelp, setShowHelp] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submissionAttempts, setSubmissionAttempts] = useState(submissionHistory.length);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = !isReview && repoUrl.trim() !== "" && uploadedFile !== null && checklist.structure && checklist.activities && aiState === "idle";
  const validationErrors = useMemo(() => ({
    repoUrl: submitAttempted && repoUrl.trim() === "",
    file: submitAttempted && uploadedFile === null,
    checklist: submitAttempted && (!checklist.structure || !checklist.activities),
  }), [checklist.activities, checklist.structure, repoUrl, submitAttempted, uploadedFile]);

  const sidebarSteps = learnerProjects.map((item) => ({
    id: item.id,
    label: item.shortTitle,
    status: item.id < projectId ? "completed" : item.id === projectId ? "active" : "locked",
  }));

  const handleSubmit = () => {
    if (!canSubmit) {
      setSubmitAttempted(true);
      addNotification({
        kind: "warning",
        category: "submission",
        title: "Soumission incomplete",
        message: "Renseignez le depot, le package et la checklist avant de lancer l'analyse IA.",
        href: `/projet/${projectId}`,
      });
      return;
    }

    setSubmitAttempted(false);
    setAiState("analyzing");
    const shouldFail = projectId === 2 && submissionAttempts === 0;
    setSubmissionAttempts((value) => value + 1);

    window.setTimeout(() => {
      const nextState: AIState = shouldFail ? "failed" : "success";
      setAiState(nextState);
      submitProjectReview(projectId, nextState === "success" ? "success" : "failed", {
        repoUrl,
        fileName: uploadedFile ?? "",
      });
    }, 2200);
  };

  const handleRetry = () => {
    resetProjectReviewState(projectId);
    setAiState("idle");
    setRepoUrl("");
    setUploadedFile(null);
    setChecklist({ structure: false, activities: false });
    setSubmitAttempted(false);
  };

  if (isLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "#F4F6F8" }}>
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl" style={{ backgroundColor: "#F3F4F6" }}>
            <Lock size={34} color="#9CA3AF" />
          </div>
          <h2 className="mt-5" style={{ color: "#111827", fontWeight: 800, fontSize: "1.3rem" }}>Projet verrouille</h2>
          <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>{project.title} necessite {project.requires} avant de pouvoir etre debloque.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
            <ArrowLeft size={14} />
            Retour au parcours
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#F4F6F8", fontFamily: "'Inter', sans-serif" }}>
      <aside className="hidden w-64 shrink-0 border-r md:flex md:flex-col" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <div className="p-5">
          <Link to="/" className="mb-6 flex items-center gap-2 text-sm" style={{ color: "#6B7280", fontWeight: 600 }}>
            <ArrowLeft size={14} />
            Tableau de bord
          </Link>
          <p className="mb-3 text-xs uppercase tracking-[0.18em]" style={{ color: "#9CA3AF", fontWeight: 700 }}>Parcours</p>
          <div className="space-y-1.5">
            {sidebarSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-2 rounded-xl px-2 py-2" style={{ backgroundColor: step.status === "active" ? "#EFF6FF" : "transparent" }}>
                <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: step.status === "completed" ? "#D1FAE5" : step.status === "active" ? "#005EFA" : "#F3F4F6" }}>
                  {step.status === "completed" ? <CheckCircle2 size={11} color="#00A05A" /> : step.status === "active" ? <span style={{ color: "#FFFFFF", fontSize: 9, fontWeight: 800 }}>{step.id}</span> : <Lock size={9} color="#D1D5DB" />}
                </div>
                <span className="truncate text-xs" style={{ color: step.status === "active" ? "#005EFA" : step.status === "completed" ? "#374151" : "#9CA3AF", fontWeight: step.status === "active" ? 700 : 500 }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          {!isReview && FEATURE_FLAGS.ide && (
            <Link to={`/ide/${projectId}`} className="mt-6 flex items-center gap-2 rounded-2xl px-3 py-3 text-sm" style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", fontWeight: 700 }}>
              <Code2 size={14} />
              Ouvrir l'IDE
            </Link>
          )}
          <button
            onClick={() => setShowHelp((value) => !value)}
            className="mt-3 flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-sm"
            style={{ backgroundColor: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA", fontWeight: 700 }}
          >
            <HelpCircle size={14} />
            Aide et FAQ
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 md:px-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#F3F4F6" }}>
          <div>
            <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Projet {projectId}</p>
            <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.1rem" }}>{project.title}</h1>
          </div>
          {!isReview ? (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "#0A1628", border: "1px solid rgba(0,94,250,0.3)" }}>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#F59E0B" }} />
              <Timer size={12} color="#94A3B8" />
              <span className="text-xs" style={{ color: "#F59E0B", fontFamily: "monospace", fontWeight: 800 }}>{sessionTimer}</span>
            </div>
          ) : (
            <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#D1FAE5", color: "#166534", fontWeight: 700 }}>Revision</span>
          )}
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
          <div className="rounded-[28px] p-6" style={{ backgroundColor: "#FFFFFF", border: `2px solid ${isReview ? "#00A05A" : "#005EFA"}` }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: isReview ? "#D1FAE5" : "#FEF3C7", color: isReview ? "#166534" : "#92400E", fontWeight: 700 }}>
                    {isReview ? "Complete" : "En cours"}
                  </span>
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                    Duree : {project.duration}
                  </span>
                </div>
                <p className="mt-4 text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>{project.context}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span key={tag} className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F0F9FF", color: "#0369A1", fontWeight: 700 }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {isReview && (
              <div className="mt-5 flex items-center gap-4 rounded-3xl p-4" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "#D1FAE5" }}>
                  <Trophy size={24} color="#00A05A" />
                </div>
                <div>
                  <p style={{ color: "#166534", fontWeight: 700 }}>Score IA : {latestSubmission?.score ?? 94}/100</p>
                  <p className="mt-1 text-xs" style={{ color: "#15803D" }}>Le projet est valide et l'historique reste visible ci-dessous.</p>
                </div>
              </div>
            )}
          </div>

          {showHelp && (
            <div className="mt-6 rounded-[26px] p-5" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
              <p style={{ color: "#9A3412", fontWeight: 700 }}>Aide rapide</p>
              <p className="mt-2 text-sm" style={{ color: "#C2410C", lineHeight: 1.65 }}>
                Commencez par les ressources, verifiez les regles bloquantes puis soumettez avec un depot et un package propres.
              </p>
            </div>
          )}

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={17} color="#7C3AED" />
              <h2 style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}>Regles de validation IA</h2>
            </div>
            <div className="space-y-3">
              {project.rules.map((rule) => (
                <div key={rule.label} className="flex items-start gap-3 rounded-[24px] p-4" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${rule.severity === "blocking" ? "#FECACA" : "#FDE68A"}` }}>
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: rule.severity === "blocking" ? "#FEE2E2" : "#FEF3C7" }}>
                    {rule.severity === "blocking" ? <Shield size={13} color="#DC2626" /> : <AlertTriangle size={13} color="#D97706" />}
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{rule.label}</p>
                    <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{rule.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen size={17} color="#00A05A" />
              <h2 style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}>Ressources telechargeables</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {project.resources.map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => {
                    downloadResource(project.id, project.title, resource);
                    addNotification({
                      kind: "success",
                      category: "course",
                      title: "Ressource telechargee",
                      message: `${resource.label} a ete preparee localement pour le prototype.`,
                      href: `/projet/${project.id}`,
                    });
                  }}
                  className="flex items-center gap-3 rounded-[24px] p-4 text-left"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#F9FAFB" }}>
                    <ResourceIcon type={resource.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm" style={{ color: "#111827", fontWeight: 700 }}>{resource.label}</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>
                      {resource.desc}
                      {resource.size ? ` · ${resource.size}` : ""}
                    </p>
                  </div>
                  <Download size={14} color="#005EFA" />
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Trophy size={17} color="#005EFA" />
              <h2 style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}>Historique des soumissions</h2>
            </div>
            {submissionHistory.length === 0 ? (
              <InlineFeedback
                title="Aucune soumission enregistree"
                description="Votre premier essai apparaitra ici avec le score, le depot cible, le package depose et les commentaires IA."
              />
            ) : (
              <div className="space-y-3">
                {submissionHistory.map((submission) => (
                  <div key={submission.id} className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${submission.outcome === "success" ? "#BBF7D0" : "#FECACA"}` }}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: submission.outcome === "success" ? "#DCFCE7" : "#FEF2F2", color: submission.outcome === "success" ? "#166534" : "#991B1B", fontWeight: 700 }}>
                            {submission.outcome === "success" ? "Validee" : "A corriger"}
                          </span>
                          <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#4B5563", fontWeight: 700 }}>
                            Tentative #{submission.attempt}
                          </span>
                        </div>
                        <p className="mt-3 text-sm" style={{ color: "#111827", fontWeight: 700 }}>Score IA : {submission.score}/100</p>
                        <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>{formatTimestamp(submission.submittedAt)}</p>
                        {submission.fileName && <p className="mt-1 text-xs" style={{ color: "#2563EB", fontFamily: "monospace" }}>{submission.fileName}</p>}
                      </div>
                      <p className="max-w-sm text-sm" style={{ color: "#4B5563", lineHeight: 1.6 }}>{submission.summary}</p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {submission.feedback.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl p-3"
                          style={{
                            backgroundColor: item.severity === "success" ? "#F0FDF4" : item.severity === "critical" ? "#FEF2F2" : "#FFFBEB",
                            border: `1px solid ${item.severity === "success" ? "#BBF7D0" : item.severity === "critical" ? "#FECACA" : "#FDE68A"}`,
                          }}
                        >
                          <p className="text-xs" style={{ color: "#111827", fontWeight: 700 }}>{item.label}</p>
                          <p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.55 }}>{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {!isReview && (
            <section className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <Upload size={17} color="#374151" />
                <h2 style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}>Soumission</h2>
              </div>

              <div className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <p className="mb-4 text-sm" style={{ color: "#374151", fontWeight: 700 }}>Avant de soumettre, verifiez :</p>
                {[
                  { key: "structure", label: `Structure ${project.rules[0]?.label} respectee` },
                  { key: "activities", label: "Limite d'activites respectee (max 50 par XAML)" },
                ].map(({ key, label }) => (
                  <label key={key} className="mb-3 flex items-center gap-3">
                    <div
                      onClick={() => setChecklist((previous) => ({ ...previous, [key]: !previous[key as keyof typeof previous] }))}
                      className="flex h-5 w-5 items-center justify-center rounded"
                      style={{ backgroundColor: checklist[key as keyof typeof checklist] ? "#005EFA" : "#F9FAFB", border: `2px solid ${checklist[key as keyof typeof checklist] ? "#005EFA" : "#D1D5DB"}` }}
                    >
                      {checklist[key as keyof typeof checklist] && <CheckSquare size={12} color="#FFFFFF" />}
                    </div>
                    <span className="text-sm" style={{ color: "#374151" }}>{label}</span>
                  </label>
                ))}
                {validationErrors.checklist && (
                  <p className="text-xs" style={{ color: "#B91C1C", fontWeight: 700 }}>Cochez tous les pre-requis avant de soumettre.</p>
                )}
              </div>

              <div className="mt-4 rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <label htmlFor="project-repo-url" className="block text-sm" style={{ color: "#374151", fontWeight: 700 }}>URL du depot de livraison</label>
                <input
                  id="project-repo-url"
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder="https://plateforme.exemple.com/projet/..."
                  aria-invalid={validationErrors.repoUrl}
                  className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ border: `1.5px solid ${validationErrors.repoUrl ? "#DC2626" : repoUrl ? "#005EFA" : "#E5E7EB"}`, backgroundColor: "#F9FAFB", color: "#111827" }}
                />
                {validationErrors.repoUrl && (
                  <p className="mt-2 text-xs" style={{ color: "#B91C1C", fontWeight: 700 }}>L'URL du depot est obligatoire pour tracer la livraison.</p>
                )}
              </div>

              <div
                className="mt-4 rounded-[24px]"
                style={{ backgroundColor: "#FFFFFF", border: `2px dashed ${isDragging ? "#005EFA" : uploadedFile ? "#00A05A" : "#D1D5DB"}` }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  const file = event.dataTransfer.files[0];
                  if (file) setUploadedFile(file.name);
                }}
              >
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "#D1FAE5" }}>
                      <CheckCircle2 size={20} color="#00A05A" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{uploadedFile}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>Package pret pour soumission</p>
                    </div>
                    <button type="button" onClick={() => setUploadedFile(null)} className="rounded-xl px-2 py-1" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex cursor-pointer flex-col items-center gap-2 p-8 text-center" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={24} color={isDragging ? "#005EFA" : "#9CA3AF"} />
                    <p className="text-sm" style={{ color: "#374151", fontWeight: 700 }}>Glissez votre fichier .nupkg ou cliquez</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Package de livraison attendu - max 50 MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".nupkg"
                      className="hidden"
                      onChange={(event) => event.target.files?.[0] && setUploadedFile(event.target.files[0].name)}
                    />
                  </div>
                )}
              </div>
              {validationErrors.file && (
                <p className="mt-2 text-xs" style={{ color: "#B91C1C", fontWeight: 700 }}>Ajoutez un package `.nupkg` avant de lancer l'analyse.</p>
              )}

              <button onClick={handleSubmit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm" style={{ backgroundColor: canSubmit ? "#005EFA" : "#E5E7EB", color: canSubmit ? "#FFFFFF" : "#9CA3AF", fontWeight: 700 }}>
                <Bot size={16} />
                Lancer la validation IA
              </button>

              <p className="mt-3 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                Le feedback est non bloquant : score, commentaires IA et historique restent visibles apres chaque tentative.
              </p>

              <div className="mt-5">
                <AIFeedbackPanel
                  state={aiState}
                  onRetry={handleRetry}
                  onNext={() => navigate(nextProject ? `/projet/${nextProject.id}` : "/")}
                  nextLabel={nextProject ? `Projet ${nextProject.id}` : "la certification"}
                />
              </div>
            </section>
          )}

          {isReview && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/" className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
                <ArrowLeft size={14} />
                Retour au parcours
              </Link>
              <Link to={nextProject ? `/projet/${nextProject.id}` : "/"} className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
                {nextProject ? `Continuer vers le projet ${nextProject.id}` : "Retour a la certification"}
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
