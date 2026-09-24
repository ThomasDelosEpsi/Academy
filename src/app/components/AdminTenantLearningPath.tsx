import { AlertTriangle, BookOpen, CheckCircle2, Layers3, ListOrdered, Users } from "lucide-react";
import { Link } from "react-router";
import { getAllCourseSubmissionHistory, useAcademyStore } from "../data/academyStore";
import { getAllCourseProgress, getCourseAccessRules, getPublishedCourses } from "../data/courseStore";
import { getCurrentTenant, useTenantStore, type TenantPerson, type Workspace } from "../data/tenantStore";
import { InlineFeedback } from "./FeedbackProvider";

function getWorkspaceLearners(workspace: Workspace, people: TenantPerson[]) {
  return workspace.assignments
    .filter((assignment) => assignment.role === "learner" || assignment.role === "new_joiner")
    .map((assignment) => people.find((person) => person.id === assignment.personId))
    .filter(Boolean) as TenantPerson[];
}

function learnerMatchesGroup(person: TenantPerson, groupId: string) {
  const [dimension, rawValue] = groupId.split(":");
  if (!dimension || !rawValue) return false;
  const normalized = rawValue.toLowerCase();
  const candidate = dimension === "jobFamily"
    ? person.jobFamily
    : dimension === "team"
      ? person.team
      : dimension === "country"
        ? person.country
        : person.cohort;
  return (candidate ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-") === normalized;
}

function getAssignedLearnerCount(workspace: Workspace, people: TenantPerson[], courseId: string, accessMode: "all" | "specific" | "groups") {
  const learners = getWorkspaceLearners(workspace, people);
  const rule = getCourseAccessRules().find((item) => item.courseId === courseId);

  if (accessMode === "all" || !rule) return learners.length;
  if (accessMode === "specific") return learners.filter((person) => rule.studentIds.includes(person.id)).length;
  return learners.filter((person) => rule.groupIds.some((groupId) => learnerMatchesGroup(person, groupId))).length;
}

export function AdminTenantLearningPath() {
  useTenantStore();
  useAcademyStore();
  const tenant = getCurrentTenant();
  const publishedCourses = getPublishedCourses().filter((course) => course.tenantId === tenant.id);
  const courseProgress = getAllCourseProgress();
  const submissionHistory = getAllCourseSubmissionHistory();

  const workspaceSummaries = tenant.workspaces.map((workspace) => {
    const workspaceCourses = publishedCourses
      .filter((course) => course.workspaceId === workspace.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const learners = getWorkspaceLearners(workspace, tenant.people);

    const courseRows = workspaceCourses.map((course) => {
      const attempts = submissionHistory.filter((item) => item.courseId === course.id);
      const failures = attempts.filter((item) => item.outcome === "refused").length;
      const progressRows = courseProgress.filter((item) => item.courseId === course.id);
      const averageProgress = progressRows.length
        ? Math.round(progressRows.reduce((total, item) => total + item.progressPercent, 0) / progressRows.length)
        : 0;
      const assignedLearners = getAssignedLearnerCount(workspace, tenant.people, course.id, course.accessMode);

      return {
        course,
        attempts: attempts.length,
        failures,
        averageProgress,
        assignedLearners,
      };
    });

    return {
      workspace,
      learners,
      courseRows,
    };
  });

  const totalLearners = workspaceSummaries.reduce((total, item) => total + item.learners.length, 0);
  const difficultCourses = workspaceSummaries
    .flatMap((item) => item.courseRows.map((row) => ({ ...row, workspaceName: item.workspace.name })))
    .sort((a, b) => b.failures - a.failures || a.averageProgress - b.averageProgress)
    .slice(0, 5);

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.45rem" }}>Parcours du tenant</h1>
          <p className="mt-2 max-w-3xl text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>
            Cette vue clarifie la difference entre le catalogue admin, le parcours publie par espace, les cours effectivement assignes et les cours en difficulte.
          </p>
        </div>
        <Link
          to="/admin/catalogue-cours"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}
        >
          <ListOrdered size={15} />
          Ouvrir le catalogue
        </Link>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-4">
        {[
          { label: "Espaces actifs", value: tenant.workspaces.length, icon: Layers3, tone: ["#EFF6FF", "#1D4ED8"] as const },
          { label: "Cours publies", value: publishedCourses.length, icon: BookOpen, tone: ["#F0FDF4", "#166534"] as const },
          { label: "Apprenants affectes", value: totalLearners, icon: Users, tone: ["#FEF3C7", "#92400E"] as const },
          { label: "Cours en difficulte", value: difficultCourses.filter((item) => item.failures > 0).length, icon: AlertTriangle, tone: ["#FEF2F2", "#B91C1C"] as const },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: card.tone[0] }}>
                <Icon size={20} color={card.tone[1]} />
              </div>
              <p style={{ color: "#111827", fontWeight: 800, fontSize: "1.6rem" }}>{card.value}</p>
              <p className="mt-1 text-sm" style={{ color: "#6B7280", fontWeight: 600 }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid gap-4 xl:grid-cols-4">
        {[
          {
            title: "Catalogue admin",
            description: "Vue de gestion globale avec filtres, edition, suppression, import/export et ordre P1/P2/P3.",
            tone: "#EFF6FF",
            color: "#1D4ED8",
          },
          {
            title: "Parcours publie",
            description: "Ordre officiel des cours visibles dans un espace, avec prerequis et sequence de progression.",
            tone: "#F0FDF4",
            color: "#166534",
          },
          {
            title: "Cours assignes",
            description: "Cours reellement ouverts a un public selon l'espace, la cible nominative ou les groupes.",
            tone: "#FEF3C7",
            color: "#92400E",
          },
          {
            title: "Cours en difficulte",
            description: "Cours avec echec frequent, progression faible ou volume de tentatives eleve.",
            tone: "#FEF2F2",
            color: "#B91C1C",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-[24px] p-5" style={{ backgroundColor: item.tone, border: "1px solid rgba(15,23,42,0.08)" }}>
            <p style={{ color: item.color, fontWeight: 800 }}>{item.title}</p>
            <p className="mt-2 text-sm" style={{ color: "#475569", lineHeight: 1.65 }}>{item.description}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {workspaceSummaries.map(({ workspace, learners, courseRows }) => (
          <section key={workspace.id} className="rounded-[28px] p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.1rem" }}>{workspace.name}</h2>
                <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
                  {workspace.domain} · {learners.length} apprenant(s) affecte(s)
                </p>
              </div>
              <Link
                to={`/admin/catalogue-cours`}
                className="rounded-xl px-4 py-2.5 text-sm"
                style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}
              >
                Gerer cet espace
              </Link>
            </div>

            {courseRows.length === 0 ? (
              <InlineFeedback
                title={`Aucun cours publie dans ${workspace.name}`}
                description="Publie un premier cours pour structurer le parcours et ouvrir la progression apprenant."
              />
            ) : (
              <div className="space-y-4">
                {courseRows.map(({ course, attempts, failures, averageProgress, assignedLearners }) => (
                  <div key={course.id} className="rounded-[22px] p-5" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8", fontWeight: 800 }}>
                            P{course.orderIndex + 1}
                          </span>
                          <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#475569", fontWeight: 700 }}>
                            {course.templateType.toUpperCase()}
                          </span>
                          <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: course.accessMode === "all" ? "#DCFCE7" : course.accessMode === "groups" ? "#FEF3C7" : "#FEE2E2", color: course.accessMode === "all" ? "#166534" : course.accessMode === "groups" ? "#92400E" : "#B91C1C", fontWeight: 800 }}>
                            {course.accessMode === "all" ? "Ouvert a l'espace" : course.accessMode === "groups" ? "Ouvert par groupes" : "Cible nominative"}
                          </span>
                          {course.prerequisites.length > 0 && (
                            <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EEF2FF", color: "#4338CA", fontWeight: 700 }}>
                              {course.prerequisites.length} prerequis
                            </span>
                          )}
                        </div>

                        <h3 style={{ color: "#111827", fontWeight: 800, fontSize: "1rem" }}>{course.name}</h3>
                        <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>{course.description}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-4 lg:w-[420px]">
                        <div className="rounded-2xl p-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                          <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Assignes</p>
                          <p style={{ color: "#111827", fontWeight: 800 }}>{assignedLearners}</p>
                        </div>
                        <div className="rounded-2xl p-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                          <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Tentatives</p>
                          <p style={{ color: "#111827", fontWeight: 800 }}>{attempts}</p>
                        </div>
                        <div className="rounded-2xl p-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                          <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Echecs</p>
                          <p style={{ color: failures > 0 ? "#B91C1C" : "#111827", fontWeight: 800 }}>{failures}</p>
                        </div>
                        <div className="rounded-2xl p-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                          <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Progression moy.</p>
                          <p style={{ color: "#111827", fontWeight: 800 }}>{averageProgress}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-[28px] p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} color="#16A34A" />
          <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1rem" }}>Priorites de pilotage</h2>
        </div>
        {difficultCourses.length === 0 ? (
          <InlineFeedback title="Aucun point de vigilance detecte" description="Les cours en difficulte apparaitront ici a partir des tentatives et de la progression observee." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {difficultCourses.map(({ course, failures, attempts, averageProgress, workspaceName }) => (
              <div key={course.id} className="rounded-[22px] p-5" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#9A3412", fontWeight: 800 }}>{workspaceName}</p>
                <p className="mt-2" style={{ color: "#111827", fontWeight: 800 }}>{course.name}</p>
                <p className="mt-3 text-sm" style={{ color: "#9A3412", lineHeight: 1.65 }}>
                  {failures > 0 ? `${failures} echec(s) constates sur ${attempts} tentative(s).` : "Progression faible detectee sans refus explicite pour l'instant."}
                </p>
                <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>Progression moyenne observee : {averageProgress}%</p>
                <Link to={`/admin/nouveau-cours?course=${course.id}`} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#FFFFFF", color: "#C2410C", fontWeight: 700 }}>
                  Ajuster ce cours
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
