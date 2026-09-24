import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  PlayCircle,
  Star,
  Timer,
} from "lucide-react";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { CERTIFICATION_TITLE, LEARNER_TITLE } from "../config/appConfig";
import {
  dismissLearnerOnboarding,
  getCourseSubmissionHistory,
  isLearnerOnboardingDismissed,
  isFavorite,
  toggleFavorite,
  useAcademyStore,
} from "../data/academyStore";
import { getCourseProgress, getWorkspaceLearningMetrics, getWorkspaceLearningPath } from "../data/courseStore";
import { getCurrentTenant, getCurrentUser, getCurrentWorkspace, getCurrentWorkspaceRole, useTenantStore } from "../data/tenantStore";
import { InlineFeedback } from "./FeedbackProvider";
import { LearnerExperienceLayer } from "./LearnerExperienceLayer";

type LearningTrackItem = {
  id: string;
  status: "not_started" | "in_progress" | "submitted" | "refused" | "validated" | "locked";
  title: string;
  description: string;
  duration: string;
  tags: string[];
  completedDate?: string;
  completionTime?: string;
  progress?: number;
  requires?: string;
  href: string;
};

function useLiveTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function StatusBadge({ status }: { status: LearningTrackItem["status"] }) {
  const map = {
    validated: { label: "Valide", bg: "#D1FAE5", color: "#065F46", icon: CheckCircle2 },
    in_progress: { label: "En cours", bg: "#FEF3C7", color: "#92400E", icon: PlayCircle },
    submitted: { label: "Soumis", bg: "#EFF6FF", color: "#1D4ED8", icon: BookOpen },
    refused: { label: "Refuse", bg: "#FEE2E2", color: "#B91C1C", icon: Lock },
    not_started: { label: "Pas commence", bg: "#F3F4F6", color: "#6B7280", icon: Clock },
    locked: { label: "Verrouille", bg: "#F3F4F6", color: "#6B7280", icon: Lock },
  }[status];
  const Icon = map.icon;

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: map.bg, color: map.color, fontWeight: 800 }}>
      <Icon size={11} />
      {map.label}
    </span>
  );
}

function CourseCard({ project, index, liveTimer }: { project: LearningTrackItem; index: number; liveTimer: string }) {
  const isInProgress = project.status === "in_progress" || project.status === "submitted" || project.status === "refused";
  const isLocked = project.status === "locked";
  const favorite = isFavorite(`course:${project.id}`);

  return (
    <div
      className="rounded-2xl border bg-white p-4"
      style={{
        borderColor: project.status === "validated" ? "#86EFAC" : project.status === "refused" ? "#FCA5A5" : isInProgress ? "#93C5FD" : "#E5E7EB",
        opacity: isLocked ? 0.68 : 1,
        boxShadow: isInProgress ? "0 8px 24px rgba(37,99,235,0.10)" : "0 4px 14px rgba(15,23,42,0.035)",
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F8FAFC", color: "#334155", fontWeight: 900 }}>P{index + 1}</span>
            <StatusBadge status={project.status} />
          </div>
          <h3 className="text-base" style={{ color: isLocked ? "#94A3B8" : "#111827", fontWeight: 900 }}>{project.title}</h3>
        </div>
        <button
          onClick={() => toggleFavorite({ id: `course:${project.id}`, type: "course", label: project.title, href: project.href })}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: favorite ? "#FFF7ED" : "#F8FAFC", color: favorite ? "#F59E0B" : "#94A3B8", border: "1px solid #E5E7EB" }}
          title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star size={15} fill={favorite ? "#F59E0B" : "none"} />
        </button>
      </div>

      <p className={`text-sm ${isLocked ? "select-none blur-sm" : ""}`} style={{ color: "#64748B", lineHeight: 1.55 }}>{project.description}</p>

      {isInProgress && (
        <div className="mt-4 rounded-xl px-3 py-2" style={{ backgroundColor: "#0F172A" }}>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs" style={{ color: "#CBD5E1", fontWeight: 700 }}>
              <Timer size={12} />
              Temps ecoule
            </span>
            <span className="text-xs" style={{ color: "#F59E0B", fontFamily: "monospace", fontWeight: 900 }}>{liveTimer}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: "#F0F9FF", color: "#0369A1", fontWeight: 700 }}>{tag}</span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: "#64748B", fontWeight: 700 }}>{project.duration}</span>
        {isLocked ? (
          <span className="rounded-xl border border-dashed px-3 py-2 text-xs" style={{ color: "#94A3B8" }}>Prerequis</span>
        ) : (
          <Link to={project.href} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: isInProgress ? "#005EFA" : "#F8FAFC", color: isInProgress ? "#FFFFFF" : "#334155", border: isInProgress ? "none" : "1px solid #E5E7EB", fontWeight: 850 }}>
            {project.status === "validated" ? "Revoir" : "Ouvrir"} <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  useAcademyStore();
  useTenantStore();
  const learnerMetrics = getWorkspaceLearningMetrics();
  const liveTimer = useLiveTimer(9900);
  const [onboardingDismissed, setOnboardingDismissed] = useState(isLearnerOnboardingDismissed());
  const [activeView, setActiveView] = useState<"overview" | "path" | "submissions" | "courses">("overview");
  const currentTenant = getCurrentTenant();
  const currentWorkspace = getCurrentWorkspace();
  const currentUser = getCurrentUser();
  const workspaceRole = getCurrentWorkspaceRole(currentWorkspace?.id);
  const experienceRole = currentUser?.tenantRole === "product_owner" ? "product_owner" : workspaceRole ?? "learner";
  const learningPath = getWorkspaceLearningPath(currentWorkspace?.id);
  const activePathItem = learningPath.find((item) => item.status === "in_progress") ?? learningPath.find((item) => item.status === "not_started") ?? null;

  const learnerProjects: LearningTrackItem[] = learningPath.map((item) => {
    const progress = getCourseProgress(item.course.id);
    const unmet = item.prerequisites.filter((prerequisite) => !prerequisite.satisfied);
    const submissionHistory = getCourseSubmissionHistory(item.course.id);
    const latestSubmission = submissionHistory[0];
    const status: LearningTrackItem["status"] = item.isCompleted
      ? "validated"
      : item.isLocked
        ? "locked"
        : latestSubmission?.outcome === "refused"
          ? "refused"
          : latestSubmission?.outcome === "submitted"
            ? "submitted"
            : item.status === "in_progress"
              ? "in_progress"
              : "not_started";

    return {
      id: item.course.id,
      status,
      title: item.course.name,
      description: item.course.description,
      duration: item.course.duration,
      tags: item.course.tags,
      completedDate: item.isCompleted ? new Date(progress?.lastVisitedAt ?? item.course.publishedAt).toLocaleDateString("fr-FR") : undefined,
      completionTime: item.isCompleted ? `${Math.max(1, Math.round(item.course.estimatedMinutes / 60))}h valides` : undefined,
      progress: item.isCompleted ? 100 : item.progressPercent > 0 ? item.progressPercent : status === "in_progress" ? 5 : 0,
      requires: unmet[0] ? unmet[0].type === "course_completed" ? unmet[0].courseName : unmet[0].quizTitle ?? unmet[0].courseName : undefined,
      href: `/cours/${item.course.id}`,
    };
  });

  const currentResume = activePathItem ? learnerProjects.find((item) => item.id === activePathItem.course.id) : null;
  const recentSubmissions = learnerProjects
    .flatMap((project) => getCourseSubmissionHistory(project.id).slice(0, 2).map((submission) => ({ project, submission })))
    .sort((a, b) => new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime())
    .slice(0, 4);

  const tabs = [
    { id: "overview", label: "Apercu" },
    { id: "path", label: "Parcours" },
    { id: "submissions", label: "Soumissions" },
    { id: "courses", label: "Cours publies" },
  ] as const;

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-5 md:px-6">
      {!onboardingDismissed && (
        <div className="mb-4 rounded-2xl border bg-white p-4" style={{ borderColor: "#FED7AA", boxShadow: "0 8px 24px rgba(194,65,12,0.06)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase" style={{ color: "#C2410C", fontWeight: 850, letterSpacing: "0.12em" }}>Onboarding</p>
              <p className="mt-1 text-sm" style={{ color: "#475569" }}>
                Comprendre le cours, produire le livrable attendu, puis soumettre avec feedback IA + Python.
              </p>
            </div>
            <button
              onClick={() => {
                dismissLearnerOnboarding();
                setOnboardingDismissed(true);
              }}
              className="rounded-xl px-3 py-2 text-sm"
              style={{ backgroundColor: "#111827", color: "#FFFFFF", fontWeight: 800 }}
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      <div className="sticky top-[3.75rem] z-20 mb-4 rounded-2xl border bg-white/95 p-3 backdrop-blur" style={{ borderColor: "#E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase" style={{ color: "#1D4ED8", fontWeight: 850, letterSpacing: "0.12em" }}>
              {experienceRole === "product_owner" ? "Accueil PO" : experienceRole === "tutor" ? "Accueil tuteur" : "Accueil apprenant"}
            </p>
            <h1 className="mt-1 truncate text-xl" style={{ color: "#111827", fontWeight: 900 }}>
              {currentWorkspace?.name ?? "Votre espace"} / {LEARNER_TITLE}
            </h1>
            <p className="text-xs" style={{ color: "#64748B", fontWeight: 700 }}>{currentTenant.name}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            {[
              { value: `${learnerMetrics.completedCourses}/${learnerMetrics.totalCourses}`, label: "valides" },
              { value: `${learnerMetrics.progressPercent}%`, label: "progression" },
              { value: learnerMetrics.level, label: "niveau" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
                <p className="text-sm" style={{ color: "#111827", fontWeight: 900 }}>{item.value}</p>
                <p className="text-[11px]" style={{ color: "#64748B", fontWeight: 700 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className="shrink-0 rounded-xl px-3 py-2 text-sm"
              style={{
                backgroundColor: activeView === tab.id ? "#0F172A" : "#F8FAFC",
                color: activeView === tab.id ? "#FFFFFF" : "#475569",
                border: `1px solid ${activeView === tab.id ? "#0F172A" : "#E5E7EB"}`,
                fontWeight: 850,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeView === "overview" && (
        <>
          <LearnerExperienceLayer learningPath={learningPath} metrics={learnerMetrics} />

          <div className="mb-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
              <p className="text-xs uppercase" style={{ color: "#1D4ED8", fontWeight: 850, letterSpacing: "0.12em" }}>Reprise de session</p>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg" style={{ color: "#111827", fontWeight: 900 }}>{currentResume?.title ?? "Aucun cours actif"}</h2>
                  <p className="mt-2 max-w-2xl text-sm" style={{ color: "#64748B", lineHeight: 1.6 }}>
                    {currentResume?.description ?? "Votre prochaine reprise apparaitra ici des qu'un cours sera disponible."}
                  </p>
                </div>
                {currentResume && <StatusBadge status={currentResume.status} />}
              </div>
              {currentResume && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F8FAFC", color: "#334155", fontWeight: 800 }}>{currentResume.progress ?? 0}% complete</span>
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F8FAFC", color: "#334155", fontWeight: 800 }}>{currentResume.duration}</span>
                  <Link to={currentResume.href} className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 850 }}>
                    Reprendre <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
              <p className="text-xs uppercase" style={{ color: "#166534", fontWeight: 850, letterSpacing: "0.12em" }}>Jalons</p>
              <div className="mt-3 grid gap-2">
                {[
                  { label: "Premier cours valide", unlocked: learnerMetrics.completedCourses >= 1 },
                  { label: "Deux soumissions enregistrees", unlocked: recentSubmissions.length >= 2 },
                  { label: "Niveau intermediaire", unlocked: learnerMetrics.progressPercent >= 25 },
                ].map((badge) => (
                  <div key={badge.label} className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ backgroundColor: badge.unlocked ? "#F0FDF4" : "#F8FAFC", borderColor: badge.unlocked ? "#BBF7D0" : "#E5E7EB" }}>
                    <BadgeCheck size={15} color={badge.unlocked ? "#00A05A" : "#94A3B8"} />
                    <span className="text-sm" style={{ color: badge.unlocked ? "#166534" : "#64748B", fontWeight: 800 }}>{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === "path" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg" style={{ color: "#111827", fontWeight: 900 }}>Parcours pedagogique</h2>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Parcours rattache a {currentWorkspace?.name ?? "votre espace"} pour obtenir la {CERTIFICATION_TITLE.toLowerCase()}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "#64748B" }}>
              {[
                { color: "#00A05A", label: "Valide" },
                { color: "#005EFA", label: "En cours" },
                { color: "#EF4444", label: "Refuse" },
                { color: "#E5E7EB", label: "Verrouille" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {learnerProjects.map((project, index) => (
              <CourseCard key={project.id} project={project} index={index} liveTimer={liveTimer} />
            ))}
          </div>
        </div>
      )}

      {activeView === "submissions" && (
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg" style={{ color: "#111827", fontWeight: 900 }}>Historique personnel des soumissions</h2>
              <p className="text-sm" style={{ color: "#64748B" }}>Retrouvez les derniers retours de correction sans parcourir toute la page.</p>
            </div>
            <Link to="/soumissions" className="rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 850 }}>Tout voir</Link>
          </div>
          {recentSubmissions.length === 0 ? (
            <InlineFeedback title="Aucune soumission pour le moment" description="Votre historique apparaitra ici apres la premiere tentative de correction." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recentSubmissions.map(({ project, submission }) => (
                <div key={submission.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm" style={{ color: "#111827", fontWeight: 900 }}>{project.title}</p>
                    <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: submission.outcome === "validated" ? "#D1FAE5" : submission.outcome === "refused" ? "#FEE2E2" : "#EFF6FF", color: submission.outcome === "validated" ? "#166534" : submission.outcome === "refused" ? "#B91C1C" : "#1D4ED8", fontWeight: 800 }}>{submission.outcome}</span>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: "#64748B" }}>Tentative #{submission.attempt} / score {submission.score}/100</p>
                  <p className="mt-3 text-sm" style={{ color: "#374151", lineHeight: 1.6 }}>{submission.final.summary}</p>
                  <Link to={project.href} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 800 }}>Ouvrir le detail <ArrowRight size={13} /></Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === "courses" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg" style={{ color: "#111827", fontWeight: 900 }}>Cours publies</h2>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Les cours publies dans {currentWorkspace?.name ?? "cet espace"} avec leur progression sauvegardee.
              </p>
            </div>
            <Link to="/admin/catalogue-cours" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 850 }}>
              <BookOpen size={15} />
              Gerer le parcours
            </Link>
          </div>
          {learningPath.length === 0 ? (
            <InlineFeedback
              title="Aucun cours publie"
              description="Publiez un cours depuis l'admin pour l'afficher ici avec ses metadonnees, ses ressources et son mode d'acces."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {learningPath.map((item, index) => (
                <div key={item.course.id} className="rounded-2xl border bg-white p-4" style={{ borderColor: "#E5E7EB", boxShadow: "0 4px 14px rgba(15,23,42,0.035)" }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8", fontWeight: 900 }}>P{index + 1}</span>
                    <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#EEF2FF", color: "#4338CA", fontWeight: 800 }}>Publie</span>
                    <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F8FAFC", color: "#475569", fontWeight: 700 }}>{item.course.difficulty}</span>
                  </div>
                  <h3 className="mt-4 text-base" style={{ color: "#111827", fontWeight: 900 }}>{item.course.name}</h3>
                  <p className="mt-2 text-sm" style={{ color: "#64748B", lineHeight: 1.55 }}>{item.course.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border px-3 py-3" style={{ backgroundColor: "#F8FAFC", borderColor: "#E5E7EB" }}>
                    <div>
                      <p className="text-xs" style={{ color: "#64748B", fontWeight: 800 }}>Progression</p>
                      <p className="text-sm" style={{ color: "#111827", fontWeight: 900 }}>{item.progressPercent}%</p>
                    </div>
                    <Link to={`/cours/${item.course.id}`} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 850 }}>
                      {item.status === "completed" ? "Revoir" : "Reprendre"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
