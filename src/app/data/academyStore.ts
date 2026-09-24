import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { Project } from "./projectsData";

const STORAGE_KEY = "lyreco_academy_state_v1";
const STORE_EVENT = "lyreco-academy-store-update";

export type NotificationKind = "info" | "success" | "warning" | "error";
export type NotificationCategory = "system" | "submission" | "mentoring" | "course" | "admin";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  category: NotificationCategory;
  title: string;
  message: string;
  href?: string;
  createdAt: string;
  read: boolean;
};

type NotificationInput = Omit<NotificationItem, "id" | "createdAt" | "read" | "category"> & {
  category?: NotificationCategory;
};

export type MessageAttachment = {
  id: string;
  name: string;
  type: string;
  sizeLabel: string;
};

export type StoredMessage = {
  id: number;
  from: "admin" | "student";
  text: string;
  time: string;
  read: boolean;
  threadId?: string;
  attachments?: MessageAttachment[];
};

export type StoredSession = {
  id: number;
  date: string;
  time: string;
  duration: string;
  type: "video" | "chat" | "in_person";
  topic: string;
  status: "upcoming" | "completed" | "cancelled";
  notes?: string;
};

export type SubmissionFeedbackItem = {
  label: string;
  detail: string;
  severity: "critical" | "warning" | "success";
};

export type ProjectSubmissionRecord = {
  id: string;
  attempt: number;
  projectId: number;
  outcome: "failed" | "success";
  score: number;
  repoUrl: string;
  fileName: string;
  submittedAt: string;
  summary: string;
  feedback: SubmissionFeedbackItem[];
};

export type IdeRunResult = {
  status: "passed" | "failed";
  passedTests: number;
  totalTests: number;
  summary: string;
  ranAt: string;
};

export type IdeSession = {
  projectId: number;
  exerciseId: number;
  code: string;
  updatedAt: string;
  hintIndex: number;
  completed: boolean;
  consoleOutput: string[];
  lastRun?: IdeRunResult;
};

export type LearnerActivityItem = {
  id: string;
  kind: NotificationCategory;
  title: string;
  detail: string;
  createdAt: string;
  href?: string;
};

export type FavoriteItem = {
  id: string;
  type: "course" | "path" | "student";
  label: string;
  href: string;
  createdAt: string;
};

export type CourseCriterionScore = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
};

export type CourseVerdictLayer = {
  status: "pass" | "warning" | "fail";
  score: number;
  summary: string;
  findings: string[];
};

export type CourseSubmissionRecord = {
  id: string;
  courseId: string;
  courseName: string;
  userId: string;
  workspaceId: string;
  attempt: number;
  mode: "full" | "python_rerun" | "ai_second_pass";
  outcome: "submitted" | "refused" | "validated";
  score: number;
  repoUrl: string;
  fileName: string;
  submittedAt: string;
  ai: CourseVerdictLayer;
  python: CourseVerdictLayer;
  final: CourseVerdictLayer;
  criteria: CourseCriterionScore[];
};

type ProjectOverride = {
  status?: Project["status"];
  progress?: number;
  completedDate?: string;
  completionTime?: string;
  lastAiStatus?: "idle" | "failed" | "success";
};

type StudentState = {
  assignedTutorId?: string;
  forcedProjectIds?: number[];
  forceReason?: string;
  forceValidatedAt?: string;
  lastContactAt?: string;
  messages?: StoredMessage[];
  sessions?: StoredSession[];
};

type BlockedSubmissionState = {
  forced?: boolean;
  reanalysisCount?: number;
  inspectedCount?: number;
  lastContactAt?: string;
};

type LearnerState = {
  onboardingDismissed: boolean;
  projectSubmissions: Record<number, ProjectSubmissionRecord[]>;
  courseSubmissions: Record<string, CourseSubmissionRecord[]>;
  ideSessions: Record<string, IdeSession>;
  activity: LearnerActivityItem[];
  favorites: FavoriteItem[];
};

type AcademyState = {
  projectOverrides: Record<number, ProjectOverride>;
  notifications: NotificationItem[];
  students: Record<string, StudentState>;
  blocked: Record<string, BlockedSubmissionState>;
  learner: LearnerState;
};

const defaultState = (): AcademyState => ({
  projectOverrides: {},
  notifications: [
    {
      id: "welcome",
      kind: "info",
      category: "system",
      title: "Plateforme prete",
      message: "Le front conserve maintenant vos actions localement entre les ecrans.",
      href: "/",
      createdAt: new Date().toISOString(),
      read: false,
    },
  ],
  students: {},
  blocked: {},
  learner: {
    onboardingDismissed: false,
    projectSubmissions: {},
    courseSubmissions: {},
    ideSessions: {},
    activity: [],
    favorites: [],
  },
});

function canUseDom() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function cloneState<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function mergeState(parsed: Partial<AcademyState> | null | undefined): AcademyState {
  const base = defaultState();
  return {
    projectOverrides: parsed?.projectOverrides ?? base.projectOverrides,
    notifications: parsed?.notifications?.length
      ? parsed.notifications.map((notification) => ({
        category: "system",
        ...notification,
      }))
      : base.notifications,
    students: parsed?.students ?? base.students,
    blocked: parsed?.blocked ?? base.blocked,
    learner: {
      onboardingDismissed: parsed?.learner?.onboardingDismissed ?? base.learner.onboardingDismissed,
      projectSubmissions: parsed?.learner?.projectSubmissions ?? base.learner.projectSubmissions,
      courseSubmissions: parsed?.learner?.courseSubmissions ?? base.learner.courseSubmissions,
      ideSessions: parsed?.learner?.ideSessions ?? base.learner.ideSessions,
      activity: parsed?.learner?.activity ?? base.learner.activity,
      favorites: parsed?.learner?.favorites ?? base.learner.favorites,
    },
  };
}

function loadAcademyState(): AcademyState {
  if (!canUseDom()) return defaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return mergeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

let currentAcademyState: AcademyState = loadAcademyState();

export function readAcademyState(): AcademyState {
  return currentAcademyState;
}

function emitStoreUpdate() {
  if (!canUseDom()) return;
  window.dispatchEvent(new Event(STORE_EVENT));
}

function writeAcademyState(next: AcademyState) {
  if (!canUseDom()) return;
  currentAcademyState = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emitStoreUpdate();
}

function mutateAcademyState(mutator: (draft: AcademyState) => void): AcademyState {
  const draft = cloneState(readAcademyState());
  mutator(draft);
  writeAcademyState(draft);
  return draft;
}

function subscribe(listener: () => void) {
  if (!canUseDom()) return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      currentAcademyState = loadAcademyState();
      listener();
    }
  };

  window.addEventListener(STORE_EVENT, listener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(STORE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAcademyStore() {
  return useSyncExternalStore(subscribe, readAcademyState, readAcademyState);
}

export function resetAcademyState() {
  writeAcademyState(defaultState());
}

function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatClockLabel(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatSessionTimeLabel(date = new Date()) {
  return `Aujourd'hui ${formatClockLabel(date)}`;
}

function ensureStudentState(state: AcademyState, studentId: string): StudentState {
  state.students[studentId] ??= {};
  return state.students[studentId];
}

function ensureBlockedState(state: AcademyState, studentId: string): BlockedSubmissionState {
  state.blocked[studentId] ??= {};
  return state.blocked[studentId];
}

function getToastAction(notification: NotificationItem) {
  if (!notification.href || !canUseDom()) return undefined;
  return {
    label: "Ouvrir",
    onClick: () => {
      window.location.assign(notification.href!);
    },
  };
}

function showToast(notification: NotificationItem) {
  if (!canUseDom()) return;

  const options = {
    description: notification.message,
    action: getToastAction(notification),
    duration: notification.kind === "warning" || notification.kind === "error" ? 6000 : 4000,
  };

  if (notification.kind === "success") {
    toast.success(notification.title, options);
    return;
  }

  if (notification.kind === "warning") {
    toast.warning(notification.title, options);
    return;
  }

  if (notification.kind === "error") {
    toast.error(notification.title, options);
    return;
  }

  toast(notification.title, options);
}

function pushNotification(
  state: AcademyState,
  input: NotificationInput,
  shouldToast = true,
) {
  const notification: NotificationItem = {
    category: input.category ?? "system",
    ...input,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  state.notifications.unshift(notification);
  if (shouldToast) showToast(notification);
  return notification;
}

function pushActivity(
  state: AcademyState,
  input: Omit<LearnerActivityItem, "id" | "createdAt"> & { createdAt?: string },
) {
  state.learner.activity.unshift({
    ...input,
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: input.createdAt ?? new Date().toISOString(),
  });
}

function getProjectFeedback(outcome: "failed" | "success"): SubmissionFeedbackItem[] {
  if (outcome === "success") {
    return [
      { label: "Architecture validee", detail: "Le workflow respecte la structure attendue et reste lisible.", severity: "success" },
      { label: "Conformite securite", detail: "Aucun secret en dur detecte, la validation IA est propre.", severity: "success" },
      { label: "Traçabilite", detail: "Les logs metier requis sont bien presentes.", severity: "success" },
    ];
  }

  return [
    { label: "Limite d'activites depassee", detail: "Le workflow principal depasse encore le seuil autorise.", severity: "critical" },
    { label: "Secret expose", detail: "Un element sensible reste present en dur dans le package soumis.", severity: "critical" },
    { label: "Logs a structurer", detail: "Le format de log attendu n'est pas encore completement respecte.", severity: "warning" },
  ];
}

export function addNotification(input: NotificationInput) {
  mutateAcademyState((state) => {
    pushNotification(state, input);
  });
}

export function markAllNotificationsRead() {
  mutateAcademyState((state) => {
    state.notifications = state.notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
  });
}

export function getUnreadNotificationsCount() {
  return readAcademyState().notifications.filter((notification) => !notification.read).length;
}

export function getLearnerProjects(projects: Project[]) {
  const state = readAcademyState();
  return projects.map((project) => ({
    ...project,
    ...(state.projectOverrides[project.id] ?? {}),
  }));
}

export function getLearnerMetrics(projects: Project[]) {
  const currentProjects = getLearnerProjects(projects);
  const totalProjects = currentProjects.length;
  const completedProjects = currentProjects.filter((project) => project.status === "completed").length;
  const activeProject = currentProjects.find((project) => project.status === "in_progress");
  const rawPercent = ((completedProjects + (activeProject?.progress ?? 0) / 100) / totalProjects) * 100;
  const progressPercent = Math.max(0, Math.min(100, Math.round(rawPercent)));

  let level = "Debutant";
  if (progressPercent >= 75) level = "Expert";
  else if (progressPercent >= 50) level = "Avance";
  else if (progressPercent >= 25) level = "Intermediaire";

  return {
    totalProjects,
    completedProjects,
    activeProject,
    progressPercent,
    level,
  };
}

export function getProjectSubmissionHistory(projectId: number) {
  return readAcademyState().learner.projectSubmissions[projectId] ?? [];
}

export function getCourseSubmissionHistory(courseId: string, userId?: string) {
  const history = readAcademyState().learner.courseSubmissions[courseId] ?? [];
  return userId ? history.filter((item) => item.userId === userId) : history;
}

export function getAllCourseSubmissionHistory(userId?: string) {
  const entries = Object.values(readAcademyState().learner.courseSubmissions).flat();
  return userId ? entries.filter((item) => item.userId === userId) : entries;
}

export function getLearnerActivity(limit = 8) {
  return readAcademyState().learner.activity.slice(0, limit);
}

export function getFavorites() {
  return readAcademyState().learner.favorites;
}

export function isFavorite(id: string) {
  return readAcademyState().learner.favorites.some((item) => item.id === id);
}

export function toggleFavorite(input: Omit<FavoriteItem, "createdAt">) {
  mutateAcademyState((state) => {
    const existing = state.learner.favorites.find((item) => item.id === input.id);
    if (existing) {
      state.learner.favorites = state.learner.favorites.filter((item) => item.id !== input.id);
      pushNotification(state, {
        kind: "info",
        category: "course",
        title: "Favori retire",
        message: `${input.label} a ete retire de vos favoris.`,
        href: input.href,
      }, false);
      return;
    }

    state.learner.favorites.unshift({
      ...input,
      createdAt: new Date().toISOString(),
    });
    pushNotification(state, {
      kind: "success",
      category: "course",
      title: "Favori ajoute",
      message: `${input.label} est maintenant accessible depuis vos favoris.`,
      href: input.href,
    }, false);
  });
}

export function isLearnerOnboardingDismissed() {
  return readAcademyState().learner.onboardingDismissed;
}

export function dismissLearnerOnboarding() {
  mutateAcademyState((state) => {
    state.learner.onboardingDismissed = true;
  });
}

export function recordCourseSubmissionAttempt(input: Omit<CourseSubmissionRecord, "id" | "attempt" | "submittedAt">) {
  mutateAcademyState((state) => {
    const history = state.learner.courseSubmissions[input.courseId] ?? [];
    const record: CourseSubmissionRecord = {
      ...input,
      id: `course-submission-${input.courseId}-${Date.now()}`,
      attempt: history.length + 1,
      submittedAt: new Date().toISOString(),
    };
    state.learner.courseSubmissions[input.courseId] = [record, ...history];
    pushActivity(state, {
      kind: "submission",
      title: `${input.courseName} - ${record.outcome === "validated" ? "valide" : record.outcome === "refused" ? "refuse" : "soumis"}`,
      detail: record.final.summary,
      href: `/cours/${input.courseId}`,
      createdAt: record.submittedAt,
    });
    pushNotification(state, {
      kind: record.outcome === "validated" ? "success" : record.outcome === "refused" ? "warning" : "info",
      category: "submission",
      title: record.outcome === "validated" ? "Soumission validee" : record.outcome === "refused" ? "Soumission refusee" : "Soumission enregistree",
      message: `${input.courseName} · tentative #${record.attempt} · score ${record.score}/100.`,
      href: `/cours/${input.courseId}`,
    }, false);
  });
}

export function submitProjectReview(
  projectId: number,
  outcome: "failed" | "success",
  details?: { repoUrl?: string; fileName?: string },
) {
  mutateAcademyState((state) => {
    const current = state.projectOverrides[projectId] ?? {};
    const history = state.learner.projectSubmissions[projectId] ?? [];
    const attempt = history.length + 1;
    const record: ProjectSubmissionRecord = {
      id: `submission-${projectId}-${Date.now()}`,
      attempt,
      projectId,
      outcome,
      score: outcome === "success" ? 94 : 62,
      repoUrl: details?.repoUrl ?? "",
      fileName: details?.fileName ?? "",
      submittedAt: new Date().toISOString(),
      summary: outcome === "success"
        ? "Validation IA reussie, le projet suivant est debloque."
        : "Validation IA en echec, des corrections restent necessaires avant resoumission.",
      feedback: getProjectFeedback(outcome),
    };

    state.learner.projectSubmissions[projectId] = [record, ...history];
    pushActivity(state, {
      kind: "submission",
      title: outcome === "success" ? `Projet ${projectId} valide` : `Projet ${projectId} a corriger`,
      detail: outcome === "success"
        ? `Soumission #${attempt} acceptee par l'IA.`
        : `Soumission #${attempt} refusee avec blocages critiques.`,
      href: `/projet/${projectId}`,
      createdAt: record.submittedAt,
    });

    if (outcome === "failed") {
      state.projectOverrides[projectId] = {
        ...current,
        status: "in_progress",
        lastAiStatus: "failed",
      };
      pushNotification(state, {
        kind: "warning",
        category: "submission",
        title: `Projet ${projectId} a corriger`,
        message: "La validation IA a detecte des erreurs bloquantes. Corrigez puis resoumettez.",
        href: `/projet/${projectId}`,
      });
      return;
    }

    state.projectOverrides[projectId] = {
      ...current,
      status: "completed",
      progress: 100,
      completedDate: current.completedDate ?? formatLongDate(),
      completionTime: current.completionTime ?? `0${projectId + 1}h ${String(18 + projectId).padStart(2, "0")}m`,
      lastAiStatus: "success",
    };

    const nextProjectId = projectId + 1;
    const nextProject = state.projectOverrides[nextProjectId] ?? {};
    if (nextProject.status !== "completed") {
      state.projectOverrides[nextProjectId] = {
        ...nextProject,
        status: "in_progress",
        progress: nextProject.progress ?? 15,
      };
    }

    pushNotification(state, {
      kind: "success",
      category: "submission",
      title: `Projet ${projectId} valide`,
      message: nextProjectId <= 5
        ? `Le projet ${nextProjectId} est maintenant debloque.`
        : "Le parcours est termine, la certification est disponible.",
      href: nextProjectId <= 5 ? `/projet/${nextProjectId}` : "/",
    });
  });
}

export function resetProjectReviewState(projectId: number) {
  mutateAcademyState((state) => {
    const current = state.projectOverrides[projectId] ?? {};
    state.projectOverrides[projectId] = {
      ...current,
      lastAiStatus: "idle",
    };
  });
}

export function getIdeSession(projectId: number, exerciseId: number) {
  return readAcademyState().learner.ideSessions[`${projectId}:${exerciseId}`];
}

export function saveIdeDraft(
  projectId: number,
  exerciseId: number,
  input: Pick<IdeSession, "code" | "hintIndex" | "consoleOutput">,
) {
  mutateAcademyState((state) => {
    const key = `${projectId}:${exerciseId}`;
    const current = state.learner.ideSessions[key];
    state.learner.ideSessions[key] = {
      projectId,
      exerciseId,
      code: input.code,
      hintIndex: input.hintIndex,
      consoleOutput: input.consoleOutput,
      updatedAt: new Date().toISOString(),
      completed: current?.completed ?? false,
      lastRun: current?.lastRun,
    };
  });
}

export function recordIdeRun(projectId: number, exerciseId: number, run: IdeRunResult, code: string, hintIndex: number, consoleOutput: string[]) {
  mutateAcademyState((state) => {
    const key = `${projectId}:${exerciseId}`;
    const previous = state.learner.ideSessions[key];
    state.learner.ideSessions[key] = {
      projectId,
      exerciseId,
      code,
      hintIndex,
      consoleOutput,
      updatedAt: new Date().toISOString(),
      completed: run.status === "passed" ? true : previous?.completed ?? false,
      lastRun: run,
    };

    pushActivity(state, {
      kind: "submission",
      title: `IDE projet ${projectId} - exercice ${exerciseId}`,
      detail: run.summary,
      href: `/ide/${projectId}`,
      createdAt: run.ranAt,
    });
  });
}

export function resetIdeSession(projectId: number, exerciseId: number) {
  mutateAcademyState((state) => {
    delete state.learner.ideSessions[`${projectId}:${exerciseId}`];
  });
}

export function getAssignedTutorId(studentId: string, fallbackTutorId?: string) {
  return readAcademyState().students[studentId]?.assignedTutorId ?? fallbackTutorId;
}

export function assignTutor(studentId: string, tutorId: string, tutorName: string, studentName: string) {
  mutateAcademyState((state) => {
    const student = ensureStudentState(state, studentId);
    student.assignedTutorId = tutorId;
    pushNotification(state, {
      kind: "info",
      category: "admin",
      title: "Tuteur mis a jour",
      message: `${studentName} est maintenant suivi par ${tutorName}.`,
      href: `/admin/apprenant/${studentId}`,
    });
  });
}

export function isStudentForceValidated(studentId: string, projectId: number) {
  return !!readAcademyState().students[studentId]?.forcedProjectIds?.includes(projectId);
}

export function forceValidateStudentProject(studentId: string, projectId: number, studentName: string, reason: string) {
  mutateAcademyState((state) => {
    const student = ensureStudentState(state, studentId);
    const blocked = ensureBlockedState(state, studentId);
    const currentIds = student.forcedProjectIds ?? [];
    student.forcedProjectIds = Array.from(new Set([...currentIds, projectId]));
    student.forceReason = reason;
    student.forceValidatedAt = new Date().toISOString();
    blocked.forced = true;

    pushNotification(state, {
      kind: "success",
      category: "admin",
      title: "Validation administrateur appliquee",
      message: `${studentName} a ete debloque sur le projet ${projectId}.`,
      href: `/admin/apprenant/${studentId}`,
    });
  });
}

export function getBlockedSubmissionState(studentId: string) {
  return readAcademyState().blocked[studentId] ?? {};
}

export function markBlockedSubmissionInspected(studentId: string) {
  mutateAcademyState((state) => {
    const blocked = ensureBlockedState(state, studentId);
    blocked.inspectedCount = (blocked.inspectedCount ?? 0) + 1;
  });
}

export function markBlockedSubmissionContacted(studentId: string, studentName: string) {
  mutateAcademyState((state) => {
    const blocked = ensureBlockedState(state, studentId);
    const student = ensureStudentState(state, studentId);
    const now = new Date().toISOString();
    blocked.lastContactAt = now;
    student.lastContactAt = now;
    pushNotification(state, {
      kind: "info",
      category: "admin",
      title: "Apprenant contacte",
      message: `Un rappel a ete envoye a ${studentName}.`,
      href: `/admin/apprenant/${studentId}`,
    });
  });
}

export function rerunBlockedSubmissionAnalysis(studentId: string, studentName: string) {
  mutateAcademyState((state) => {
    const blocked = ensureBlockedState(state, studentId);
    blocked.reanalysisCount = (blocked.reanalysisCount ?? 0) + 1;
    pushNotification(state, {
      kind: "warning",
      category: "admin",
      title: "Analyse relancee",
      message: `Une nouvelle analyse IA a ete demandee pour ${studentName}.`,
      href: `/admin/apprenant/${studentId}`,
    });
  });
}

export function getStudentMessages(studentId: string, fallbackMessages: StoredMessage[]) {
  return readAcademyState().students[studentId]?.messages ?? fallbackMessages;
}

export function saveStudentMessages(studentId: string, messages: StoredMessage[]) {
  mutateAcademyState((state) => {
    const student = ensureStudentState(state, studentId);
    student.messages = messages;
  });
}

export function appendStudentMessage(studentId: string, message: StoredMessage) {
  mutateAcademyState((state) => {
    const student = ensureStudentState(state, studentId);
    student.messages = [...(student.messages ?? []), message];
  });
}

export function getStudentSessions(studentId: string, fallbackSessions: StoredSession[]) {
  return readAcademyState().students[studentId]?.sessions ?? fallbackSessions;
}

export function saveStudentSessions(studentId: string, sessions: StoredSession[]) {
  mutateAcademyState((state) => {
    const student = ensureStudentState(state, studentId);
    student.sessions = sessions;
  });
}

export function addStudentSession(studentId: string, session: StoredSession, studentName: string) {
  mutateAcademyState((state) => {
    const student = ensureStudentState(state, studentId);
    student.sessions = [...(student.sessions ?? []), session];
    pushNotification(state, {
      kind: "info",
      category: "mentoring",
      title: "Session planifiee",
      message: `Une session de mentorat a ete creee pour ${studentName} le ${session.date} a ${session.time}.`,
      href: `/admin/apprenant/${studentId}`,
    });
  });
}

export function updateStudentSessionStatus(studentId: string, sessionId: number, status: StoredSession["status"]) {
  mutateAcademyState((state) => {
    const student = ensureStudentState(state, studentId);
    student.sessions = (student.sessions ?? []).map((session) =>
      session.id === sessionId ? { ...session, status } : session,
    );
  });
}

export function createAutomatedStudentReply() {
  const replies = [
    "Merci, je prends en compte ce retour.",
    "Bien recu, je corrige ca avant la prochaine soumission.",
    "Parfait, je vous tiens informe rapidement.",
    "Compris, je vais appliquer cette recommandation.",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

export function createMessageTimestamp() {
  return formatSessionTimeLabel();
}
