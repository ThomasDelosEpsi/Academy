import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  CheckSquare,
  Clock,
  Code2,
  Download,
  ExternalLink,
  FileArchive,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Lock,
  PlayCircle,
  Shield,
  Timer,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { FEATURE_FLAGS } from "../config/appConfig";
import { addNotification, getCourseSubmissionHistory, isFavorite, recordCourseSubmissionAttempt, toggleFavorite, useAcademyStore } from "../data/academyStore";
import { getCourseById, getCourseProgress, getWorkspaceLearningPath, updateCourseProgress, type PublishedCourse, type RpaResource } from "../data/courseStore";
import { getCurrentUser, useTenantStore } from "../data/tenantStore";

type AIState = "idle" | "analyzing" | "failed" | "success";
type NavSectionId = "context" | "rules" | "resources" | "submission";
type VerdictStatus = "pass" | "warning" | "fail";
type EvaluationMode = "full" | "python_rerun" | "ai_second_pass";
type CourseViewMode = "before" | "work" | "after";

type CriterionScore = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
};

type LayerVerdict = {
  status: VerdictStatus;
  score: number;
  summary: string;
  findings: string[];
};

type EvaluationAttempt = {
  id: string;
  mode: EvaluationMode;
  createdAt: string;
  ai: LayerVerdict;
  python: LayerVerdict;
  final: LayerVerdict;
  criteria: CriterionScore[];
};

function ResourceIcon({ type }: { type: string }) {
  if (type === "ZIP") return <FileArchive size={16} color="#7C3AED" />;
  if (type === "LIEN") return <ExternalLink size={16} color="#005EFA" />;
  if (type === "XAML") return <Code2 size={16} color="#00A05A" />;
  if (type === "XLSX") return <FileSpreadsheet size={16} color="#15803D" />;
  return <FileText size={16} color="#D97706" />;
}

function downloadCourseResource(course: PublishedCourse, resource: RpaResource) {
  const content = [`Cours : ${course.name}`, `Ressource : ${resource.name}`, `Type : ${resource.type}`, resource.url || "Source : a raccorder au backend"].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${resource.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resource"}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function getAcceptedExtensions(course: PublishedCourse) {
  return course.rpaConfig?.submissionFileTypes?.length ? course.rpaConfig.submissionFileTypes : ["nupkg"];
}

function getAcceptAttribute(extensions: string[]) {
  return extensions.map((extension) => `.${extension}`).join(",");
}

function getVerdictPalette(status: VerdictStatus) {
  if (status === "pass") return { border: "#86EFAC", bg: "#F0FDF4", pillBg: "#D1FAE5", pillColor: "#166534", icon: "#00A05A" };
  if (status === "warning") return { border: "#FDE68A", bg: "#FFFBEB", pillBg: "#FEF3C7", pillColor: "#92400E", icon: "#D97706" };
  return { border: "#FECACA", bg: "#FEF2F2", pillBg: "#FEE2E2", pillColor: "#B91C1C", icon: "#DC2626" };
}

function buildBaseCriteria(course: PublishedCourse) {
  return [
    { id: "brief", label: "Conformite au brief" },
    { id: "workflow", label: "Structure du workflow" },
    { id: "output", label: "Qualite du fichier de sortie" },
    { id: "logs", label: "Logs et preuves" },
    { id: "python", label: `Garde-fous Python (${course.rpaConfig?.pythonRules.filter((rule) => rule.enabled).length ?? 0})` },
  ];
}

function buildEvaluationAttempt(course: PublishedCourse, mode: EvaluationMode, previous?: EvaluationAttempt | null, fullAttemptNumber = 1): EvaluationAttempt {
  const baseCriteria = buildBaseCriteria(course);
  const firstFull = mode === "full" && fullAttemptNumber === 1;
  const aiScore = mode === "ai_second_pass" ? Math.min(100, (previous?.ai.score ?? 72) + 8) : firstFull ? 68 : Math.min(100, (previous?.ai.score ?? 78) + 12);
  const pythonScore = mode === "python_rerun" ? Math.min(100, (previous?.python.score ?? 58) + 26) : firstFull ? 56 : Math.min(100, (previous?.python.score ?? 70) + 18);
  const finalScore = Math.round(aiScore * 0.55 + pythonScore * 0.45);
  const aiStatus: VerdictStatus = aiScore >= 85 ? "pass" : aiScore >= 72 ? "warning" : "fail";
  const pythonStatus: VerdictStatus = pythonScore >= 85 ? "pass" : pythonScore >= 70 ? "warning" : "fail";
  const finalStatus: VerdictStatus = aiStatus === "pass" && pythonStatus === "pass" ? "pass" : aiStatus === "fail" || pythonStatus === "fail" ? "fail" : "warning";
  const criteria: CriterionScore[] = baseCriteria.map((criterion, index) => ({
    ...criterion,
    maxScore: 20,
    score: Math.min(20, Math.max(0, criterion.id === "python" ? Math.round((pythonScore / 100) * 20) : Math.round((aiScore / 100) * (18 - Math.min(index, 2)) ))),
  }));

  return {
    id: `${mode}-${Date.now()}`,
    mode,
    createdAt: new Date().toISOString(),
    ai: {
      status: aiStatus,
      score: aiScore,
      summary: aiStatus === "pass" ? "Le verdict IA confirme une solution conforme, claire et exploitable." : aiStatus === "warning" ? "Le verdict IA reste prudent : la solution est coherent mais encore perfectible." : "Le verdict IA refuse encore le rendu sur des points de structure et de conformite.",
      findings: aiStatus === "pass"
        ? ["Brief respecte", "Structure lisible", "Output coherent"]
        : aiStatus === "warning"
          ? ["Le brief est globalement compris", "Quelques zones de flou persistent", "Les traces restent perfectibles"]
          : ["Brief incomplet sur certains cas", "Workflow trop dense", "Logs insuffisants pour un audit"],
    },
    python: {
      status: pythonStatus,
      score: pythonScore,
      summary: pythonStatus === "pass" ? "Les regles Python bloquantes passent toutes sur cette tentative." : pythonStatus === "warning" ? "Les garde-fous Python remontent encore des warnings non bloquants." : "Les regles Python bloquantes detectent encore des ecarts techniques.",
      findings: pythonStatus === "pass"
        ? ["Schema de sortie valide", "Workflow structure conforme", "Pas de secret en dur detecte"]
        : pythonStatus === "warning"
          ? ["Schema valide", "Un warning subsiste sur la qualite des logs", "Selecteurs a fiabiliser"]
          : ["Schema de sortie partiellement non conforme", "Workflow trop dense", "Gestion d'exception incomplete"],
    },
    final: {
      status: finalStatus,
      score: finalScore,
      summary: finalStatus === "pass" ? "Synthese finale positive : le cours peut etre valide et le parcours avance." : finalStatus === "warning" ? "Synthese finale prudente : la base est bonne mais une passe de durcissement reste recommandee." : "Synthese finale negative : la tentative doit etre corrigee avant validation.",
      findings: finalStatus === "pass"
        ? ["Validation finale accordee", "Le cours suivant peut etre debloque"]
        : finalStatus === "warning"
          ? ["Relancer Python ou une seconde lecture IA pour securiser la correction"]
          : ["Corriger le package puis relancer la validation"],
    },
    criteria,
  };
}

function compareAttempts(previous: EvaluationAttempt | null, current: EvaluationAttempt | null) {
  if (!previous || !current) return { improved: [] as string[], regressed: [] as string[] };
  const improved = current.criteria.filter((criterion) => {
    const previousCriterion = previous.criteria.find((item) => item.id === criterion.id);
    return (previousCriterion?.score ?? 0) < criterion.score;
  }).map((criterion) => criterion.label);
  const regressed = current.criteria.filter((criterion) => {
    const previousCriterion = previous.criteria.find((item) => item.id === criterion.id);
    return (previousCriterion?.score ?? 0) > criterion.score;
  }).map((criterion) => criterion.label);
  return { improved, regressed };
}

function parseExpectedOutputPreview(course: PublishedCourse) {
  const columns = course.rpaConfig?.outputColumns ?? [];
  const sample = course.rpaConfig?.sampleRows?.[0]?.expectedOutput ?? "";
  if (course.rpaConfig?.outputFileType === "JSON") {
    const previewObject = Object.fromEntries(columns.map((column) => [column.name, column.sampleValue || "<value>"]));
    return { format: "json" as const, columns, previewObject, previewText: JSON.stringify(previewObject, null, 2) };
  }
  const parsedRows = sample.includes("\n")
    ? sample.split("\n").filter(Boolean).map((line) => line.split(","))
    : [columns.map((column) => column.sampleValue || "<value>")];
  const candidateHeader = parsedRows[0] ?? [];
  const looksLikeHeader = candidateHeader.length === columns.length && candidateHeader.every((cell, index) => cell.trim().toLowerCase() === columns[index]?.name.trim().toLowerCase());
  const headers = looksLikeHeader ? candidateHeader : columns.map((column) => column.name);
  const rows = looksLikeHeader ? parsedRows.slice(1) : parsedRows;
  return { format: "tabular" as const, columns, headers, rows, previewText: sample };
}

function buildActualOutputSnapshot(course: PublishedCourse, attempt: EvaluationAttempt | null, uploadedFile: string | null) {
  const expectedColumns = course.rpaConfig?.outputColumns ?? [];
  const format = course.rpaConfig?.outputFileType ?? "CSV";
  if (!attempt) {
    return {
      fields: [] as { name: string; type: string; state: "missing" | "extra" | "match" | "mismatch" }[],
      headers: expectedColumns.map((column) => column.name),
      rows: [] as string[][],
      previewText: uploadedFile ? `Fichier detecte : ${uploadedFile}\nAnalyse non lancee.` : "Aucun rendu compare pour le moment.",
      summary: "Le comparatif s'activera des la premiere tentative ou apres l'import d'un fichier.",
    };
  }

  const baseFields = expectedColumns.map((column, index) => {
    if (attempt.final.status === "pass") return { name: column.name, type: column.type, state: "match" as const };
    if (attempt.final.status === "warning" && index === 1) return { name: column.name, type: "string?", state: "mismatch" as const };
    if (attempt.final.status === "fail" && index === expectedColumns.length - 1) return { name: column.name, type: column.type, state: "missing" as const };
    return { name: column.name, type: column.type, state: "match" as const };
  });
  const extraField = attempt.final.status === "fail" ? [{ name: "debug_note", type: "string", state: "extra" as const }] : [];
  const fields = [...baseFields, ...extraField];
  const visibleFields = fields.filter((field) => field.state !== "missing");
  const previewText = format === "JSON"
    ? JSON.stringify(Object.fromEntries(visibleFields.map((field) => [field.name, field.state === "mismatch" ? "type-mismatch" : field.state === "extra" ? "extra-field" : "sample"])), null, 2)
    : [visibleFields.map((field) => field.name).join(","), visibleFields.map((field) => field.state === "mismatch" ? "type-mismatch" : field.state === "extra" ? "extra-field" : "sample").join(",")].join("\n");
  const headers = visibleFields.map((field) => field.name);
  const buildRow = (rowNumber: number) => visibleFields.map((field) => {
    if (field.state === "mismatch") return rowNumber === 0 ? "type-mismatch" : `value-${rowNumber + 1}`;
    if (field.state === "extra") return rowNumber === 0 ? "extra-field" : `debug-${rowNumber + 1}`;
    return `sample-${rowNumber + 1}`;
  });
  const rows = headers.length
    ? attempt.final.status === "pass"
      ? [buildRow(0), buildRow(1), buildRow(2)]
      : attempt.final.status === "warning"
        ? [buildRow(0), buildRow(1)]
        : [buildRow(0), buildRow(1)]
    : [];
  const summary = attempt.final.status === "pass"
    ? "Le rendu colle au schema attendu et ne remonte pas d'ecart visible."
    : attempt.final.status === "warning"
      ? "Le rendu est proche du schema attendu mais au moins un champ reste ambigu ou faiblement typé."
      : "Le rendu manque des champs requis ou ajoute des colonnes parasites qui bloquent la correction.";
  return { fields, headers, rows, previewText, summary };
}

function OutputDiffPanel({ course, attempt, uploadedFile }: { course: PublishedCourse; attempt: EvaluationAttempt | null; uploadedFile: string | null }) {
  const expected = parseExpectedOutputPreview(course);
  const actual = buildActualOutputSnapshot(course, attempt, uploadedFile);
  const expectedHeaders = expected.format === "json" ? expected.columns.map((column) => column.name) : expected.headers;
  const expectedRows = expected.format === "json" ? [] : expected.rows;
  const actualHeaders = actual.headers.length ? actual.headers : expectedHeaders;
  const aiFocus = (course.rpaConfig?.validationRules ?? []).filter((rule) => rule.enabled !== false).slice(0, 3);
  const pythonFocus = (course.rpaConfig?.pythonRules ?? []).filter((rule) => rule.enabled).slice(0, 3);
  const antiPatterns = (course.rpaConfig?.antiPatterns ?? []).filter((pattern) => pattern.enabled).slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#005EFA", fontWeight: 800 }}>Output attendu</p>
            <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 800 }}>Diff attendu vs rendu</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{course.rpaConfig?.outputFileType ?? "CSV"}</span>
            <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>{(course.rpaConfig?.outputColumns ?? []).length} colonne(s)</span>
          </div>
        </div>
        <p className="mt-3 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{actual.summary}</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#1D4ED8", fontWeight: 800 }}>Le correcteur regarde</p>
            <div className="mt-3 space-y-2">{aiFocus.length ? aiFocus.map((rule) => <p key={rule.id} className="text-sm" style={{ color: "#1E3A8A" }}>{rule.label ?? rule.type}</p>) : <p className="text-sm" style={{ color: "#1E3A8A" }}>Aucune regle IA active.</p>}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#9A3412", fontWeight: 800 }}>L'IA ne pardonne pas</p>
            <div className="mt-3 space-y-2">{antiPatterns.length ? antiPatterns.map((pattern) => <p key={pattern.id} className="text-sm" style={{ color: "#9A3412" }}>{pattern.label}</p>) : <p className="text-sm" style={{ color: "#9A3412" }}>Aucun anti-pattern prioritaire configure.</p>}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#B91C1C", fontWeight: 800 }}>Python bloquera automatiquement</p>
            <div className="mt-3 space-y-2">{pythonFocus.length ? pythonFocus.map((rule) => <p key={rule.id} className="text-sm" style={{ color: "#B91C1C" }}>{rule.label}</p>) : <p className="text-sm" style={{ color: "#B91C1C" }}>Aucune regle Python active.</p>}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Schema attendu</p>
            <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#ECFDF5", color: "#166534", fontWeight: 700 }}>
              {(course.rpaConfig?.outputColumns ?? []).filter((column) => column.required).length} obligatoire(s)
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {(course.rpaConfig?.outputColumns ?? []).map((column) => (
              <div key={column.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                <div>
                  <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{column.name}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>Exemple : {column.sampleValue || "<value>"}</p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{column.type}</span>
                  {column.required && <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>Requis</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Rendu detecte</p>
          <div className="mt-4 space-y-2">
            {actual.fields.length ? actual.fields.map((field) => {
              const palette = field.state === "match"
                ? { bg: "#F0FDF4", border: "#BBF7D0", color: "#166534", label: "OK" }
                : field.state === "mismatch"
                  ? { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E", label: "Type a revoir" }
                  : field.state === "missing"
                    ? { bg: "#FEF2F2", border: "#FECACA", color: "#B91C1C", label: "Manquant" }
                    : { bg: "#FFF7ED", border: "#FED7AA", color: "#9A3412", label: "Parasite" };
              return (
                <div key={`${field.name}-${field.state}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}` }}>
                  <div>
                    <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{field.name}</p>
                    <p className="text-xs" style={{ color: "#6B7280" }}>{field.type}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#FFFFFF", color: palette.color, fontWeight: 800 }}>{palette.label}</span>
                </div>
              );
            }) : <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB", color: "#6B7280" }}>Importe un fichier ou lance une tentative pour comparer le rendu.</div>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Exemple correct attendu</p>
            <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#ECFDF5", color: "#166534", fontWeight: 700 }}>Modele</span>
          </div>
          {expected.format === "json" ? (
            <pre className="mt-4 overflow-x-auto rounded-2xl p-4 text-xs" style={{ backgroundColor: "#0F172A", color: "#E2E8F0", lineHeight: 1.7 }}>{expected.previewText}</pre>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border" style={{ borderColor: "#CBD5E1" }}>
              <table className="min-w-full text-left text-xs">
                <thead style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8" }}>
                  <tr>
                    <th className="px-3 py-2 font-bold">#</th>
                    {expectedHeaders.map((header) => (
                      <th key={`expected-${header}`} className="px-3 py-2 font-bold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(expectedRows.length ? expectedRows : [expected.columns.map((column) => column.sampleValue || "<value>")]).map((row, rowIndex) => (
                    <tr key={`expected-row-${rowIndex}`} style={{ borderTop: "1px solid #E5E7EB" }}>
                      <td className="px-3 py-2" style={{ backgroundColor: "#F8FAFC", color: "#64748B", fontWeight: 800 }}>{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => (
                        <td key={`expected-cell-${rowIndex}-${cellIndex}`} className="px-3 py-2" style={{ color: "#334155" }}>{cell || "-"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Apercu du rendu detecte</p>
            <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F8FAFC", color: "#334155", fontWeight: 700 }}>Analyse</span>
          </div>
          {(course.rpaConfig?.outputFileType ?? "CSV") === "JSON" ? (
            <pre className="mt-4 overflow-x-auto rounded-2xl p-4 text-xs" style={{ backgroundColor: "#111827", color: "#F9FAFB", lineHeight: 1.7 }}>{actual.previewText}</pre>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border" style={{ borderColor: "#CBD5E1" }}>
              <table className="min-w-full text-left text-xs">
                <thead style={{ backgroundColor: "#F8FAFC", color: "#334155" }}>
                  <tr>
                    <th className="px-3 py-2 font-bold">#</th>
                    {actualHeaders.map((header) => (
                      <th key={`actual-${header}`} className="px-3 py-2 font-bold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(actual.rows.length ? actual.rows : [actualHeaders.map(() => "-")]).map((row, rowIndex) => (
                    <tr key={`actual-row-${rowIndex}`} style={{ borderTop: "1px solid #E5E7EB" }}>
                      <td className="px-3 py-2" style={{ backgroundColor: "#F8FAFC", color: "#64748B", fontWeight: 800 }}>{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => {
                        const header = actualHeaders[cellIndex];
                        const field = actual.fields.find((item) => item.name === header);
                        const palette = field?.state === "match"
                          ? { bg: "#F0FDF4", color: "#166534" }
                          : field?.state === "mismatch"
                            ? { bg: "#FFFBEB", color: "#92400E" }
                            : field?.state === "missing"
                              ? { bg: "#FEF2F2", color: "#B91C1C" }
                              : field?.state === "extra"
                                ? { bg: "#FFF7ED", color: "#9A3412" }
                                : { bg: "#FFFFFF", color: "#334155" };
                        return (
                          <td key={`actual-cell-${rowIndex}-${cellIndex}`} className="px-3 py-2" style={{ backgroundColor: palette.bg, color: palette.color, fontWeight: 600 }}>
                            {cell || "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EvaluationPanel({ attempt, previousAttempt, onRetry, onRerunPython, onSecondAiRead, onNext, nextLabel, canRerunPython, canSecondAiRead, isAnalyzing }: { attempt: EvaluationAttempt | null; previousAttempt: EvaluationAttempt | null; onRetry: () => void; onRerunPython: () => void; onSecondAiRead: () => void; onNext: () => void; nextLabel: string; canRerunPython: boolean; canSecondAiRead: boolean; isAnalyzing: boolean }) {
  if (isAnalyzing) {
    return <div className="rounded-[26px] p-6 text-center" style={{ border: "2px solid #F59E0B", background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)" }}><Bot size={24} color="#D97706" className="mx-auto" /><p className="mt-4 text-sm" style={{ color: "#92400E", fontWeight: 800 }}>Analyse de correction en cours</p><p className="mt-2 text-xs" style={{ color: "#B45309", lineHeight: 1.6 }}>Le moteur produit un verdict IA, un verdict Python puis une synthese finale.</p></div>;
  }
  if (!attempt) return null;
  const comparison = compareAttempts(previousAttempt, attempt);
  const layers = [
    { id: "ia", title: "Verdict IA", data: attempt.ai },
    { id: "python", title: "Verdict Python", data: attempt.python },
    { id: "final", title: "Synthese finale", data: attempt.final },
  ];
  return <div className="space-y-4">
    <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#6B7280", fontWeight: 800 }}>Correction en 3 couches</p>
          <p className="mt-1 text-sm" style={{ color: "#111827", fontWeight: 800 }}>Tentative {attempt.mode === "full" ? "complete" : attempt.mode === "python_rerun" ? "relance Python" : "seconde lecture IA"}</p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: getVerdictPalette(attempt.final.status).pillBg, color: getVerdictPalette(attempt.final.status).pillColor, fontWeight: 700 }}>{attempt.final.score}/100</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {layers.map((layer) => {
          const palette = getVerdictPalette(layer.data.status);
          return <div key={layer.id} className="rounded-2xl p-4" style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}` }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>{layer.title}</p>
              <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: palette.pillBg, color: palette.pillColor, fontWeight: 700 }}>{layer.data.score}/100</span>
            </div>
            <p className="mt-2 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{layer.data.summary}</p>
            <div className="mt-3 space-y-1">
              {layer.data.findings.map((finding) => <p key={finding} className="text-xs" style={{ color: "#374151" }}>{finding}</p>)}
            </div>
          </div>;
        })}
      </div>
    </div>

    <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Score detaille par critere</p>
        {comparison.improved.length > 0 && <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#D1FAE5", color: "#166534", fontWeight: 700 }}>{comparison.improved.length} amelioration(s)</span>}
      </div>
      <div className="mt-4 space-y-3">
        {attempt.criteria.map((criterion) => {
          const previousScore = previousAttempt?.criteria.find((item) => item.id === criterion.id)?.score ?? null;
          const delta = previousScore === null ? 0 : criterion.score - previousScore;
          return <div key={criterion.id}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{criterion.label}</p>
              <div className="flex items-center gap-2">
                {previousScore !== null && <span className="text-xs" style={{ color: delta >= 0 ? "#15803D" : "#B91C1C", fontWeight: 700 }}>{delta >= 0 ? `+${delta}` : delta}</span>}
                <span className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>{criterion.score}/{criterion.maxScore}</span>
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
              <div className="h-2 rounded-full" style={{ width: `${(criterion.score / criterion.maxScore) * 100}%`, backgroundColor: "#005EFA" }} />
            </div>
          </div>;
        })}
      </div>
    </div>

    <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Historique compare</p>
        <span className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>{new Date(attempt.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#166534", fontWeight: 800 }}>Ce qui s'ameliore</p>
          <div className="mt-2 space-y-1">
            {(comparison.improved.length ? comparison.improved : ["Aucune amelioration detectee sur cette passe"]).map((item) => <p key={item} className="text-sm" style={{ color: "#166534" }}>{item}</p>)}
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#B91C1C", fontWeight: 800 }}>Ce qui regresse</p>
          <div className="mt-2 space-y-1">
            {(comparison.regressed.length ? comparison.regressed : ["Aucune regression detectee"]).map((item) => <p key={item} className="text-sm" style={{ color: "#B91C1C" }}>{item}</p>)}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={onRetry} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#111827", color: "#FFFFFF", fontWeight: 700 }}>Nouvelle soumission complete</button>
        {canRerunPython && <button onClick={onRerunPython} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>Relancer uniquement les regles Python</button>}
        {canSecondAiRead && <button onClick={onSecondAiRead} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", fontWeight: 700 }}>Forcer une seconde lecture IA</button>}
        {attempt.final.status === "pass" && <button onClick={onNext} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#00A05A", color: "#FFFFFF", fontWeight: 700 }}>Passer a {nextLabel}</button>}
      </div>
    </div>
  </div>;
}

function BeforeStartPanel({
  course,
  contextText,
  deliverables,
  blockingRules,
  antiPatterns,
  onStart,
}: {
  course: PublishedCourse;
  contextText: string;
  deliverables: string[];
  blockingRules: number;
  antiPatterns: string[];
  onStart: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#005EFA", fontWeight: 800 }}>Avant de commencer</p>
        <h2 className="mt-3" style={{ color: "#111827", fontWeight: 800, fontSize: "1.7rem" }}>{course.name}</h2>
        <p className="mt-3 text-sm" style={{ color: "#4B5563", lineHeight: 1.8 }}>{contextText}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
            <p className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Objectif</p>
            <p className="mt-2 text-sm" style={{ color: "#111827", fontWeight: 700 }}>Livrer un rendu exploitable et conforme.</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
            <p className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Temps estime</p>
            <p className="mt-2 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{course.duration}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
            <p className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Livrables</p>
            <p className="mt-2 text-sm" style={{ color: "#111827", fontWeight: 700 }}>{deliverables.length || 1} element(s) attendus</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
            <p className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Evaluation</p>
            <p className="mt-2 text-sm" style={{ color: "#111827", fontWeight: 700 }}>IA + {blockingRules} regle(s) bloquante(s)</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Livrables attendus</p>
          <div className="mt-4 space-y-3">
            {deliverables.map((item) => (
              <div key={item} className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontWeight: 700 }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Erreurs frequentes</p>
          <div className="mt-4 space-y-3">
            {antiPatterns.length ? antiPatterns.map((item) => (
              <div key={item} className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA", color: "#9A3412", fontWeight: 700 }}>
                {item}
              </div>
            )) : (
              <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB", color: "#6B7280" }}>
                Aucun anti-pattern prioritaire configure pour ce cours.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onStart} className="rounded-2xl px-5 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
          Commencer le cours
        </button>
        <Link to="/" className="rounded-2xl px-5 py-3 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
          Retour au parcours
        </Link>
      </div>
    </div>
  );
}

function AfterSubmissionPanel({
  attempt,
  course,
  nextCourse,
  onBackToWork,
}: {
  attempt: EvaluationAttempt | null;
  course: PublishedCourse;
  nextCourse: PublishedCourse | null;
  onBackToWork: () => void;
}) {
  if (!attempt) {
    return (
      <div className="rounded-[28px] border p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#6B7280", fontWeight: 800 }}>Apres soumission</p>
        <h2 className="mt-3" style={{ color: "#111827", fontWeight: 800, fontSize: "1.5rem" }}>Aucune tentative enregistree</h2>
        <p className="mt-3 text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>Cette vue deviendra pedagogique des qu'une soumission sera analysee. Elle resumerera ce qui est bon, ce qui bloque et quoi corriger d'abord.</p>
        <button onClick={onBackToWork} className="mt-5 rounded-2xl px-5 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
          Aller a la soumission
        </button>
      </div>
    );
  }

  const priorities = [...attempt.criteria].sort((a, b) => a.score / a.maxScore - b.score / b.maxScore).slice(0, 3);
  const positives = attempt.ai.findings.slice(0, 3);
  const blockers = attempt.final.status === "fail" ? [...attempt.python.findings, ...attempt.final.findings].slice(0, 4) : attempt.python.findings.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#6B7280", fontWeight: 800 }}>Apres soumission</p>
            <h2 className="mt-3" style={{ color: "#111827", fontWeight: 800, fontSize: "1.6rem" }}>{course.name}</h2>
          </div>
          <span className="rounded-full px-4 py-2 text-sm" style={{ backgroundColor: getVerdictPalette(attempt.final.status).pillBg, color: getVerdictPalette(attempt.final.status).pillColor, fontWeight: 800 }}>
            {attempt.final.score}/100
          </span>
        </div>
        <p className="mt-3 text-sm" style={{ color: "#4B5563", lineHeight: 1.8 }}>{attempt.final.summary}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }}>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#166534", fontWeight: 800 }}>Ce qui est bon</p>
          <div className="mt-4 space-y-2">
            {positives.map((item) => <p key={item} className="text-sm" style={{ color: "#166534", fontWeight: 700 }}>{item}</p>)}
          </div>
        </div>
        <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#B91C1C", fontWeight: 800 }}>Ce qui bloque</p>
          <div className="mt-4 space-y-2">
            {blockers.map((item) => <p key={item} className="text-sm" style={{ color: "#B91C1C", fontWeight: 700 }}>{item}</p>)}
          </div>
        </div>
        <div className="rounded-[26px] border p-5" style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#92400E", fontWeight: 800 }}>Quoi corriger d'abord</p>
          <div className="mt-4 space-y-2">
            {priorities.map((criterion) => <p key={criterion.id} className="text-sm" style={{ color: "#92400E", fontWeight: 700 }}>{criterion.label} · {criterion.score}/{criterion.maxScore}</p>)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onBackToWork} className="rounded-2xl px-5 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
          Revenir au detail du cours
        </button>
        <Link to={nextCourse ? `/cours/${nextCourse.id}` : "/"} className="rounded-2xl px-5 py-3 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
          {nextCourse ? `Voir ${nextCourse.name}` : "Retour au parcours"}
        </Link>
      </div>
    </div>
  );
}

export function WorkspaceCoursePlayer() {
  useAcademyStore();
  useTenantStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id = "" } = useParams();
  const user = getCurrentUser();
  const course = getCourseById(id);
  const favorite = isFavorite(`course:${id}`);
  const [sessionSeconds, setSessionSeconds] = useState(2737);
  const [repoUrl, setRepoUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submissionAttempts, setSubmissionAttempts] = useState(0);
  const [aiState, setAiState] = useState<AIState>("idle");
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationAttempt[]>([]);
  const [activeNav, setActiveNav] = useState<NavSectionId>("context");
  const [checklist, setChecklist] = useState({ structure: false, activities: false });
  const [focusMode, setFocusMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const submissionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setSessionSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!course) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><p style={{ color: "#111827", fontWeight: 800 }}>Cours introuvable.</p><Link to="/" className="mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}><ArrowLeft size={14} /> Retour au tableau de bord</Link></div>;
  }

  const learningPath = getWorkspaceLearningPath(course.workspaceId, user?.id ?? "");
  const currentPathItem = learningPath.find((item) => item.course.id === course.id);
  const workspaceCourses = learningPath.map((item) => item.course);
  const courseIndex = Math.max(0, learningPath.findIndex((item) => item.course.id === course.id));
  const progress = getCourseProgress(course.id, user?.id ?? "");
  const progressPercent = progress?.progressPercent ?? 0;
  const isReview = progressPercent >= 100;
  const isLocked = currentPathItem?.isLocked ?? false;
  const nextCourse = learningPath[courseIndex + 1]?.course ?? null;
  const unmetPrerequisites = currentPathItem?.prerequisites.filter((prerequisite) => !prerequisite.satisfied) ?? [];
  const contextBlock = course.blocks.find((block) => block.type === "heading" || block.type === "text");
  const contextText = contextBlock && "body" in contextBlock ? contextBlock.body : course.description;
  const acceptedExtensions = getAcceptedExtensions(course);
  const acceptAttribute = getAcceptAttribute(acceptedExtensions);
  const validationRules = [
    ...(course.rpaConfig?.validationRules.filter((rule) => rule.enabled !== false).map((rule) => ({ label: rule.label ?? rule.type, detail: rule.description ?? rule.value, severity: rule.severity })) ?? []),
    ...(course.rpaConfig?.pythonRules.filter((rule) => rule.enabled).map((rule) => ({ label: rule.label, detail: rule.description, severity: rule.severity })) ?? []),
  ];
  const blockingRules = validationRules.filter((rule) => rule.severity === "blocking").length;
  const resources = course.rpaConfig?.resources ?? [];
  const currentAttempt = evaluationHistory[0] ?? null;
  const previousAttempt = evaluationHistory[1] ?? null;
  const courseView = (searchParams.get("view") === "before" || searchParams.get("view") === "after" ? searchParams.get("view") : "work") as CourseViewMode;
  const latestSubmissionState = currentAttempt?.final.status === "pass" ? "validated" : currentAttempt?.final.status === "fail" ? "refused" : currentAttempt ? "submitted" : null;
  const deliverables = course.blocks
    .filter((block) => block.type === "deliverable" || block.type === "checkpoint" || block.type === "attachment")
    .map((block) => "body" in block ? block.body : "fileName" in block ? `${block.fileName} (${block.fileType})` : block.title);
  const antiPatterns = (course.rpaConfig?.antiPatterns ?? []).filter((pattern) => pattern.enabled).map((pattern) => pattern.label).slice(0, 4);
  const sidebarSteps = learningPath.map((item) => ({
    id: item.course.id,
    label: item.course.name,
    number: item.index + 1,
    status: item.course.id === course.id ? "active" : item.isCompleted ? "completed" : item.isLocked ? "locked" : "available",
  }));

  useEffect(() => {
    if (isReview) setAiState("success");
  }, [isReview]);

  useEffect(() => {
    const persisted = getCourseSubmissionHistory(course.id, user?.id ?? "").map((record) => ({
      id: record.id,
      mode: record.mode,
      createdAt: record.submittedAt,
      ai: record.ai,
      python: record.python,
      final: record.final,
      criteria: record.criteria,
    }));
    if (persisted.length) setEvaluationHistory(persisted);
  }, [course.id, user?.id]);

  const canSubmit = repoUrl.trim() !== "" && uploadedFile !== null && checklist.structure && checklist.activities && aiState !== "analyzing";
  const formatSession = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const navTargets: Record<NavSectionId, React.RefObject<HTMLDivElement | null>> = { context: contextRef, rules: rulesRef, resources: resourcesRef, submission: submissionRef };
  const goToSection = (section: NavSectionId) => { setActiveNav(section); navTargets[section].current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const setCourseView = (view: CourseViewMode) => {
    const next = new URLSearchParams(searchParams);
    if (view === "work") next.delete("view");
    else next.set("view", view);
    setSearchParams(next, { replace: true });
  };

  const runEvaluation = (mode: EvaluationMode) => {
    if (!canSubmit) {
      setSubmitAttempted(true);
      addNotification({ kind: "warning", category: "submission", title: "Soumission incomplete", message: "Renseignez le depot, le package et la checklist avant de lancer l'analyse IA.", href: `/cours/${course.id}` });
      return;
    }
    setSubmitAttempted(false);
    setAiState("analyzing");
    const nextFullAttemptNumber = mode === "full" ? submissionAttempts + 1 : submissionAttempts;
    if (mode === "full") setSubmissionAttempts((value) => value + 1);
    window.setTimeout(() => {
      const nextAttempt = buildEvaluationAttempt(course, mode, evaluationHistory[0] ?? null, nextFullAttemptNumber);
      setEvaluationHistory((previous) => [nextAttempt, ...previous].slice(0, 6));
      setCourseView("after");
      recordCourseSubmissionAttempt({
        courseId: course.id,
        courseName: course.name,
        userId: user?.id ?? "anonymous",
        workspaceId: course.workspaceId,
        mode,
        outcome: nextAttempt.final.status === "pass" ? "validated" : nextAttempt.final.status === "fail" ? "refused" : "submitted",
        score: nextAttempt.final.score,
        repoUrl,
        fileName: uploadedFile ?? "",
        ai: nextAttempt.ai,
        python: nextAttempt.python,
        final: nextAttempt.final,
        criteria: nextAttempt.criteria,
      });
      const isSuccess = nextAttempt.final.status === "pass";
      setAiState(isSuccess ? "success" : "failed");
      if (isSuccess) {
        updateCourseProgress(course.id, (current) => ({ ...current, currentBlockId: "submission", completedBlockIds: ["submission"], progressPercent: 100, lastVisitedAt: new Date().toISOString() }), user?.id ?? "");
        addNotification({ kind: "success", category: "submission", title: "Cours valide", message: `${course.name} est complete et le parcours peut avancer.`, href: "/" });
        return;
      }
      updateCourseProgress(course.id, (current) => ({ ...current, currentBlockId: "submission", progressPercent: Math.max(current.progressPercent, 35), lastVisitedAt: new Date().toISOString() }), user?.id ?? "");
    }, 2200);
  };

  const handleFileSelection = (file?: File | null) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!acceptedExtensions.includes(extension)) {
      addNotification({
        kind: "error",
        category: "submission",
        title: "Format non autorise",
        message: `Formats attendus : ${acceptedExtensions.map((item) => `.${item}`).join(", ")}.`,
        href: `/cours/${course.id}`,
      });
      return;
    }
    setUploadedFile(file.name);
  };

  if (isLocked) {
    return <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "#F4F6F8" }}><div className="max-w-md text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl" style={{ backgroundColor: "#F3F4F6" }}><Lock size={34} color="#9CA3AF" /></div><h2 className="mt-5" style={{ color: "#111827", fontWeight: 800, fontSize: "1.3rem" }}>Projet verrouille</h2><p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.7 }}>{course.name} attend encore {unmetPrerequisites.map((prerequisite) => prerequisite.type === "course_completed" ? prerequisite.courseName : prerequisite.quizTitle ?? prerequisite.courseName).join(" et ")}.</p><Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}><ArrowLeft size={14} /> Retour au parcours</Link></div></div>;
  }

  return (
    <div className={focusMode ? "min-h-screen" : "min-h-screen xl:flex"} style={{ backgroundColor: "#F4F6F8" }}>
      <aside className={focusMode || courseView !== "work" ? "hidden" : "hidden w-64 shrink-0 border-r xl:flex xl:flex-col"} style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <div className="p-5">
          <Link to="/" className="mb-6 flex items-center gap-2 text-sm" style={{ color: "#6B7280", fontWeight: 600 }}><ArrowLeft size={14} /> Tableau de bord</Link>
          <p className="mb-3 text-xs uppercase tracking-[0.18em]" style={{ color: "#9CA3AF", fontWeight: 700 }}>Etape {courseIndex + 1} sur {workspaceCourses.length}</p>
          <div className="space-y-1.5">
            {sidebarSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-2 rounded-xl px-2 py-2" style={{ backgroundColor: step.status === "active" ? "#EFF6FF" : "transparent" }}>
                <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: step.status === "completed" ? "#D1FAE5" : step.status === "active" ? "#005EFA" : step.status === "available" ? "#DBEAFE" : "#F3F4F6" }}>{step.status === "completed" ? <CheckCircle2 size={11} color="#00A05A" /> : step.status === "active" ? <span style={{ color: "#FFFFFF", fontSize: 9, fontWeight: 800 }}>{step.number}</span> : step.status === "available" ? <PlayCircle size={10} color="#1D4ED8" /> : <Lock size={9} color="#D1D5DB" />}</div>
                <span className="truncate text-xs" style={{ color: step.status === "active" ? "#005EFA" : step.status === "completed" ? "#374151" : step.status === "available" ? "#1D4ED8" : "#9CA3AF", fontWeight: step.status === "active" ? 700 : 500 }}>{step.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t pt-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="mb-3 text-xs uppercase tracking-[0.18em]" style={{ color: "#9CA3AF", fontWeight: 700 }}>Navigation rapide</p>
            {([{ id: "context", label: "Contexte" }, { id: "rules", label: "Regles metier" }, { id: "resources", label: "Ressources" }, { id: "submission", label: "Soumission" }] as { id: NavSectionId; label: string }[]).map((item) => (
              <button key={item.id} onClick={() => goToSection(item.id)} className="mb-2 flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm" style={{ backgroundColor: activeNav === item.id ? "#EFF6FF" : "#FFFFFF", color: activeNav === item.id ? "#005EFA" : "#374151", border: `1px solid ${activeNav === item.id ? "#BFDBFE" : "#E5E7EB"}`, fontWeight: 700 }}>{item.label}<ArrowRight size={13} /></button>
            ))}
          </div>
          {FEATURE_FLAGS.ide && <Link to={`/ide/${courseIndex + 1}`} className="mt-4 flex items-center gap-2 rounded-2xl px-3 py-3 text-sm" style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", fontWeight: 700 }}><Code2 size={14} /> Ouvrir l'IDE</Link>}
          <button onClick={() => setShowHelp((value) => !value)} className="mt-3 flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-sm" style={{ backgroundColor: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA", fontWeight: 700 }}><HelpCircle size={14} /> Aide & FAQ</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#F3F4F6" }}>
          <div className="min-w-0"><p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Projet {courseIndex + 1}</p><h1 className="truncate" style={{ color: "#111827", fontWeight: 800, fontSize: "1.1rem" }}>{course.name}</h1></div>
          <div className="flex flex-wrap items-center gap-2">
            {(["before", "work", "after"] as CourseViewMode[]).map((view) => (
              <button key={view} type="button" onClick={() => setCourseView(view)} className="rounded-full px-3 py-2 text-xs" style={{ backgroundColor: courseView === view ? "#DBEAFE" : "#F3F4F6", color: courseView === view ? "#1D4ED8" : "#374151", fontWeight: 700 }}>
                {view === "before" ? "Avant" : view === "after" ? "Apres" : "Detail"}
              </button>
            ))}
            <button type="button" onClick={() => setFocusMode((value) => !value)} className="rounded-full px-3 py-2 text-xs" style={{ backgroundColor: focusMode ? "#111827" : "#F3F4F6", color: focusMode ? "#FFFFFF" : "#374151", fontWeight: 700 }}>
              {focusMode ? "Quitter le focus" : "Mode focus"}
            </button>
            {!isReview ? <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "#0A1628", border: "1px solid rgba(0,94,250,0.3)" }}><div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#F59E0B" }} /><Timer size={12} color="#94A3B8" /><span className="text-xs" style={{ color: "#F59E0B", fontFamily: "monospace", fontWeight: 800 }}>{formatSession(sessionSeconds)}</span><span className="hidden text-xs sm:inline" style={{ color: "#94A3B8" }}>session</span></div> : <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#D1FAE5", color: "#166534", fontWeight: 700 }}>Revision</span>}
          </div>
        </div>

        <div className={focusMode || courseView !== "work" ? "hidden" : "border-b px-4 py-3 xl:hidden"} style={{ backgroundColor: "#FFFFFF", borderColor: "#F3F4F6" }}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sidebarSteps.map((step) => (
              <button
                key={`mobile-step-${step.id}`}
                type="button"
                onClick={() => navigate(`/cours/${step.id}`)}
                className="whitespace-nowrap rounded-full px-3 py-2 text-xs"
                style={{
                  backgroundColor: step.status === "active" ? "#DBEAFE" : step.status === "completed" ? "#D1FAE5" : "#F3F4F6",
                  color: step.status === "active" ? "#1D4ED8" : step.status === "completed" ? "#166534" : "#6B7280",
                  fontWeight: 700,
                }}
              >
                P{step.number} · {step.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {([{ id: "context", label: "Contexte" }, { id: "rules", label: "Regles" }, { id: "resources", label: "Ressources" }, { id: "submission", label: "Soumission" }] as { id: NavSectionId; label: string }[]).map((item) => (
              <button key={`mobile-nav-${item.id}`} type="button" onClick={() => goToSection(item.id)} className="whitespace-nowrap rounded-full px-3 py-2 text-xs" style={{ backgroundColor: activeNav === item.id ? "#EFF6FF" : "#F3F4F6", color: activeNav === item.id ? "#005EFA" : "#374151", fontWeight: 700 }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`mx-auto ${focusMode ? "max-w-4xl" : "max-w-6xl"} px-4 py-6 md:px-6 lg:py-8`}>
          <div className="rounded-[28px] p-6" style={{ backgroundColor: "#FFFFFF", border: `2px solid ${isReview ? "#00A05A" : "#005EFA"}` }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: isReview ? "#D1FAE5" : "#FEF3C7", color: isReview ? "#166534" : "#92400E", fontWeight: 700 }}>{isReview ? "Complete" : "En cours"}</span>
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>Etape {courseIndex + 1} / {workspaceCourses.length}</span>
                </div>
                <h2 className="mt-4" style={{ color: "#111827", fontWeight: 800, fontSize: "1.95rem", lineHeight: 1.15 }}>Cours {courseIndex + 1} : {course.name}</h2>
                <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}><Clock size={14} /> Duree estimee : {course.duration}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => toggleFavorite({ id: `course:${course.id}`, type: "course", label: course.name, href: `/cours/${course.id}` })} className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: favorite ? "#FFF7ED" : "#F3F4F6", color: favorite ? "#9A3412" : "#6B7280", fontWeight: 800 }}>
                  {favorite ? "Favori" : "Ajouter aux favoris"}
                </button>
                {course.tags.map((tag) => <span key={tag} className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F0F9FF", color: "#0369A1", fontWeight: 700 }}>{tag}</span>)}
              </div>
            </div>
          </div>

          {showHelp && <div className="mt-6 rounded-[26px] p-5" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}><p style={{ color: "#9A3412", fontWeight: 700 }}>Aide rapide</p><p className="mt-2 text-sm" style={{ color: "#C2410C", lineHeight: 1.65 }}>Commencez par les ressources, verifiez les regles bloquantes puis soumettez avec un depot et un package propres.</p></div>}

          {courseView === "before" && (
            <BeforeStartPanel
              course={course}
              contextText={contextText}
              deliverables={deliverables.length ? deliverables : ["Consulter les ressources, produire le livrable principal et respecter le schema de sortie attendu."]}
              blockingRules={blockingRules}
              antiPatterns={antiPatterns}
              onStart={() => setCourseView("work")}
            />
          )}

          {courseView === "after" && (
            <AfterSubmissionPanel
              attempt={currentAttempt}
              course={course}
              nextCourse={nextCourse}
              onBackToWork={() => setCourseView("work")}
            />
          )}

          {courseView === "work" && (
            <>
          <section ref={contextRef} className="mt-8">
            <div className="mb-4 flex items-center gap-2"><AlertTriangle size={17} color="#005EFA" /><h2 style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}>Contexte metier</h2></div>
            <div className="rounded-[26px] p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
              <p className="text-sm" style={{ color: "#374151", lineHeight: 1.8 }}>{contextText}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-full px-4 py-2 text-sm" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB", color: "#374151" }}>Perimetre : <strong>{course.workspaceName}</strong></div>
                <div className="rounded-full px-4 py-2 text-sm" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB", color: "#374151" }}>Duree estimee : <strong>{course.duration}</strong></div>
                <div className="rounded-full px-4 py-2 text-sm" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB", color: "#374151" }}>Objectif : <strong>Automatisation complete</strong></div>
              </div>
            </div>
          </section>

          <section ref={rulesRef} className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Shield size={17} color="#7C3AED" /><h2 style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}>Regles de validation IA</h2></div><span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", fontWeight: 700 }}>{blockingRules} bloquantes</span></div>
            <div className="space-y-3">{validationRules.map((rule) => <div key={`${rule.label}-${rule.detail}`} className="flex items-start gap-3 rounded-[24px] p-4" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${rule.severity === "blocking" ? "#FECACA" : "#FDE68A"}` }}><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: rule.severity === "blocking" ? "#FEE2E2" : "#FEF3C7" }}>{rule.severity === "blocking" ? <Shield size={13} color="#DC2626" /> : <AlertTriangle size={13} color="#D97706" />}</div><div className="flex-1"><p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{rule.label}</p><p className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.6 }}>{rule.detail}</p></div><span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: rule.severity === "blocking" ? "#FEE2E2" : "#FEF3C7", color: rule.severity === "blocking" ? "#B91C1C" : "#92400E", fontWeight: 700 }}>{rule.severity === "blocking" ? "Bloquant" : "Warning"}</span></div>)}</div>
          </section>

          <section ref={resourcesRef} className="mt-8">
            <div className="mb-4 flex items-center gap-2"><BookOpen size={17} color="#00A05A" /><h2 style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}>Ressources pedagogiques</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{resources.map((resource) => <button key={`${resource.id}-${resource.name}`} type="button" onClick={() => { downloadCourseResource(course, resource); addNotification({ kind: "success", category: "course", title: "Ressource telechargee", message: `${resource.name} a ete preparee localement pour le prototype.`, href: `/cours/${course.id}` }); }} className="flex items-center gap-3 rounded-[24px] p-4 text-left" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#F9FAFB" }}><ResourceIcon type={resource.type} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm" style={{ color: "#111827", fontWeight: 700 }}>{resource.name}</p><p className="text-xs" style={{ color: "#9CA3AF" }}>{resource.url || "Ressource a raccorder"}</p></div><span className="rounded-lg px-2 py-1 text-xs" style={{ backgroundColor: "#F3F4F6", color: "#4B5563", fontWeight: 700 }}>{resource.type}</span></button>)}</div>
          </section>

          <section className="mt-8">
            <OutputDiffPanel course={course} attempt={currentAttempt} uploadedFile={uploadedFile} />
          </section>

          <section ref={submissionRef} className="mt-8">
            <div className="mb-4 flex items-center gap-2"><Upload size={17} color="#374151" /><h2 style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}>Soumission</h2></div>
            {!isReview && <>
              <div className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>Ce qu'il vous manque pour valider</p>
                    <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>
                      Etat courant : {latestSubmissionState === "validated" ? "valide" : latestSubmissionState === "refused" ? "refuse" : latestSubmissionState === "submitted" ? "soumis" : progressPercent > 0 ? "en cours" : "pas commence"}.
                    </p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: latestSubmissionState === "validated" ? "#D1FAE5" : latestSubmissionState === "refused" ? "#FEE2E2" : "#EFF6FF", color: latestSubmissionState === "validated" ? "#166534" : latestSubmissionState === "refused" ? "#B91C1C" : "#1D4ED8", fontWeight: 700 }}>
                    {latestSubmissionState === "validated" ? "Valide" : latestSubmissionState === "refused" ? "Refuse" : latestSubmissionState === "submitted" ? "Soumis" : progressPercent > 0 ? "En cours" : "Pas commence"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    { ok: repoUrl.trim() !== "", label: "Renseigner l'URL du depot" },
                    { ok: uploadedFile !== null, label: `Fournir le fichier principal (${course.rpaConfig?.submissionPolicy.primaryFileType ?? "nupkg"})` },
                    { ok: checklist.structure, label: "Valider la structure attendue" },
                    { ok: checklist.activities, label: "Confirmer les garde-fous techniques" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 rounded-2xl px-3 py-3" style={{ backgroundColor: item.ok ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${item.ok ? "#BBF7D0" : "#FECACA"}` }}>
                      {item.ok ? <CheckCircle2 size={14} color="#00A05A" /> : <AlertTriangle size={14} color="#DC2626" />}
                      <span className="text-sm" style={{ color: item.ok ? "#166534" : "#B91C1C", fontWeight: 700 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <p className="mb-4 text-sm" style={{ color: "#374151", fontWeight: 700 }}>Avant de soumettre, verifiez :</p>
                {[{ key: "structure", label: `Structure ${validationRules[0]?.label ?? "attendue"} respectee` }, { key: "activities", label: "Limite d'activites respectee (max 50 par XAML)" }].map(({ key, label }) => <label key={key} className="mb-3 flex items-center gap-3"><div onClick={() => setChecklist((previous) => ({ ...previous, [key]: !previous[key as keyof typeof previous] }))} className="flex h-5 w-5 items-center justify-center rounded" style={{ backgroundColor: checklist[key as keyof typeof checklist] ? "#005EFA" : "#F9FAFB", border: `2px solid ${checklist[key as keyof typeof checklist] ? "#005EFA" : "#D1D5DB"}` }}>{checklist[key as keyof typeof checklist] && <CheckSquare size={12} color="#FFFFFF" />}</div><span className="text-sm" style={{ color: "#374151" }}>{label}</span></label>)}
                {submitAttempted && (!checklist.structure || !checklist.activities) && <p className="text-xs" style={{ color: "#B91C1C", fontWeight: 700 }}>Cochez tous les pre-requis avant de soumettre.</p>}
              </div>

              <div className="mt-4 rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <label htmlFor="course-repo-url" className="block text-sm" style={{ color: "#374151", fontWeight: 700 }}>URL du depot UiPath Orchestrator</label>
                <input id="course-repo-url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://cloud.uipath.com/.../packages" aria-invalid={submitAttempted && repoUrl.trim() === ""} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${submitAttempted && repoUrl.trim() === "" ? "#DC2626" : repoUrl ? "#005EFA" : "#E5E7EB"}`, backgroundColor: "#F9FAFB", color: "#111827" }} />
              </div>

              <div className="mt-4 rounded-[24px]" style={{ backgroundColor: "#FFFFFF", border: `2px dashed ${isDragging ? "#005EFA" : uploadedFile ? "#00A05A" : "#D1D5DB"}` }} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleFileSelection(event.dataTransfer.files[0]); }}>
                {uploadedFile ? <div className="flex items-center gap-3 p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "#D1FAE5" }}><CheckCircle2 size={20} color="#00A05A" /></div><div className="flex-1"><p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{uploadedFile}</p><p className="text-xs" style={{ color: "#9CA3AF" }}>Fichier pret pour soumission</p></div><button type="button" onClick={() => setUploadedFile(null)} className="rounded-xl px-2 py-1" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}><X size={12} /></button></div> : <div className="flex cursor-pointer flex-col items-center gap-2 p-8 text-center" onClick={() => fileInputRef.current?.click()}><Upload size={24} color={isDragging ? "#005EFA" : "#9CA3AF"} /><p className="text-sm" style={{ color: "#374151", fontWeight: 700 }}>Glissez votre fichier {acceptedExtensions.map((item) => `.${item}`).join(", ")} ou cliquez</p><p className="text-xs" style={{ color: "#9CA3AF" }}>Formats autorises : {acceptedExtensions.map((item) => `.${item}`).join(", ")} - max 50 MB</p><input ref={fileInputRef} type="file" accept={acceptAttribute} className="hidden" onChange={(event) => handleFileSelection(event.target.files?.[0])} /></div>}
              </div>

              <button onClick={() => runEvaluation("full")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm" style={{ backgroundColor: canSubmit ? "#005EFA" : "#E5E7EB", color: canSubmit ? "#FFFFFF" : "#9CA3AF", fontWeight: 700 }}><Bot size={16} /> Lancer la validation IA</button>
              <div className="mt-5"><EvaluationPanel attempt={currentAttempt} previousAttempt={previousAttempt} isAnalyzing={aiState === "analyzing"} onRetry={() => { setAiState("idle"); setRepoUrl(""); setUploadedFile(null); setChecklist({ structure: false, activities: false }); setSubmitAttempted(false); setCourseView("work"); }} onRerunPython={() => runEvaluation("python_rerun")} onSecondAiRead={() => runEvaluation("ai_second_pass")} onNext={() => navigate(nextCourse ? `/cours/${nextCourse.id}` : "/")} nextLabel={nextCourse ? `Projet ${courseIndex + 2}` : "la certification"} canRerunPython={course.rpaConfig?.correctionSettings?.allowPythonRerun ?? true} canSecondAiRead={course.rpaConfig?.correctionSettings?.allowSecondAiRead ?? true} /></div>
            </>}

            {isReview && <div className="rounded-[24px] p-5" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "#D1FAE5" }}><Trophy size={24} color="#00A05A" /></div><div><p style={{ color: "#166534", fontWeight: 700 }}>Validation finale accordee</p><p className="mt-1 text-xs" style={{ color: "#15803D" }}>Le projet est valide et le parcours peut avancer.</p></div></div></div>}
          </section>

          {isReview && <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/" className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}><ArrowLeft size={14} /> Retour au parcours</Link><Link to={nextCourse ? `/cours/${nextCourse.id}` : "/"} className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>{nextCourse ? `Continuer vers le projet ${courseIndex + 2}` : "Retour a la certification"}<ArrowRight size={14} /></Link></div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
