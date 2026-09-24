import { Bell, CheckCheck, Filter, Info, ShieldAlert } from "lucide-react";
import { Link } from "react-router";
import { markAllNotificationsRead, useAcademyStore } from "../data/academyStore";
import { InlineFeedback } from "./FeedbackProvider";

export function NotificationsCenter() {
  const academyState = useAcademyStore();
  const notifications = academyState.notifications;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "#005EFA", fontWeight: 800 }}>Notifications</p>
          <h1 className="mt-2" style={{ color: "#111827", fontWeight: 800, fontSize: "1.6rem" }}>Centre de notifications</h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>
            Tous les signaux utiles du parcours, des soumissions et de l’administration sont regroupés ici dans une vue plus lisible que le simple panneau du header.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => markAllNotificationsRead()} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
            <CheckCheck size={15} />
            Tout marquer comme lu
          </button>
          <Link to="/activite" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#F8FAFC", color: "#334155", fontWeight: 700, border: "1px solid #E5E7EB" }}>
            <Filter size={15} />
            Ouvrir l’activité
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: notifications.length, color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "Non lues", value: notifications.filter((item) => !item.read).length, color: "#B91C1C", bg: "#FEF2F2" },
          { label: "Soumissions", value: notifications.filter((item) => item.category === "submission").length, color: "#166534", bg: "#F0FDF4" },
          { label: "Administration", value: notifications.filter((item) => item.category === "admin").length, color: "#92400E", bg: "#FEF3C7" },
        ].map((card) => (
          <div key={card.label} className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: card.bg }}>
              <Bell size={18} color={card.color} />
            </div>
            <p style={{ color: "#111827", fontWeight: 800, fontSize: "1.6rem" }}>{card.value}</p>
            <p className="mt-1 text-sm" style={{ color: "#6B7280", fontWeight: 600 }}>{card.label}</p>
          </div>
        ))}
      </div>

      {notifications.length === 0 ? (
        <InlineFeedback title="Aucune notification" description="Les prochaines validations, relances et mises à jour apparaîtront ici automatiquement." />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-[24px] p-5" style={{ backgroundColor: notification.read ? "#FFFFFF" : "#F8FAFC", border: `1px solid ${notification.read ? "#E5E7EB" : "#BFDBFE"}`, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: notification.kind === "success" ? "#DCFCE7" : notification.kind === "warning" ? "#FEF3C7" : notification.kind === "error" ? "#FEE2E2" : "#DBEAFE", color: notification.kind === "success" ? "#166534" : notification.kind === "warning" ? "#92400E" : notification.kind === "error" ? "#B91C1C" : "#1D4ED8", fontWeight: 800 }}>
                      {notification.kind}
                    </span>
                    <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#475569", fontWeight: 700 }}>
                      {notification.category}
                    </span>
                    {!notification.read && (
                      <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#111827", color: "#FFFFFF", fontWeight: 800 }}>
                        Nouveau
                      </span>
                    )}
                  </div>
                  <h2 style={{ color: "#111827", fontWeight: 800 }}>{notification.title}</h2>
                  <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>{notification.message}</p>
                </div>
                <div className="w-full md:w-[260px]">
                  <div className="rounded-[22px] p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                    <div className="flex items-center gap-2">
                      {notification.kind === "error" ? <ShieldAlert size={15} color="#B91C1C" /> : <Info size={15} color="#1D4ED8" />}
                      <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Action recommandee</p>
                    </div>
                    <p className="mt-2 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                      Ouvrir l’ecran lie pour traiter ou consulter cette information dans son contexte.
                    </p>
                    {notification.href && (
                      <Link to={notification.href} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
                        Ouvrir
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
