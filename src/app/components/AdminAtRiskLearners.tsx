import { AlertTriangle, ArrowRight, Clock, Users } from "lucide-react";
import { Link } from "react-router";
import { getAllCourseSubmissionHistory } from "../data/academyStore";
import { getAllCourseProgress, getWorkspaceLearningPath } from "../data/courseStore";
import { getCurrentTenant, getCurrentWorkspace, getWorkspaceRoster, useTenantStore } from "../data/tenantStore";
import { InlineFeedback } from "./FeedbackProvider";

export function AdminAtRiskLearners() {
  useTenantStore();
  const tenant = getCurrentTenant();
  const workspace = getCurrentWorkspace();
  const roster = getWorkspaceRoster(tenant, workspace?.id ?? "").filter((item) => item.role === "learner" || item.role === "new_joiner");
  const allProgress = getAllCourseProgress();
  const allSubmissions = getAllCourseSubmissionHistory();

  const learners = roster.map((entry) => {
    const person = entry.person;
    const path = getWorkspaceLearningPath(workspace?.id, person?.id);
    const activeCourse = path.find((item) => item.status === "in_progress") ?? path.find((item) => item.status === "not_started") ?? null;
    const progressRows = allProgress.filter((item) => item.userId === person?.id && path.some((pathItem) => pathItem.course.id === item.courseId));
    const lastVisitedAt = progressRows.sort((a, b) => new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime())[0]?.lastVisitedAt ?? null;
    const submissions = allSubmissions.filter((item) => item.userId === person?.id && item.workspaceId === workspace?.id);
    const refused = submissions.filter((item) => item.outcome === "refused").length;
    const submitted = submissions.length;
    const progressPercent = activeCourse?.progressPercent ?? 0;
    const riskScore = Math.min(100,
      (progressPercent === 0 ? 35 : progressPercent < 30 ? 20 : 0)
      + refused * 25
      + (submitted === 0 ? 20 : 0)
      + (!lastVisitedAt ? 15 : 0),
    );
    const reasons = [
      progressPercent === 0 ? "Aucune progression visible" : progressPercent < 30 ? "Progression encore faible" : null,
      refused > 0 ? `${refused} soumission(s) refusee(s)` : null,
      submitted === 0 ? "Aucune tentative soumise" : null,
      !lastVisitedAt ? "Pas d'activite recente" : null,
    ].filter(Boolean) as string[];

    return {
      id: person?.id ?? entry.personId,
      name: person?.name ?? entry.personId,
      title: person?.title ?? "Apprenant",
      activeCourse: activeCourse?.course.name ?? "Aucun cours actif",
      progressPercent,
      refused,
      submitted,
      riskScore,
      reasons,
      lastVisitedAt,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10 xl:py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.45rem" }}>Apprenants a risque</h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>Vue dediee aux apprenants a suivre en priorite dans {workspace?.name ?? "cet espace"}.</p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", fontWeight: 800 }}>
          {learners.filter((item) => item.riskScore >= 40).length} a surveiller
        </span>
      </div>

      {learners.length === 0 ? (
        <InlineFeedback title="Aucun apprenant affecte a cet espace" description="Assigne des apprenants a l'espace ou publie un parcours pour activer le suivi de risque." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {learners.map((learner) => (
            <div key={learner.id} className="rounded-[26px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Users size={16} color="#005EFA" />
                    <p style={{ color: "#111827", fontWeight: 800 }}>{learner.name}</p>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>{learner.title}</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: learner.riskScore >= 60 ? "#FEE2E2" : "#FFF7ED", color: learner.riskScore >= 60 ? "#B91C1C" : "#9A3412", fontWeight: 800 }}>
                  Risque {learner.riskScore}/100
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Cours actif</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{learner.activeCourse}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Progression</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{learner.progressPercent}%</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Soumissions refusees</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{learner.refused}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} color="#DC2626" />
                  <p className="text-sm" style={{ color: "#B91C1C", fontWeight: 800 }}>Points de vigilance</p>
                </div>
                <div className="mt-3 space-y-2">
                  {learner.reasons.map((reason) => <p key={reason} className="text-sm" style={{ color: "#991B1B", fontWeight: 700 }}>{reason}</p>)}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>
                  <Clock size={13} />
                  {learner.lastVisitedAt ? `Derniere activite ${new Date(learner.lastVisitedAt).toLocaleDateString("fr-FR")}` : "Aucune activite detectee"}
                </div>
                <Link to={`/admin/apprenant/${learner.id}`} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                  Ouvrir la fiche <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
