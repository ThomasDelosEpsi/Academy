import { ArrowRight, BadgeCheck, CalendarDays, Clock3, Star } from "lucide-react";
import { Link } from "react-router";
import { getAllCourseSubmissionHistory, getFavorites, useAcademyStore } from "../data/academyStore";
import { getWorkspaceLearningMetrics, getWorkspaceLearningPath } from "../data/courseStore";
import { getCurrentTenant, getCurrentWorkspace, useTenantStore } from "../data/tenantStore";
import { InlineFeedback } from "./FeedbackProvider";

export function MySpace() {
  useAcademyStore();
  useTenantStore();
  const tenant = getCurrentTenant();
  const workspace = getCurrentWorkspace();
  const metrics = getWorkspaceLearningMetrics(workspace?.id);
  const path = getWorkspaceLearningPath(workspace?.id);
  const submissions = getAllCourseSubmissionHistory().slice(0, 4);
  const favorites = getFavorites().slice(0, 4);
  const activeCourse = path.find((item) => item.status === "in_progress") ?? path.find((item) => !item.isLocked) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "#005EFA", fontWeight: 800 }}>Mon espace</p>
        <h1 className="mt-2" style={{ color: "#111827", fontWeight: 800, fontSize: "1.6rem" }}>Votre espace de travail Academy</h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>
          Reprise, cours assignés, soumissions récentes et jalons sont rassemblés ici dans une vue unique.
        </p>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] p-6" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0F2954 100%)" }}>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "#93C5FD", fontWeight: 800 }}>Reprise</p>
          <h2 className="mt-3" style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "1.35rem" }}>{activeCourse?.course.name ?? "Aucun cours actif"}</h2>
          <p className="mt-3 text-sm" style={{ color: "#BFDBFE", lineHeight: 1.7 }}>
            {activeCourse
              ? `${tenant.name} · ${workspace?.name ?? "Espace"} · progression ${activeCourse.progressPercent}%`
              : "Votre prochaine reprise apparaitra ici dès qu’un cours sera commencé ou déverrouillé."}
          </p>
          {activeCourse && (
            <Link to={`/cours/${activeCourse.course.id}`} className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFFFFF", color: "#0F2954", fontWeight: 800 }}>
              Continuer
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[
            { label: "Cours valides", value: metrics.completedCourses, icon: BadgeCheck, color: "#166534", bg: "#F0FDF4" },
            { label: "Progression", value: `${metrics.progressPercent}%`, icon: Clock3, color: "#1D4ED8", bg: "#EFF6FF" },
            { label: "Jalons", value: `${metrics.completedCourses}/${metrics.totalCourses}`, icon: Star, color: "#92400E", bg: "#FEF3C7" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: card.bg }}>
                  <Icon size={18} color={card.color} />
                </div>
                <p style={{ color: "#111827", fontWeight: 800, fontSize: "1.5rem" }}>{card.value}</p>
                <p className="mt-1 text-sm" style={{ color: "#6B7280", fontWeight: 600 }}>{card.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] p-5 lg:col-span-2" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
          <div className="flex items-center justify-between gap-3">
            <h2 style={{ color: "#111827", fontWeight: 800 }}>Mes cours assignés</h2>
            <Link to="/" className="text-sm" style={{ color: "#005EFA", fontWeight: 800 }}>Voir le parcours</Link>
          </div>
          <div className="mt-5 grid gap-3">
            {path.length === 0 ? (
              <InlineFeedback title="Aucun cours assigne" description="Le parcours publié apparaîtra ici dès qu’un cours sera ouvert dans votre espace." />
            ) : path.slice(0, 5).map((item, index) => (
              <Link key={item.course.id} to={`/cours/${item.course.id}`} className="flex flex-col gap-3 rounded-[22px] px-4 py-4 md:flex-row md:items-center md:justify-between" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                <div>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Cours {index + 1}</p>
                  <p className="mt-1" style={{ color: "#111827", fontWeight: 800 }}>{item.course.name}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: item.isCompleted ? "#DCFCE7" : item.isLocked ? "#F3F4F6" : "#DBEAFE", color: item.isCompleted ? "#166534" : item.isLocked ? "#6B7280" : "#1D4ED8", fontWeight: 800 }}>
                    {item.isCompleted ? "Valide" : item.isLocked ? "Verrouille" : item.status === "in_progress" ? "En cours" : "Pret"}
                  </span>
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#FFFFFF", color: "#475569", fontWeight: 700 }}>
                    {item.progressPercent}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
            <div className="flex items-center gap-2">
              <CalendarDays size={18} color="#1D4ED8" />
              <h2 style={{ color: "#111827", fontWeight: 800 }}>Mes soumissions</h2>
            </div>
            <div className="mt-4 space-y-3">
              {submissions.length === 0 ? (
                <InlineFeedback title="Aucune soumission" description="Vos dernières tentatives apparaîtront ici après la première validation." />
              ) : submissions.map((item) => (
                <Link key={item.id} to={`/cours/${item.courseId}`} className="block rounded-[20px] px-4 py-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p style={{ color: "#111827", fontWeight: 800 }}>{item.courseName}</p>
                  <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>Tentative #{item.attempt} · {item.outcome}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
            <div className="flex items-center gap-2">
              <Star size={18} color="#D97706" />
              <h2 style={{ color: "#111827", fontWeight: 800 }}>Favoris</h2>
            </div>
            {favorites.length === 0 ? (
              <div className="mt-4">
                <InlineFeedback title="Aucun favori" description="Ajoutez un cours à vos favoris pour le retrouver plus vite." />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {favorites.map((item) => (
                  <Link key={item.id} to={item.href} className="block rounded-[20px] px-4 py-4" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
                    <p style={{ color: "#111827", fontWeight: 800 }}>{item.label}</p>
                    <p className="mt-1 text-xs" style={{ color: "#9A3412" }}>{item.type}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
