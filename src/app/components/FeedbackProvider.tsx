import { createContext, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { Toaster } from "sonner";

type ConfirmTone = "default" | "danger";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const value = useMemo<ConfirmContextValue>(() => ({
    confirm: (options) =>
      new Promise<boolean>((resolve) => {
        setPendingConfirm({ ...options, resolve });
      }),
  }), []);

  const closeDialog = (accepted: boolean) => {
    pendingConfirm?.resolve(accepted);
    setPendingConfirm(null);
  };

  const tone = pendingConfirm?.tone ?? "default";
  const accent = tone === "danger"
    ? { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", button: "#DC2626", icon: <ShieldAlert size={18} color="#DC2626" /> }
    : { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", button: "#005EFA", icon: <Info size={18} color="#005EFA" /> };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        expand
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: 16,
            border: "1px solid #E5E7EB",
          },
        }}
      />

      {pendingConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)" }}
          role="presentation"
          onClick={() => closeDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6"
            style={{ backgroundColor: "#FFFFFF", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)" }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: accent.bg, border: `1px solid ${accent.border}` }}
            >
              {accent.icon}
            </div>
            <h2 id="confirm-dialog-title" style={{ color: "#111827", fontWeight: 800, fontSize: "1.15rem" }}>
              {pendingConfirm.title}
            </h2>
            <p id="confirm-dialog-description" className="mt-2 text-sm" style={{ color: "#4B5563", lineHeight: 1.6 }}>
              {pendingConfirm.description}
            </p>
            {tone === "danger" && (
              <div
                className="mt-4 flex items-start gap-2 rounded-2xl p-3"
                style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}
              >
                <AlertTriangle size={14} color="#C2410C" className="mt-0.5 shrink-0" />
                <p className="text-xs" style={{ color: "#9A3412", lineHeight: 1.55 }}>
                  Cette action est immediate et modifie l'etat visible pour les apprenants.
                </p>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => closeDialog(false)}
                className="flex-1 rounded-2xl px-4 py-3 text-sm"
                style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}
              >
                {pendingConfirm.cancelLabel ?? "Annuler"}
              </button>
              <button
                onClick={() => closeDialog(true)}
                className="flex-1 rounded-2xl px-4 py-3 text-sm"
                style={{ backgroundColor: accent.button, color: "#FFFFFF", fontWeight: 700 }}
              >
                {pendingConfirm.confirmLabel ?? "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used inside FeedbackProvider");
  }
  return context.confirm;
}

export function InlineFeedback({
  title,
  description,
  tone = "info",
}: {
  title: string;
  description: string;
  tone?: "info" | "success" | "warning";
}) {
  const config = tone === "success"
    ? { bg: "#F0FDF4", border: "#BBF7D0", title: "#166534", text: "#15803D", icon: <CheckCircle2 size={15} color="#16A34A" /> }
    : tone === "warning"
      ? { bg: "#FFF7ED", border: "#FED7AA", title: "#9A3412", text: "#C2410C", icon: <AlertTriangle size={15} color="#C2410C" /> }
      : { bg: "#EFF6FF", border: "#BFDBFE", title: "#1D4ED8", text: "#2563EB", icon: <Info size={15} color="#2563EB" /> };

  return (
    <div className="flex items-start gap-3 rounded-2xl p-4" style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}>
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div>
        <p className="text-sm" style={{ color: config.title, fontWeight: 700 }}>{title}</p>
        <p className="mt-1 text-xs" style={{ color: config.text, lineHeight: 1.6 }}>{description}</p>
      </div>
    </div>
  );
}
