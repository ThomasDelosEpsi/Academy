import { AlertTriangle, ArrowRight, Clock, FileText, PlusCircle } from "lucide-react";
import { Link } from "react-router";
import { getDrafts } from "../data/courseStore";
import { InlineFeedback } from "./FeedbackProvider";

function getUrgency(savedAt: string, step: number) {
  const ageHours = (Date.now() - new Date(savedAt).getTime()) / (1000 * 60 * 60);
  if (ageHours > 48 || step <= 2) return { label: "Priorite haute", bg: "#FEF2F2", color: "#B91C1C" };
  if (ageHours > 12 || step <= 3) return { label: "Priorite moyenne", bg: "#FFF7ED", color: "#9A3412" };
  return { label: "A suivre", bg: "#EFF6FF", color: "#1D4ED8" };
}

export function AdminDraftsToFinish() {
  const drafts = getDrafts()
    .map((draft) => ({ ...draft, urgency: getUrgency(draft.savedAt, draft.step) }))
    .sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10 xl:py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.45rem" }}>Brouillons a finir</h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>Vue dediee aux cours qui ont besoin d'une reprise rapide avant publication.</p>
        </div>
        <Link to="/admin/nouveau-cours" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#00A05A", color: "#FFFFFF", fontWeight: 700 }}>
          <PlusCircle size={15} />
          Nouveau cours
        </Link>
      </div>

      {!drafts.length ? (
        <div className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
          <InlineFeedback title="Aucun brouillon a terminer" description="Le builder est propre pour le moment. Cree un nouveau cours ou ouvre la page Brouillons pour l'historique complet." tone="success" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/admin/nouveau-cours" className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#00A05A", color: "#FFFFFF", fontWeight: 700 }}>
              Creer un cours
            </Link>
            <Link to="/admin/brouillons" className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
              Voir les brouillons
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {drafts.map((draft) => (
            <div key={draft.id} className="rounded-[26px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} color="#005EFA" />
                    <p style={{ color: "#111827", fontWeight: 800 }}>{draft.title || "Sans titre"}</p>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>{draft.description || "Description a completer"}</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: draft.urgency.bg, color: draft.urgency.color, fontWeight: 800 }}>
                  {draft.urgency.label}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Etape atteinte</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{draft.step}/5</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Derniere sauvegarde</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{new Date(draft.savedAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                  <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Signal</p>
                  <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{draft.step <= 2 ? "Structure incomplete" : "Finalisation a faire"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} color="#C2410C" />
                  <p className="text-sm" style={{ color: "#9A3412", fontWeight: 800 }}>Prochaine action</p>
                </div>
                <p className="mt-3 text-sm" style={{ color: "#9A3412", fontWeight: 700 }}>
                  {draft.step <= 2 ? "Completer le fond et les ressources avant publication." : draft.step <= 4 ? "Finaliser les regles, l'output ou les cibles de publication." : "Verifier une derniere fois avant de publier."}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>
                  <Clock size={13} />
                  Reprise conseillee rapidement
                </div>
                <Link to={`/admin/nouveau-cours?draft=${draft.id}`} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                  Reprendre <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
