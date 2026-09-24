import { ArrowRight, BadgeCheck, BarChart3, Brain, CheckCircle2, FileWarning, Gauge, Target } from "lucide-react";
import { Link } from "react-router";
import { getAllCourseSubmissionHistory } from "../data/academyStore";
import type { LearningPathItem, WorkspaceLearningMetrics } from "../data/courseStore";

type Props = {
  learningPath: LearningPathItem[];
  metrics: WorkspaceLearningMetrics;
};

const SKILLS = [
  { label: "Contexte metier", value: 82, target: 90 },
  { label: "Qualite livrable", value: 74, target: 85 },
  { label: "Autonomie", value: 68, target: 80 },
  { label: "Conformite", value: 88, target: 90 },
];

function getNextAction(learningPath: LearningPathItem[]) {
  const refusedSubmission = getAllCourseSubmissionHistory().find((submission) => submission.outcome === "refused");
  if (refusedSubmission) {
    return {
      title: "Corriger la derniere soumission",
      detail: refusedSubmission.final.findings[0] ?? "Une tentative refusee demande une reprise ciblee.",
      href: `/cours/${refusedSubmission.courseId}`,
      tone: "#B91C1C",
    };
  }

  const active = learningPath.find((item) => item.status === "in_progress") ?? learningPath.find((item) => item.status === "not_started");
  if (active) {
    return {
      title: `Reprendre ${active.positionLabel}`,
      detail: active.course.name,
      href: `/cours/${active.course.id}`,
      tone: "#1D4ED8",
    };
  }

  return {
    title: "Consulter la certification",
    detail: "Le parcours est termine ou aucun cours n'est disponible.",
    href: "/soumissions",
    tone: "#166534",
  };
}

export function LearnerExperienceLayer({ learningPath, metrics }: Props) {
  const nextAction = getNextAction(learningPath);
  const submissions = getAllCourseSubmissionHistory();
  const refusedCount = submissions.filter((submission) => submission.outcome === "refused").length;
  const validatedCount = submissions.filter((submission) => submission.outcome === "validated").length;
  const unlockedCount = learningPath.filter((item) => !item.isLocked).length;

  return (
    <section className="mb-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase" style={{ color: "#1D4ED8", fontWeight: 850, letterSpacing: "0.12em" }}>Learning OS</p>
            <h2 className="mt-1 text-lg" style={{ color: "#111827", fontWeight: 850 }}>Votre copilote de progression</h2>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Priorites, competences et risques de validation regroupes au meme endroit.</p>
          </div>
          <Link to={nextAction.href} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: nextAction.tone, color: "#FFFFFF", fontWeight: 850 }}>
            {nextAction.title}
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            { label: "Progression", value: `${metrics.progressPercent}%`, icon: Gauge, tone: "#1D4ED8", bg: "#EFF6FF" },
            { label: "Cours ouverts", value: `${unlockedCount}/${metrics.totalCourses}`, icon: CheckCircle2, tone: "#166534", bg: "#F0FDF4" },
            { label: "Validations", value: String(validatedCount), icon: BadgeCheck, tone: "#047857", bg: "#ECFDF5" },
            { label: "A reprendre", value: String(refusedCount), icon: FileWarning, tone: "#B91C1C", bg: "#FEF2F2" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-xl border p-4" style={{ borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: item.bg, color: item.tone }}>
                  <Icon size={17} />
                </div>
                <p className="text-xl" style={{ color: "#111827", fontWeight: 850 }}>{item.value}</p>
                <p className="mt-1 text-xs" style={{ color: "#64748B", fontWeight: 800 }}>{item.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
          <div className="mb-3 flex items-center gap-2">
            <Brain size={16} color="#1D4ED8" />
            <p className="text-sm" style={{ color: "#111827", fontWeight: 850 }}>Recommendation intelligente</p>
          </div>
          <p className="text-sm" style={{ color: "#475569", lineHeight: 1.65 }}>{nextAction.detail}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase" style={{ color: "#166534", fontWeight: 850, letterSpacing: "0.12em" }}>Passeport competences</p>
            <h2 className="mt-1 text-lg" style={{ color: "#111827", fontWeight: 850 }}>Niveau operationnel</h2>
          </div>
          <BarChart3 size={18} color="#64748B" />
        </div>

        <div className="space-y-4">
          {SKILLS.map((skill) => (
            <div key={skill.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span style={{ color: "#334155", fontWeight: 850 }}>{skill.label}</span>
                <span style={{ color: skill.value >= skill.target ? "#166534" : "#C2410C", fontWeight: 850 }}>{skill.value}/{skill.target}</span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
                <div className="h-2 rounded-full" style={{ width: `${skill.value}%`, backgroundColor: skill.value >= skill.target ? "#16A34A" : "#F59E0B" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link to="/soumissions" className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 850 }}>
            Soumissions
          </Link>
          <Link to="/mon-planning" className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: "#F0FDF4", color: "#166534", fontWeight: 850 }}>
            <Target size={14} />
            Planning
          </Link>
        </div>
      </div>
    </section>
  );
}
