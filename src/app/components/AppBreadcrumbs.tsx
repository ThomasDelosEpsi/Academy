import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Administration",
  "catalogue-cours": "Cours",
  "parcours-tenant": "Parcours",
  "soumissions-bloquees": "Soumissions",
  brouillons: "Cours",
  tenants: "Administration",
  "nouveau-cours": "Cours",
  "mon-espace": "Mon espace",
  "mon-planning": "Mon planning",
  notifications: "Notifications",
  activite: "Activite",
  apprenants: "Apprenants",
  cours: "Cours",
  soumissions: "Soumissions",
  projet: "Cours",
};

function getCrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ href: "/", label: "Parcours" }];

  const crumbs: { href: string; label: string }[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = SEGMENT_LABELS[segment] ?? decodeURIComponent(segment);
    if (crumbs.at(-1)?.label !== label) crumbs.push({ href: currentPath, label });
  }

  return crumbs;
}

export function AppBreadcrumbs() {
  const location = useLocation();
  const crumbs = getCrumbs(location.pathname);

  return (
    <div className="border-b px-4 py-2 md:px-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
      <nav className="mx-auto flex w-full max-w-[1840px] flex-wrap items-center gap-1.5 text-sm" aria-label="Fil d'Ariane">
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-1" style={{ color: "#6B7280", fontWeight: 700 }}>
          <Home size={14} />
          Accueil
        </Link>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <div key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1.5">
              <ChevronRight size={14} color="#9CA3AF" />
              {isLast ? (
                <span className="rounded-lg px-2 py-1" style={{ color: "#111827", fontWeight: 800 }}>
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.href} className="rounded-lg px-2 py-1" style={{ color: "#6B7280", fontWeight: 700 }}>
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
