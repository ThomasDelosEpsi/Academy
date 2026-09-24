import {
  AlertTriangle,
  BarChart3,
  Building2,
  FileText,
  Layers3,
  ListOrdered,
  PlusCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { getDrafts } from "../data/courseStore";
import { getCurrentTenant, getCurrentWorkspace, useTenantStore } from "../data/tenantStore";

const NAV_GROUPS = [
  {
    label: "Pilotage",
    items: [
      { id: "overview", path: "/admin", label: "Vue d'ensemble", icon: BarChart3 },
      { id: "students", path: "/admin/apprenants", label: "Apprenants", icon: Users },
      { id: "at-risk", path: "/admin/apprenants-a-risque", label: "A risque", icon: AlertTriangle },
      { id: "analytics", path: "/admin/soumissions-bloquees", label: "Blocages", icon: AlertTriangle, badge: "1" },
    ],
  },
  {
    label: "Cours",
    items: [
      { id: "builder", path: "/admin/nouveau-cours", label: "Creer un cours", icon: PlusCircle },
      { id: "catalog", path: "/admin/catalogue-cours", label: "Catalogue", icon: ListOrdered },
      { id: "difficulty", path: "/admin/cours-en-difficulte", label: "En difficulte", icon: Layers3 },
      { id: "drafts", path: "/admin/brouillons", label: "Brouillons", icon: FileText },
    ],
  },
  {
    label: "Organisation",
    items: [
      { id: "tenant-path", path: "/admin/parcours-tenant", label: "Parcours tenant", icon: Layers3 },
      { id: "tenants", path: "/admin/tenants", label: "Tenants & espaces", icon: Building2 },
    ],
  },
];

export function AdminLayout() {
  useTenantStore();
  const location = useLocation();
  const [draftCount, setDraftCount] = useState(0);
  const currentTenant = getCurrentTenant();
  const currentWorkspace = getCurrentWorkspace();

  useEffect(() => {
    const update = () => setDraftCount(getDrafts().length);
    update();
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.id === "drafts" && draftCount > 0
        ? { ...item, badge: String(draftCount) }
        : item,
    ),
  }));

  return (
    <div className="flex min-h-[calc(100vh-3.6rem)]" style={{ backgroundColor: "#F4F6F8" }}>
      <aside className="sticky top-[3.6rem] hidden h-[calc(100vh-3.6rem)] w-[228px] shrink-0 border-r bg-white px-3 py-4 lg:flex lg:flex-col" style={{ borderColor: "#E5E7EB" }}>
        <div className="mb-4 flex items-center gap-3 rounded-xl px-2 py-2" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
            <ShieldCheck size={17} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm" style={{ color: "#111827", fontWeight: 850 }}>Administration</p>
            <p className="truncate text-xs" style={{ color: "#64748B" }}>{currentWorkspace?.name ?? "Aucun espace"}</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl px-3 py-2" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <p className="truncate text-xs" style={{ color: "#94A3B8", fontWeight: 800 }}>Entreprise</p>
          <p className="mt-1 truncate text-sm" style={{ color: "#334155", fontWeight: 800 }}>{currentTenant.name}</p>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[11px] uppercase" style={{ color: "#94A3B8", fontWeight: 850, letterSpacing: "0.08em" }}>{group.label}</p>
              <div className="space-y-1">
                {group.items.map(({ id, path, label, icon: Icon, badge }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={id}
                      to={path}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors"
                      style={{
                        backgroundColor: active ? "#EFF6FF" : "transparent",
                        color: active ? "#1D4ED8" : "#475569",
                        border: active ? "1px solid #BFDBFE" : "1px solid transparent",
                        fontWeight: active ? 850 : 700,
                      }}
                    >
                      <Icon size={16} color={active ? "#1D4ED8" : "#64748B"} />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {badge && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px]"
                          style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 850 }}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 border-t pt-4" style={{ borderColor: "#E5E7EB" }}>
          <Link
            to="/admin/nouveau-cours"
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm"
            style={{ backgroundColor: "#00A05A", color: "#FFFFFF", fontWeight: 850 }}
          >
            <PlusCircle size={15} />
            Nouveau cours
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b bg-white px-4 py-3 md:px-6 lg:hidden" style={{ borderColor: "#E5E7EB" }}>
          <div className="mb-2 flex items-center gap-2 text-sm" style={{ color: "#111827", fontWeight: 850 }}>
            <ShieldCheck size={16} color="#1D4ED8" />
            Administration
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {navGroups.flatMap((group) => group.items).map(({ id, path, label, badge }) => {
              const active = isActive(path);
              return (
                <Link
                  key={`${id}-mobile`}
                  to={path}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-sm"
                  style={{
                    backgroundColor: active ? "#0F172A" : "#F8FAFC",
                    color: active ? "#FFFFFF" : "#475569",
                    border: `1px solid ${active ? "#0F172A" : "#E5E7EB"}`,
                    fontWeight: 800,
                  }}
                >
                  {label}
                  {badge && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{badge}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
