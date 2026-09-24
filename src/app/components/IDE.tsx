import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Code2,
  Copy,
  Lightbulb,
  Play,
  RotateCcw,
  Save,
  Terminal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { APP_NAME } from "../config/appConfig";
import {
  addNotification,
  getIdeSession,
  recordIdeRun,
  resetIdeSession,
  saveIdeDraft,
  useAcademyStore,
} from "../data/academyStore";

type ConsoleEntry = { type: "output" | "error" | "info" | "run"; text: string };

const HINTS = [
  "Utilisez Trim() pour nettoyer les espaces au debut et a la fin.",
  "Replace() peut servir a normaliser les caracteres speciaux.",
  "Retournez explicitement la valeur finale avec Return.",
  "Verifiez que les logs sont suffisamment explicites pour la validation IA.",
];

const EXERCISES = [
  { id: 1, title: "Nettoyage de reference", difficulty: "Facile", validator: ["Trim(", "Return"] },
  { id: 2, title: "Validation de format", difficulty: "Moyen", validator: ["If", "Else", "Return"] },
  { id: 3, title: "Extraction de donnees", difficulty: "Difficile", validator: ["Replace(", "For Each", "Return"] },
];

const INITIAL_CODE: Record<number, string> = {
  1: `' Exercice 1
Module CleanReference
  Function CleanContractRef(input As String) As String
    Dim result As String = Trim(input)
    result = Replace(result, "--", "-")
    Return result.ToUpper()
  End Function
End Module`,
  2: `' Exercice 2
Module ValidateReference
  Function IsValidReference(input As String) As Boolean
    If String.IsNullOrWhiteSpace(input) Then
      Return False
    Else
      Return input.StartsWith("CTR-")
    End If
  End Function
End Module`,
  3: `' Exercice 3
Module ExtractReference
  Function ExtractData(input As String) As String
    Dim cleaned As String = Replace(input, "#", "")
    For Each item As Char In cleaned
    Next
    Return cleaned
  End Function
End Module`,
};

function getDefaultConsole(): ConsoleEntry[] {
  return [
    { type: "info", text: `${APP_NAME} - session locale restauree automatiquement.` },
    { type: "info", text: "Lancez les tests pour verifier votre progression." },
  ];
}

function asText(entries: ConsoleEntry[]) {
  return entries.map((entry) => `${entry.type.toUpperCase()}: ${entry.text}`);
}

export function IDE() {
  useAcademyStore();
  const navigate = useNavigate();
  const { exerciceId } = useParams<{ exerciceId: string }>();
  const projectId = Number(exerciceId ?? "1");

  const initialSessions = useMemo(() => EXERCISES.map((exercise) => getIdeSession(projectId, exercise.id)), [projectId]);
  const [activeExerciseId, setActiveExerciseId] = useState(1);
  const [code, setCode] = useState(initialSessions[0]?.code ?? INITIAL_CODE[1]);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleEntry[]>(() => {
    const existing = initialSessions[0]?.consoleOutput;
    return existing?.length ? existing.map((text) => ({ type: "info", text })) : getDefaultConsole();
  });
  const [hintIndex, setHintIndex] = useState(initialSessions[0]?.hintIndex ?? -1);
  const [showHint, setShowHint] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [savedTick, setSavedTick] = useState(Date.now());
  const consoleRef = useRef<HTMLDivElement>(null);
  const activeExercise = EXERCISES.find((exercise) => exercise.id === activeExerciseId) ?? EXERCISES[0];

  const sessions = useMemo(() => EXERCISES.map((exercise) => getIdeSession(projectId, exercise.id)), [projectId, savedTick]);
  const completedExercises = sessions.filter((session) => session?.completed).length;
  const activeSession = getIdeSession(projectId, activeExerciseId);

  useEffect(() => {
    const nextSession = getIdeSession(projectId, activeExerciseId);
    setCode(nextSession?.code ?? INITIAL_CODE[activeExerciseId]);
    setHintIndex(nextSession?.hintIndex ?? -1);
    setConsoleOutput(nextSession?.consoleOutput?.length ? nextSession.consoleOutput.map((text) => ({ type: "info", text })) : getDefaultConsole());
  }, [activeExerciseId, projectId, savedTick]);

  useEffect(() => {
    if (!consoleRef.current) return;
    consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [consoleOutput]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      saveIdeDraft(projectId, activeExerciseId, {
        code,
        hintIndex,
        consoleOutput: asText(consoleOutput),
      });
      setSavedTick(Date.now());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [activeExerciseId, code, consoleOutput, hintIndex, projectId]);

  const runCode = () => {
    setIsRunning(true);
    setConsoleOutput((previous) => [...previous, { type: "run", text: `Run ${new Date().toLocaleTimeString("fr-FR")}` }]);

    window.setTimeout(() => {
      const passedChecks = activeExercise.validator.filter((token) => code.includes(token));
      const passed = passedChecks.length === activeExercise.validator.length;
      const summary = passed
        ? `Tests passes (${passedChecks.length}/${activeExercise.validator.length}) sur ${activeExercise.title}.`
        : `Tests en echec (${passedChecks.length}/${activeExercise.validator.length}) sur ${activeExercise.title}.`;

      const nextEntries: ConsoleEntry[] = passed
        ? [
          { type: "output", text: "Compilation reussie - 0 erreur bloquante." },
          { type: "output", text: `Validation metier OK pour ${activeExercise.title}.` },
          { type: "output", text: `Tous les tests sont passes (${passedChecks.length}/${activeExercise.validator.length}).` },
        ]
        : [
          { type: "error", text: `Des controles sont encore manquants : ${activeExercise.validator.filter((token) => !code.includes(token)).join(", ")}` },
          { type: "error", text: "Corrigez puis relancez les tests." },
        ];

      setConsoleOutput((previous) => [...previous, ...nextEntries]);
      recordIdeRun(projectId, activeExerciseId, {
        status: passed ? "passed" : "failed",
        passedTests: passedChecks.length,
        totalTests: activeExercise.validator.length,
        summary,
        ranAt: new Date().toISOString(),
      }, code, hintIndex, asText([...consoleOutput, ...nextEntries]));
      setSavedTick(Date.now());
      setIsRunning(false);

      addNotification({
        kind: passed ? "success" : "warning",
        category: "submission",
        title: passed ? "Tests IDE passes" : "Tests IDE a corriger",
        message: `${activeExercise.title} : ${passedChecks.length}/${activeExercise.validator.length} controles valides.`,
        href: `/ide/${projectId}`,
      });
    }, 1200);
  };

  const cycleHint = () => {
    const nextIndex = (hintIndex + 1) % HINTS.length;
    setHintIndex(nextIndex);
    setShowHint(true);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      addNotification({
        kind: "info",
        category: "course",
        title: "Code copie",
        message: "Le contenu de l'exercice a ete copie dans le presse-papiers.",
        href: `/ide/${projectId}`,
      });
    } catch {
      addNotification({
        kind: "warning",
        category: "course",
        title: "Copie impossible",
        message: "Le presse-papiers n'est pas accessible dans ce contexte.",
        href: `/ide/${projectId}`,
      });
    }
  };

  const resetExercise = () => {
    resetIdeSession(projectId, activeExerciseId);
    setCode(INITIAL_CODE[activeExerciseId]);
    setConsoleOutput(getDefaultConsole());
    setHintIndex(-1);
    setShowHint(false);
    setSavedTick(Date.now());
  };

  return (
    <div className="flex h-screen flex-col" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#0F172A" }}>
      <div className="flex items-center gap-3 border-b px-4 py-3" style={{ backgroundColor: "#111827", borderColor: "#1F2937" }}>
        <Link to={`/projet/${projectId}`} className="flex items-center gap-2 text-xs" style={{ color: "#94A3B8", fontWeight: 700 }}>
          <ArrowLeft size={13} />
          Retour au projet
        </Link>
        <div className="h-4 w-px" style={{ backgroundColor: "#334155" }} />
        <Code2 size={14} color="#A78BFA" />
        <span className="text-sm" style={{ color: "#E2E8F0", fontWeight: 700 }}>
          {APP_NAME} - Projet {projectId}
        </span>
        <span className="ml-auto rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "rgba(0,160,90,0.16)", color: "#6EE7B7", fontWeight: 700 }}>
          {completedExercises}/{EXERCISES.length} exercices valides
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 overflow-y-auto border-r p-4" style={{ backgroundColor: "#111827", borderColor: "#1F2937" }}>
          <div className="rounded-[22px] p-4" style={{ backgroundColor: "#0B1220", border: "1px solid #1F2937" }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "#64748B", fontWeight: 800 }}>Progression</p>
            <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: "#1F2937" }}>
              <div className="h-2 rounded-full" style={{ width: `${(completedExercises / EXERCISES.length) * 100}%`, background: "linear-gradient(90deg, #005EFA 0%, #34D399 100%)" }} />
            </div>
            <p className="mt-3 text-xs" style={{ color: "#94A3B8", lineHeight: 1.6 }}>
              Votre code, vos indices et votre dernier resultat de test sont sauvegardes automatiquement.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {EXERCISES.map((exercise) => {
              const session = sessions.find((item) => item?.exerciseId === exercise.id);
              return (
                <button
                  key={exercise.id}
                  onClick={() => setActiveExerciseId(exercise.id)}
                  className="w-full rounded-[20px] p-4 text-left"
                  style={{ backgroundColor: exercise.id === activeExerciseId ? "#1E293B" : "#0B1220", border: `1px solid ${exercise.id === activeExerciseId ? "#3B82F6" : "#1F2937"}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm" style={{ color: "#F8FAFC", fontWeight: 700 }}>{exercise.title}</p>
                      <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>{exercise.difficulty}</p>
                    </div>
                    {session?.completed ? <CheckCircle2 size={16} color="#22C55E" /> : <Code2 size={16} color="#60A5FA" />}
                  </div>
                  <p className="mt-3 text-xs" style={{ color: "#64748B" }}>
                    {session?.lastRun ? `${session.lastRun.passedTests}/${session.lastRun.totalTests} tests` : "Aucun test lance"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-[22px] p-4" style={{ backgroundColor: "#0B1220", border: "1px solid #1F2937" }}>
            <div className="flex items-center gap-2">
              <Lightbulb size={14} color="#FBBF24" />
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "#FBBF24", fontWeight: 800 }}>Indice</p>
            </div>
            <p className="mt-3 text-sm" style={{ color: "#E2E8F0", fontWeight: 700 }}>{activeExercise.title}</p>
            <button onClick={cycleHint} className="mt-3 w-full rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#2D1B69", color: "#C4B5FD", fontWeight: 700 }}>
              Afficher un indice
            </button>
            {showHint && hintIndex >= 0 && (
              <p className="mt-3 text-xs" style={{ color: "#C4B5FD", lineHeight: 1.65 }}>{HINTS[hintIndex]}</p>
            )}
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-3" style={{ backgroundColor: "#0B1220", borderColor: "#1F2937" }}>
            <span className="text-xs" style={{ color: "#94A3B8", fontWeight: 700 }}>{activeExercise.title}</span>
            <span className="ml-auto text-xs" style={{ color: "#64748B" }}>
              Derniere sauvegarde : {activeSession?.updatedAt ? formatTimeAgo(activeSession.updatedAt) : "en attente"}
            </span>
            <button onClick={copyCode} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#111827", color: "#E2E8F0", fontWeight: 700 }}>
              <Copy size={12} className="inline mr-1" />
              Copier
            </button>
            <button onClick={resetExercise} className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#111827", color: "#E2E8F0", fontWeight: 700 }}>
              <RotateCcw size={12} className="inline mr-1" />
              Reinitialiser
            </button>
          </div>

          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
            className="flex-1 resize-none border-0 px-5 py-5 outline-none"
            style={{ backgroundColor: "#0F172A", color: "#E2E8F0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "0.85rem", lineHeight: 1.7 }}
          />

          <div className="border-t px-4 py-3" style={{ backgroundColor: "#0B1220", borderColor: "#1F2937" }}>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={runCode} disabled={isRunning} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: isRunning ? "#14532D" : "#00A05A", color: "#FFFFFF", fontWeight: 700 }}>
                <Play size={13} className="mr-2 inline" />
                {isRunning ? "Execution..." : "Executer les tests"}
              </button>
              <button onClick={() => saveIdeDraft(projectId, activeExerciseId, { code, hintIndex, consoleOutput: asText(consoleOutput) })} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#111827", color: "#E2E8F0", fontWeight: 700 }}>
                <Save size={13} className="mr-2 inline" />
                Sauvegarder
              </button>
              <button onClick={() => navigate(`/projet/${projectId}`)} className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#1E293B", color: "#E2E8F0", fontWeight: 700 }}>
                Revenir au projet
              </button>
            </div>
            {activeSession?.lastRun && (
              <div className="mt-3 rounded-2xl p-3" style={{ backgroundColor: activeSession.lastRun.status === "passed" ? "#052E16" : "#450A0A", border: `1px solid ${activeSession.lastRun.status === "passed" ? "#166534" : "#7F1D1D"}` }}>
                <p className="text-xs" style={{ color: activeSession.lastRun.status === "passed" ? "#6EE7B7" : "#FCA5A5", fontWeight: 700 }}>
                  Dernier test : {activeSession.lastRun.passedTests}/{activeSession.lastRun.totalTests} controles
                </p>
                <p className="mt-1 text-xs" style={{ color: activeSession.lastRun.status === "passed" ? "#D1FAE5" : "#FECACA", lineHeight: 1.55 }}>
                  {activeSession.lastRun.summary}
                </p>
              </div>
            )}
          </div>

          <div className="flex h-64 flex-col border-t" style={{ backgroundColor: "#020617", borderColor: "#1F2937" }}>
            <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "#1F2937" }}>
              <Terminal size={13} color="#4ADE80" />
              <span className="text-xs" style={{ color: "#8B949E", fontWeight: 700 }}>CONSOLE OUTPUT</span>
            </div>
            <div ref={consoleRef} className="flex-1 overflow-y-auto px-4 py-3">
              {consoleOutput.map((entry, index) => (
                <div key={`${entry.type}-${index}`} className="mb-2 flex items-start gap-2">
                  {entry.type === "error" && <AlertCircle size={12} color="#F87171" className="mt-0.5 shrink-0" />}
                  {entry.type === "output" && <CheckCircle2 size={12} color="#4ADE80" className="mt-0.5 shrink-0" />}
                  <pre style={{ color: entry.type === "error" ? "#F87171" : entry.type === "run" ? "#A78BFA" : entry.type === "info" ? "#93C5FD" : "#E2E8F0", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {entry.text}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}
