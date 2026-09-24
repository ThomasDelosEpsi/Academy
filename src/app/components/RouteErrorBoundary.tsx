import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router";

export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = "Une erreur est survenue";
  let description = "L'ecran n'a pas pu etre charge correctement. Vous pouvez revenir au tableau de bord ou recharger la page.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    description = typeof error.data === "string" ? error.data : description;
  } else if (error instanceof Error) {
    description = error.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)" }}>
      <div className="w-full max-w-xl rounded-[28px] border p-8" style={{ backgroundColor: "#FFFFFF", borderColor: "#DBEAFE", boxShadow: "0 30px 80px rgba(37, 99, 235, 0.14)" }}>
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
          <AlertTriangle size={24} color="#DC2626" />
        </div>
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "#2563EB", fontWeight: 800 }}>
          Error Boundary
        </p>
        <h1 className="mt-3" style={{ color: "#111827", fontWeight: 800, fontSize: "1.7rem", lineHeight: 1.15 }}>
          {title}
        </h1>
        <p className="mt-3 text-sm" style={{ color: "#4B5563", lineHeight: 1.7 }}>
          {description}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm"
            style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}
          >
            <ArrowLeft size={15} />
            Retour au parcours
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm"
            style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}
          >
            <RefreshCcw size={15} />
            Recharger
          </button>
        </div>
      </div>
    </div>
  );
}
