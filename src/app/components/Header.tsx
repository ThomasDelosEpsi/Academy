import { Bell, ChevronDown, Search, Shield, Star, User, X, Zap } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useMemo, useState } from "react";
import { APP_NAME } from "../config/appConfig";
import {
  getFavorites,
  markAllNotificationsRead,
  useAcademyStore,
} from "../data/academyStore";
import { getWorkspaceLearningMetrics } from "../data/courseStore";
import {
  getCurrentTenant,
  getCurrentUser,
  getCurrentWorkspace,
  getCurrentWorkspaceRole,
  setCurrentTenant,
  setCurrentWorkspace,
  useTenantStore,
} from "../data/tenantStore";
import { CommandPalette } from "./CommandPalette";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Header() {
  const location = useLocation();
  const academyState = useAcademyStore();
  const tenantState = useTenantStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  const isAdmin = location.pathname.startsWith("/admin");
  const learnerMetrics = useMemo(() => getWorkspaceLearningMetrics(), [academyState, tenantState]);
  const unreadCount = academyState.notifications.filter((notification) => !notification.read).length;
  const latestNotifications = academyState.notifications.slice(0, 6);
  const currentTenant = getCurrentTenant();
  const currentWorkspace = getCurrentWorkspace();
  const currentUser = getCurrentUser();
  const workspaceRole = getCurrentWorkspaceRole(currentWorkspace?.id);
  const favorites = getFavorites();

  const levelColor = learnerMetrics.level === "Expert"
    ? "#F59E0B"
    : learnerMetrics.level === "Avance"
      ? "#00A05A"
      : learnerMetrics.level === "Intermediaire"
        ? "#005EFA"
        : "#6B7280";

  const initials = getInitials(currentUser?.name ?? "AA");
  const primaryNav = isAdmin
    ? [
      { label: "Parcours", href: "/admin/parcours-tenant" },
      { label: "Cours", href: "/admin/catalogue-cours" },
      { label: "Apprenants", href: "/admin/apprenants" },
      { label: "Soumissions", href: "/admin/soumissions-bloquees" },
    ]
    : [
      { label: "Parcours", href: "/" },
      { label: "Cours", href: "/" },
      { label: "Apprenants", href: workspaceRole === "tutor" ? "/admin/apprenants" : "/" },
      { label: "Soumissions", href: "/soumissions" },
    ];

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div className="mx-auto max-w-[1840px] px-4 py-2 md:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "#00A05A" }}>
              <Zap size={16} color="#FFFFFF" fill="#FFFFFF" />
            </div>
            <span className="hidden text-sm tracking-wide sm:inline" style={{ color: "#00A05A", fontWeight: 700, letterSpacing: "0.02em" }}>
              {APP_NAME.toUpperCase()}
            </span>
          </Link>

          <div className="hidden min-w-0 items-center gap-2 xl:flex">
            <label className="sr-only" htmlFor="header-tenant">Entreprise</label>
            <select
              id="header-tenant"
              aria-label="Entreprise"
              value={currentTenant.id}
              onChange={(event) => setCurrentTenant(event.target.value)}
              className="w-[185px] rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}
            >
              {tenantState.tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="header-workspace">Espace</label>
            <select
              id="header-workspace"
              aria-label="Espace"
              value={currentWorkspace?.id ?? ""}
              onChange={(event) => setCurrentWorkspace(event.target.value)}
              className="w-[170px] rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}
            >
              {currentTenant.workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 xl:flex">
            <nav
              className="flex items-center gap-1 rounded-2xl border px-1.5 py-1"
              style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}
            >
              {primaryNav.map((item) => {
                const active = item.href === "/"
                  ? location.pathname === "/"
                  : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={`${item.label}-${item.href}`}
                    to={item.href}
                    className="whitespace-nowrap rounded-xl px-3 py-1.5 text-sm"
                    style={{
                      backgroundColor: active ? "#EFF6FF" : "transparent",
                      color: active ? "#1D4ED8" : "#475569",
                      fontWeight: active ? 800 : 700,
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => {
                setPaletteQuery("");
                setShowPalette(true);
              }}
              className="flex w-full max-w-[360px] items-center gap-3 rounded-2xl border px-4 py-2 text-left"
              style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}
            >
              <Search size={15} color="#6B7280" />
              <span className="flex-1 truncate text-sm" style={{ color: "#6B7280" }}>
                Rechercher...
              </span>
              <span
                className="rounded-lg px-2 py-1 text-xs"
                style={{ backgroundColor: "#FFFFFF", color: "#6B7280", fontWeight: 800, border: "1px solid #E5E7EB" }}
              >
                Ctrl+K
              </span>
            </button>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-2">
              {!isAdmin && (
                <div
                  className="hidden items-center gap-2 rounded-full px-2.5 py-1 xl:flex"
                  style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}
                >
                  <span className="text-xs" style={{ color: levelColor, fontWeight: 800 }}>
                    {learnerMetrics.progressPercent}%
                  </span>
                  <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${learnerMetrics.progressPercent}%`, background: "linear-gradient(90deg, #00A05A 0%, #34D399 100%)" }}
                    />
                  </div>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => {
                    const next = !showNotifications;
                    setShowNotifications(next);
                    setShowUserMenu(false);
                    if (next) markAllNotificationsRead();
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <Bell size={18} color="#374151" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
                      style={{ backgroundColor: "#F59E0B", color: "#FFFFFF", fontWeight: 700 }}
                    >
                      {Math.min(unreadCount, 9)}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 18px 50px rgba(0,0,0,0.12)" }}
                  >
                    <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "#F3F4F6" }}>
                      <div>
                        <p style={{ color: "#111827", fontWeight: 700 }}>Notifications</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>{latestNotifications.length} element(s) recents</p>
                      </div>
                      <button onClick={() => setShowNotifications(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
                        <X size={14} color="#9CA3AF" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {latestNotifications.length === 0 && (
                        <div className="px-4 py-6 text-sm" style={{ color: "#6B7280" }}>
                          Aucune notification.
                        </div>
                      )}

                      {latestNotifications.map((notification) => (
                        <Link
                          key={notification.id}
                          to={notification.href ?? location.pathname}
                          onClick={() => setShowNotifications(false)}
                          className="block border-b px-4 py-3 hover:bg-slate-50"
                          style={{ borderColor: "#F8FAFC" }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: notification.kind === "success"
                                  ? "#00A05A"
                                  : notification.kind === "warning"
                                    ? "#F59E0B"
                                    : notification.kind === "error"
                                      ? "#EF4444"
                                      : "#005EFA",
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{notification.title}</p>
                              <p className="mt-0.5 text-xs" style={{ color: "#6B7280", lineHeight: 1.5 }}>{notification.message}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t p-3" style={{ borderColor: "#F3F4F6" }}>
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="flex items-center justify-center rounded-xl px-4 py-2.5 text-sm"
                        style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 800 }}
                      >
                        Ouvrir le centre de notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu((value) => !value);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs text-white"
                    style={{ background: "linear-gradient(135deg, #005EFA 0%, #3B82F6 100%)", fontWeight: 700 }}
                  >
                    {initials}
                  </div>
                  <div className="hidden flex-col items-start leading-none xl:flex">
                    <span className="text-sm" style={{ color: "#111827", fontWeight: 600 }}>{currentUser?.name ?? "Utilisateur"}</span>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{currentWorkspace?.name ?? "Espace"}</span>
                  </div>
                  <ChevronDown size={14} color="#9CA3AF" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 18px 50px rgba(0,0,0,0.12)" }}
                  >
                    <div className="border-b px-4 py-4" style={{ borderColor: "#F3F4F6" }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm text-white"
                          style={{ background: "linear-gradient(135deg, #005EFA 0%, #3B82F6 100%)", fontWeight: 700 }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p style={{ color: "#111827", fontWeight: 700 }}>{currentUser?.name ?? "Utilisateur"}</p>
                          <p className="text-xs" style={{ color: "#6B7280" }}>
                            {currentUser?.title ?? "Membre"} · {currentTenant.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                        <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Espace actif</p>
                        <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 700 }}>
                          {currentWorkspace?.name ?? "Aucun espace"}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>
                          {currentWorkspace?.domain ?? "General"}
                        </p>
                      </div>
                      <Link to="/" onClick={() => setShowUserMenu(false)} className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50" style={{ color: "#374151", fontWeight: 600 }}>
                        <User size={14} />
                        Tableau de bord apprenant
                      </Link>
                      <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50" style={{ color: "#374151", fontWeight: 600 }}>
                        <Shield size={14} />
                        Espace administrateur
                      </Link>
                      <Link to="/soumissions" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50" style={{ color: "#374151", fontWeight: 600 }}>
                        <Bell size={14} />
                        Mes soumissions
                      </Link>
                      <Link to="/mon-espace" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50" style={{ color: "#374151", fontWeight: 600 }}>
                        <User size={14} />
                        Mon espace
                      </Link>
                      <Link to="/activite" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50" style={{ color: "#374151", fontWeight: 600 }}>
                        <Search size={14} />
                        Centre d'activite
                      </Link>
                      <div className="mt-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
                        <div className="mb-2 flex items-center gap-2">
                          <Star size={14} color="#D97706" />
                          <p className="text-sm" style={{ color: "#9A3412", fontWeight: 800 }}>Favoris</p>
                        </div>
                        {favorites.length === 0 ? (
                          <p className="text-xs" style={{ color: "#9A3412" }}>Aucun favori pour le moment.</p>
                        ) : (
                          <div className="space-y-2">
                            {favorites.slice(0, 3).map((item) => (
                              <Link
                                key={item.id}
                                to={item.href}
                                onClick={() => setShowUserMenu(false)}
                                className="block rounded-lg px-2 py-2 text-xs hover:bg-white/50"
                                style={{ color: "#7C2D12", fontWeight: 700 }}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2 xl:hidden">
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="header-tenant-mobile">Entreprise</label>
            <select
              id="header-tenant-mobile"
              aria-label="Entreprise"
              value={currentTenant.id}
              onChange={(event) => setCurrentTenant(event.target.value)}
              className="min-w-0 flex-1 rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}
            >
              {tenantState.tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="header-workspace-mobile">Espace</label>
            <select
              id="header-workspace-mobile"
              aria-label="Espace"
              value={currentWorkspace?.id ?? ""}
              onChange={(event) => setCurrentWorkspace(event.target.value)}
              className="min-w-0 flex-1 rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}
            >
              {currentTenant.workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <nav
            className="flex items-center gap-1 overflow-x-auto rounded-2xl border px-1.5 py-1"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}
          >
            {primaryNav.map((item) => {
              const active = item.href === "/"
                ? location.pathname === "/"
                : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={`${item.label}-${item.href}-mobile`}
                  to={item.href}
                  className="whitespace-nowrap rounded-xl px-3 py-1.5 text-sm"
                  style={{
                    backgroundColor: active ? "#EFF6FF" : "transparent",
                    color: active ? "#1D4ED8" : "#475569",
                    fontWeight: active ? 800 : 700,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => {
              setPaletteQuery("");
              setShowPalette(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl border px-4 py-2 text-left"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}
          >
            <Search size={15} color="#6B7280" />
            <span className="flex-1 truncate text-sm" style={{ color: "#6B7280" }}>
              Rechercher...
            </span>
            <span
              className="rounded-lg px-2 py-1 text-xs"
              style={{ backgroundColor: "#FFFFFF", color: "#6B7280", fontWeight: 800, border: "1px solid #E5E7EB" }}
            >
              Ctrl+K
            </span>
          </button>

          {!isAdmin && (
            <div className="flex items-center gap-2 self-start rounded-full px-2.5 py-1" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <span className="text-xs" style={{ color: levelColor, fontWeight: 800 }}>
                {learnerMetrics.progressPercent}% - {learnerMetrics.level}
              </span>
              <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${learnerMetrics.progressPercent}%`, background: "linear-gradient(90deg, #00A05A 0%, #34D399 100%)" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <CommandPalette open={showPalette} onOpenChange={setShowPalette} initialQuery={paletteQuery} />
    </header>
  );
}
