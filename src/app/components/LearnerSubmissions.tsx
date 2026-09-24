import { ArrowRight, BadgeCheck, BookOpen, Clock3, FileWarning, ShieldAlert } from "lucide-react";
import { Link } from "react-router";
import { getAllCourseSubmissionHistory, useAcademyStore } from "../data/academyStore";
import { getPublishedCoursesForWorkspace } from "../data/courseStore";
import { getCurrentWorkspace, useTenantStore } from "../data/tenantStore";
import { InlineFeedback } from "./FeedbackProvider";

export function LearnerSubmissions() {
  useAcademyStore();
  useTenantStore();
  const currentWorkspace = getCurrentWorkspace();
  const history = getAllCourseSubmissionHistory()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const currentCourses = getPublishedCoursesForWorkspace(currentWorkspace?.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "#005EFA", fontWeight: 800 }}>Soumissions</p>
          <h1 className="mt-2" style={{ color: "#111827", fontWeight: 800, fontSize: "1.6rem" }}>Mes soumissions</h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>
            Retrouve ici l’historique de tes tentatives, les verdicts de correction et ce qu’il te manque encore pour valider.
          </p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
          <BookOpen size={15} />
          Retour au parcours
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Tentatives", value: history.length, icon: Clock3, color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "Validees", value: history.filter((item) => item.outcome === "validated").length, icon: BadgeCheck, color: "#166534", bg: "#F0FDF4" },
          { label: "A retravailler", value: history.filter((item) => item.outcome === "refused").length, icon: FileWarning, color: "#B91C1C", bg: "#FEF2F2" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: item.bg }}>
                <Icon size={18} color={item.color} />
              </div>
              <p style={{ color: "#111827", fontWeight: 800, fontSize: "1.6rem" }}>{item.value}</p>
              <p className="mt-1 text-sm" style={{ color: "#6B7280", fontWeight: 600 }}>{item.label}</p>
            </div>
          );
        })}
      </div>

      {history.length === 0 ? (
        <InlineFeedback title="Aucune soumission enregistree" description="Ta premiere tentative apparaitra ici avec le resume IA, Python et la synthese finale." />
      ) : (
        <div className="space-y-4">
          {history.map((submission) => (
            <div key={submission.id} className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: submission.outcome === "validated" ? "#DCFCE7" : submission.outcome === "refused" ? "#FEE2E2" : "#DBEAFE", color: submission.outcome === "validated" ? "#166534" : submission.outcome === "refused" ? "#B91C1C" : "#1D4ED8", fontWeight: 800 }}>
                      {submission.outcome === "validated" ? "Valide" : submission.outcome === "refused" ? "Refuse" : "Soumis"}
                    </span>
                    <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#475569", fontWeight: 700 }}>
                      Tentative #{submission.attempt}
                    </span>
                    <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F8FAFC", color: "#6B7280", fontWeight: 700 }}>
                      {new Date(submission.submittedAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.05rem" }}>{submission.courseName}</h2>
                  <p className="mt-3 text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>{submission.final.summary}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                      <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Verdict IA</p>
                      <p className="mt-1" style={{ color: "#111827", fontWeight: 800 }}>{submission.ai.score}/100</p>
                      <p className="mt-2 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{submission.ai.summary}</p>
                    </div>
                    <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                      <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Verdict Python</p>
                      <p className="mt-1" style={{ color: "#111827", fontWeight: 800 }}>{submission.python.score}/100</p>
                      <p className="mt-2 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{submission.python.summary}</p>
                    </div>
                    <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                      <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Synthese finale</p>
                      <p className="mt-1" style={{ color: "#111827", fontWeight: 800 }}>{submission.final.score}/100</p>
                      <p className="mt-2 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{submission.fileName || "Aucun fichier joint"}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-[300px]">
                  <div className="rounded-[22px] p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                    <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#6B7280", fontWeight: 800 }}>Ce qu’il manque</p>
                    <div className="mt-3 space-y-2">
                      {(submission.outcome === "validated"
                        ? ["Votre rendu est conforme et archive dans l’historique."]
                        : submission.final.findings.length
                          ? submission.final.findings
                          : ["Completer la soumission et relancer la validation."])
                        .slice(0, 4)
                        .map((finding) => (
                          <div key={finding} className="flex items-start gap-2 rounded-2xl px-3 py-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                            <ShieldAlert size={14} color={submission.outcome === "validated" ? "#16A34A" : "#C2410C"} className="mt-0.5 shrink-0" />
                            <p className="text-xs" style={{ color: "#475569", lineHeight: 1.6 }}>{finding}</p>
                          </div>
                        ))}
                    </div>
                    <Link to={`/cours/${submission.courseId}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
                      Ouvrir le cours
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentCourses.length > 0 && (
        <div className="mt-8 rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
          <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Prochaine action</p>
          <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>
            Reprends un cours en cours ou relance une tentative refusee depuis ton parcours. Chaque nouvelle tentative sera comparee ici automatiquement.
          </p>
        </div>
      )}
    </div>
  );
}
