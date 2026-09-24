import {
  FileText, Clock, Trash2, ArrowRight, Plus, BookOpen, AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getDrafts, deleteDraft, type Draft } from "../data/courseStore";
import { addNotification } from "../data/academyStore";
import { useConfirm } from "./FeedbackProvider";

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d} jour${d > 1 ? "s" : ""}`;
}

const STEP_LABELS: Record<number, string> = {
  1: "Informations",
  2: "Ressources",
  3: "Règles IA",
  4: "Règles UiPath & Sortie",
  5: "Publication",
};

export function AdminDrafts() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(getDrafts());
  }, []);

  const handleDelete = async (id: string) => {
    const draft = drafts.find((item) => item.id === id);
    const accepted = await confirm({
      title: "Supprimer ce brouillon ?",
      description: `Le brouillon "${draft?.title || "Sans titre"}" sera retire du navigateur local.`,
      confirmLabel: "Supprimer",
      tone: "danger",
    });

    if (!accepted) return;

    setDeletingId(id);
    setTimeout(() => {
      deleteDraft(id);
      setDrafts(getDrafts());
      setDeletingId(null);
      addNotification({
        kind: "success",
        category: "admin",
        title: "Brouillon supprime",
        message: "Le brouillon a ete retire de la liste locale.",
        href: "/admin/brouillons",
      });
    }, 350);
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.45rem" }}>
            📂 Brouillons sauvegardés
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Reprenez la création de vos cours là où vous vous étiez arrêté.
          </p>
        </div>
        <Link
          to="/admin/nouveau-cours"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{ backgroundColor: "#005EFA", color: "#fff", fontWeight: 700, boxShadow: "0 4px 12px rgba(0,94,250,0.25)" }}
        >
          <Plus size={14} /> Nouveau cours
        </Link>
      </div>

      {/* Empty state */}
      {drafts.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl gap-4"
          style={{ backgroundColor: "#fff", border: "2px dashed #E5E7EB" }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F3F4F6" }}>
            <FileText size={28} color="#D1D5DB" />
          </div>
          <div className="text-center">
            <p style={{ color: "#374151", fontWeight: 700 }}>Aucun brouillon sauvegardé</p>
            <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
              Cliquez sur « Brouillon » lors de la création d'un cours pour le retrouver ici.
            </p>
          </div>
          <Link
            to="/admin/nouveau-cours"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm mt-2"
            style={{ backgroundColor: "#00A05A", color: "#fff", fontWeight: 700 }}
          >
            <Plus size={14} /> Créer un premier cours
          </Link>
        </div>
      )}

      {/* Draft list */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wider" style={{ color: "#9CA3AF", fontWeight: 700 }}>
            {drafts.length} brouillon{drafts.length > 1 ? "s" : ""} en attente
          </p>
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                backgroundColor: deletingId === draft.id ? "#FEF2F2" : "#fff",
                border: `1.5px solid ${deletingId === draft.id ? "#FECACA" : "#E5E7EB"}`,
                opacity: deletingId === draft.id ? 0.5 : 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-start gap-4 p-5">
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#EFF6FF" }}
                >
                  <BookOpen size={20} color="#005EFA" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className="truncate"
                        style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}
                      >
                        {draft.title || "Sans titre"}
                      </h3>
                      {draft.description && (
                        <p
                          className="text-sm mt-0.5 line-clamp-2"
                          style={{ color: "#6B7280", lineHeight: 1.5 }}
                        >
                          {draft.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="p-2 rounded-lg shrink-0 hover:opacity-70 transition-opacity"
                      style={{ backgroundColor: "#FEF2F2" }}
                      title="Supprimer ce brouillon"
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </button>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} color="#9CA3AF" />
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>
                        {timeAgo(draft.savedAt)}
                      </span>
                    </div>
                    {/* Step progress */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 600 }}
                      >
                        Étape {draft.step}/5 — {STEP_LABELS[draft.step] ?? ""}
                      </div>
                    </div>
                    {/* Completion indicator */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className="w-4 h-1.5 rounded-full"
                          style={{
                            backgroundColor: n < draft.step
                              ? "#00A05A"
                              : n === draft.step
                              ? "#005EFA"
                              : "#E5E7EB",
                          }}
                        />
                      ))}
                    </div>
                    {!draft.title && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={11} color="#F59E0B" />
                        <span className="text-xs" style={{ color: "#F59E0B", fontWeight: 600 }}>
                          Sans titre
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ backgroundColor: "#F9FAFB", borderTop: "1px solid #F3F4F6" }}
              >
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  Dernière modification : {new Date(draft.savedAt).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <button
                  onClick={() => navigate(`/admin/nouveau-cours?draft=${draft.id}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#005EFA", color: "#fff", fontWeight: 700 }}
                >
                  Reprendre <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help */}
      <div
        className="mt-8 p-4 rounded-2xl flex items-start gap-3"
        style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}
      >
        <FileText size={14} color="#15803D" className="shrink-0 mt-0.5" />
        <p className="text-xs" style={{ color: "#15803D", lineHeight: 1.65 }}>
          <strong>Astuce :</strong> Les brouillons sont sauvegardés localement dans votre navigateur. Cliquez sur «&nbsp;💾 Sauvegarder brouillon&nbsp;» à tout moment lors de la création d'un cours pour ne pas perdre votre travail. Vous pouvez avoir autant de brouillons simultanés que vous le souhaitez.
        </p>
      </div>
    </div>
  );
}
