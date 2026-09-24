import { AlertTriangle, ArrowRight, BookOpen, Brain, CheckCircle2, Gauge, Layers3, Users } from "lucide-react";
import { Link } from "react-router";
import { getAllCourseSubmissionHistory } from "../data/academyStore";
import type { PublishedCourse, WorkspaceLearningMetrics } from "../data/courseStore";
import type { Tenant, Workspace } from "../data/tenantStore";

type Props = {
  tenant: Tenant;
  workspace?: Workspace;
  courses: PublishedCourse[];
  metrics: WorkspaceLearningMetrics;
  learnerCount: number;
};

function getQualityScore(courses: PublishedCourse[]) {
  if (!courses.length) return 0;
  const scores = courses.map((course) => {
    let score = 45;
    if (course.blocks.length >= 4) score += 15;
    if (course.resourcesCount > 0) score += 10;
    if (course.rulesCount > 0) score += 10;
    if (course.outputColumnsCount > 0) score += 10;
    if (course.prerequisites.length > 0 || course.orderIndex > 0) score += 5;
    if (course.settings.aiAssisted) score += 5;
    return Math.min(100, score);
  });
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

export function AdminCompetitiveLayer({ tenant, workspace, courses, metrics, learnerCount }: Props) {
  const submissions = getAllCourseSubmissionHistory();
  const qualityScore = getQualityScore(courses);
  const riskScore = Math.max(0, 100 - metrics.lockedCourses * 12 - submissions.filter((item) => item.outcome === "refused").length * 8);
  const maturity = Math.round((qualityScore + metrics.progressPercent + riskScore) / 3);

  const segments = [
    { label: "Nouveaux arrivants", value: tenant.people.filter((person) => person.title.toLowerCase().includes("joiner")).length, color: "#1D4ED8" },
    { label: "Tuteurs", value: workspace?.assignments.filter((assignment) => assignment.role === "tutor").length ?? 0, color: "#7C3AED" },
    { label: "Apprenants", value: learnerCount, color: "#166534" },
    { label: "PO", value: tenant.people.filter((person) => person.tenantRole === "product_owner").length, color: "#C2410C" },
  ];

  const levers = [
    {
      title: "Quality score des cours",
      detail: qualityScore >= 80 ? "Le parcours est assez structure pour etre publie largement." : "Ajoute ressources, regles et output attendu sur les cours incomplets.",
      href: "/admin/catalogue-cours",
      score: qualityScore,
      icon: BookOpen,
    },
    {
      title: "Risque de blocage",
      detail: riskScore >= 75 ? "Le risque est contenu." : "Les cours verrouilles ou refuses doivent etre traites en priorite.",
      href: "/admin/soumissions-bloquees",
      score: riskScore,
      icon: AlertTriangle,
    },
    {
      title: "Maturite parcours",
      detail: maturity >= 75 ? "L'espace ressemble a un vrai programme pilote." : "Le parcours manque encore de structure, progression ou preuves de correction.",
      href: "/admin/parcours-tenant",
      score: maturity,
      icon: Gauge,
    },
  ];

  return (
    <section className="mb-5 grid items-start gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase" style={{ color: "#1D4ED8", fontWeight: 850, letterSpacing: "0.12em" }}>Academy Intelligence</p>
            <h2 className="mt-1 text-lg" style={{ color: "#111827", fontWeight: 850 }}>Cockpit de maturite LMS</h2>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Une couche de pilotage qui depasse le simple catalogue de cours.</p>
          </div>
          <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: maturity >= 75 ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${maturity >= 75 ? "#BBF7D0" : "#FED7AA"}` }}>
            <p className="text-2xl" style={{ color: maturity >= 75 ? "#166534" : "#C2410C", fontWeight: 900 }}>{maturity}</p>
            <p className="text-xs" style={{ color: "#64748B", fontWeight: 800 }}>score</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {levers.map((lever) => {
            const Icon = lever.icon;
            const isGood = lever.score >= 75;
            return (
              <Link key={lever.title} to={lever.href} className="rounded-xl border p-4 transition-colors hover:bg-slate-50" style={{ borderColor: "#E5E7EB" }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: isGood ? "#F0FDF4" : "#FFF7ED", color: isGood ? "#166534" : "#C2410C" }}>
                    <Icon size={17} />
                  </div>
                  <span className="text-sm" style={{ color: isGood ? "#166534" : "#C2410C", fontWeight: 900 }}>{lever.score}</span>
                </div>
                <p className="text-sm" style={{ color: "#111827", fontWeight: 850 }}>{lever.title}</p>
                <p className="mt-2 text-xs" style={{ color: "#64748B", lineHeight: 1.55 }}>{lever.detail}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase" style={{ color: "#166534", fontWeight: 850, letterSpacing: "0.12em" }}>Pilotage entreprise</p>
            <h2 className="mt-1 text-lg" style={{ color: "#111827", fontWeight: 850 }}>Segmentation et actions massives</h2>
          </div>
          <Brain size={18} color="#64748B" />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {segments.map((segment) => (
            <div key={segment.label} className="rounded-xl border p-4" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white" style={{ color: segment.color }}>
                {segment.label === "Tuteurs" ? <Users size={16} /> : segment.label === "PO" ? <CheckCircle2 size={16} /> : <Layers3 size={16} />}
              </div>
              <p className="text-xl" style={{ color: "#111827", fontWeight: 900 }}>{segment.value}</p>
              <p className="mt-1 text-xs" style={{ color: "#64748B", fontWeight: 800 }}>{segment.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: "Affecter une cohorte", href: "/admin/tenants" },
            { label: "Relancer les bloqueurs", href: "/admin/apprenants-a-risque" },
            { label: "Publier une version", href: "/admin/parcours-tenant" },
          ].map((item) => (
            <Link key={item.label} to={item.href} className="inline-flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm hover:bg-slate-50" style={{ borderColor: "#E5E7EB", color: "#334155", fontWeight: 850 }}>
              {item.label}
              <ArrowRight size={14} color="#94A3B8" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
