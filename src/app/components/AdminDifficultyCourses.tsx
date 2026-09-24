import { AlertTriangle, ArrowRight, BarChart3, Gauge, Layers3 } from "lucide-react";
import { Link } from "react-router";
import { getAllCourseSubmissionHistory } from "../data/academyStore";
import { getAllCourseProgress, getPublishedCoursesForWorkspace } from "../data/courseStore";
import { getCurrentWorkspace, useTenantStore } from "../data/tenantStore";
import { InlineFeedback } from "./FeedbackProvider";

export function AdminDifficultyCourses() {
  useTenantStore();
  const workspace = getCurrentWorkspace();
  const courses = getPublishedCoursesForWorkspace(workspace?.id);
  const allProgress = getAllCourseProgress();
  const allSubmissions = getAllCourseSubmissionHistory();

  const insights = courses.map((course) => {
    const attempts = allSubmissions.filter((item) => item.courseId === course.id);
    const failures = attempts.filter((item) => item.outcome === "refused").length;
    const avgScore = attempts.length ? Math.round(attempts.reduce((total, item) => total + item.score, 0) / attempts.length) : 0;
    const progressRows = allProgress.filter((item) => item.courseId === course.id);
    const avgProgress = progressRows.length ? Math.round(progressRows.reduce((total, item) => total + item.progressPercent, 0) / progressRows.length) : 0;
    const difficultyScore = Math.min(100, failures * 25 + Math.max(0, 40 - avgProgress) + (attempts.length === 0 ? 15 : 0));
    return { course, attempts: attempts.length, failures, avgScore, avgProgress, difficultyScore };
  }).sort((a, b) => b.difficultyScore - a.difficultyScore);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10 xl:py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.45rem" }}>Cours en difficulte</h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>Vue dediee aux cours qui concentrent les blocages, les faibles scores ou une progression moyenne trop basse.</p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#FFF7ED", color: "#9A3412", fontWeight: 800 }}>
          {insights.length} cours analyses
        </span>
      </div>

      {!insights.length ? (
        <InlineFeedback title="Aucun cours publie dans cet espace" description="Publie un premier cours pour suivre ses difficultes et sa progression moyenne." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {insights.map(({ course, attempts, failures, avgScore, avgProgress, difficultyScore }) => (
            <div key={course.id} className="rounded-[26px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers3 size={16} color="#005EFA" />
                    <p style={{ color: "#111827", fontWeight: 800 }}>{course.name}</p>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>{course.workspaceName} · {course.duration}</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: difficultyScore >= 60 ? "#FEE2E2" : "#FFF7ED", color: difficultyScore >= 60 ? "#B91C1C" : "#9A3412", fontWeight: 800 }}>
                  Difficulté {difficultyScore}/100
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Tentatives</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{attempts}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Echecs</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{failures}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Score moyen</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{avgScore || "-"}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Progression moyenne</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{avgProgress}%</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} color="#DC2626" />
                    <p className="text-sm" style={{ color: "#B91C1C", fontWeight: 800 }}>Signal principal</p>
                  </div>
                  <p className="mt-3 text-sm" style={{ color: "#991B1B", fontWeight: 700 }}>
                    {failures > 0 ? `${failures} refus ont ete detectes sur ce cours.` : avgProgress < 40 ? "La progression moyenne reste trop basse." : "Peu de tentatives ont encore ete observees."}
                  </p>
                </div>
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <div className="flex items-center gap-2">
                    <Gauge size={15} color="#1D4ED8" />
                    <p className="text-sm" style={{ color: "#1D4ED8", fontWeight: 800 }}>Action suggeree</p>
                  </div>
                  <p className="mt-3 text-sm" style={{ color: "#1E3A8A", fontWeight: 700 }}>
                    Revoir les regles, les ressources et le schema de sortie avant republication.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/admin/nouveau-cours?course=${course.id}`} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                  Ajuster le cours <ArrowRight size={14} />
                </Link>
                <Link to={`/cours/${course.id}`} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
                  Ouvrir le detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
