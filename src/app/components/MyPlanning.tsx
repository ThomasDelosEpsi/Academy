import { CalendarClock, Clock3, ListChecks } from "lucide-react";
import { Link } from "react-router";
import { useAcademyStore } from "../data/academyStore";
import { getWorkspaceLearningPath } from "../data/courseStore";
import { getCurrentWorkspace, useTenantStore } from "../data/tenantStore";
import { InlineFeedback } from "./FeedbackProvider";

export function MyPlanning() {
  useAcademyStore();
  useTenantStore();
  const workspace = getCurrentWorkspace();
  const path = getWorkspaceLearningPath(workspace?.id);

  const planningItems = path.slice(0, 6).map((item, index) => ({
    id: item.course.id,
    label: item.course.name,
    dueLabel: `Semaine ${index + 1}`,
    detail: item.isLocked ? "Prerequis non atteints" : item.isCompleted ? "Cours termine" : `Prevoir ${item.course.duration}`,
    href: `/cours/${item.course.id}`,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "#005EFA", fontWeight: 800 }}>Planning</p>
        <h1 className="mt-2" style={{ color: "#111827", fontWeight: 800, fontSize: "1.6rem" }}>Mon planning</h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>
          Une vue simple des prochaines étapes du parcours, des temps estimés et des priorités du moment.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Etapes a venir", value: planningItems.filter((item) => item.detail !== "Cours termine").length, icon: CalendarClock, color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "Temps estime", value: `${planningItems.length * 2}h`, icon: Clock3, color: "#92400E", bg: "#FEF3C7" },
          { label: "Actions immediates", value: Math.max(1, planningItems.filter((item) => item.detail !== "Cours termine").length), icon: ListChecks, color: "#166534", bg: "#F0FDF4" },
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

      {planningItems.length === 0 ? (
        <InlineFeedback title="Aucun planning disponible" description="Le planning apparaîtra ici dès qu’un parcours sera publié dans votre espace." />
      ) : (
        <div className="space-y-4">
          {planningItems.map((item) => (
            <Link key={item.id} to={item.href} className="flex flex-col gap-3 rounded-[24px] px-5 py-5 md:flex-row md:items-center md:justify-between" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
              <div>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#6B7280", fontWeight: 800 }}>{item.dueLabel}</p>
                <p className="mt-2" style={{ color: "#111827", fontWeight: 800 }}>{item.label}</p>
                <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>{item.detail}</p>
              </div>
              <div className="rounded-full px-4 py-2 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 800 }}>
                Ouvrir
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
