import { Clock3, MessageSquare, Sparkles, Star } from "lucide-react";
import { Link } from "react-router";
import { getFavorites, getLearnerActivity, useAcademyStore } from "../data/academyStore";
import { InlineFeedback } from "./FeedbackProvider";

export function ActivityCenter() {
  useAcademyStore();
  const activity = getLearnerActivity(20);
  const favorites = getFavorites();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "#005EFA", fontWeight: 800 }}>Activite</p>
          <h1 className="mt-2" style={{ color: "#111827", fontWeight: 800, fontSize: "1.6rem" }}>Centre d’activité</h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>
            Une vue simple de ce qui s’est passé récemment : soumissions, validations, relances, mentoring et accès rapides.
          </p>
        </div>
        <Link to="/notifications" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#F8FAFC", color: "#334155", fontWeight: 700, border: "1px solid #E5E7EB" }}>
          <MessageSquare size={15} />
          Voir les notifications
        </Link>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 12px 28px rgba(15,23,42,0.05)" }}>
          <div className="flex items-center gap-2">
            <Clock3 size={18} color="#1D4ED8" />
            <h2 style={{ color: "#111827", fontWeight: 800 }}>Dernieres actions utiles</h2>
          </div>
          {activity.length === 0 ? (
            <div className="mt-4">
              <InlineFeedback title="Aucune activité récente" description="Les validations, relances et événements du parcours apparaîtront ici automatiquement." />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {activity.map((item) => (
                <Link key={item.id} to={item.href ?? "/"} className="flex items-start gap-3 rounded-[22px] px-4 py-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.kind === "submission" ? "#005EFA" : item.kind === "mentoring" ? "#D97706" : item.kind === "admin" ? "#7C3AED" : "#00A05A" }} />
                  <div className="min-w-0">
                    <p style={{ color: "#111827", fontWeight: 800 }}>{item.title}</p>
                    <p className="mt-1 text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>{item.detail}</p>
                    <p className="mt-2 text-xs" style={{ color: "#9CA3AF" }}>{new Date(item.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 12px 28px rgba(15,23,42,0.05)" }}>
            <div className="flex items-center gap-2">
              <Star size={18} color="#D97706" />
              <h2 style={{ color: "#111827", fontWeight: 800 }}>Favoris</h2>
            </div>
            {favorites.length === 0 ? (
              <div className="mt-4">
                <InlineFeedback title="Aucun favori" description="Ajoute un cours ou un parcours à tes favoris pour le retrouver plus vite." />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {favorites.slice(0, 6).map((item) => (
                  <Link key={item.id} to={item.href} className="flex items-start gap-3 rounded-[22px] px-4 py-4" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
                    <Star size={15} color="#D97706" className="mt-0.5 shrink-0" />
                    <div>
                      <p style={{ color: "#111827", fontWeight: 800 }}>{item.label}</p>
                      <p className="mt-1 text-xs" style={{ color: "#9A3412" }}>{item.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 12px 28px rgba(15,23,42,0.05)" }}>
            <div className="flex items-center gap-2">
              <Sparkles size={18} color="#00A05A" />
              <h2 style={{ color: "#111827", fontWeight: 800 }}>Actions rapides</h2>
            </div>
            <div className="mt-5 grid gap-3">
              <Link to="/mon-espace" className="rounded-[22px] px-4 py-4 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 800 }}>Ouvrir mon espace</Link>
              <Link to="/soumissions" className="rounded-[22px] px-4 py-4 text-sm" style={{ backgroundColor: "#F0FDF4", color: "#166534", fontWeight: 800 }}>Revoir mes soumissions</Link>
              <Link to="/mon-planning" className="rounded-[22px] px-4 py-4 text-sm" style={{ backgroundColor: "#FEF3C7", color: "#92400E", fontWeight: 800 }}>Voir mon planning</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
