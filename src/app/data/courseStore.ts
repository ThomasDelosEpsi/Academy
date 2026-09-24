import { getCurrentTenant, getCurrentUser, getCurrentWorkspace } from "./tenantStore";
import { PROJECTS } from "./projectsData";

const DRAFTS_KEY = "academy_course_drafts_v2";
const ACCESS_KEY = "academy_course_access_v2";
const PUBLISHED_KEY = "academy_published_courses_v2";
const PROGRESS_KEY = "academy_course_progress_v2";
const BOOTSTRAP_KEY = "academy_course_bootstrap_v1";

export type Draft = {
  id: string;
  savedAt: string;
  title: string;
  description: string;
  step: number;
  formData: Record<string, any>;
};

export type CourseAccessRule = {
  courseId: string;
  courseName: string;
  workspaceId?: string;
  accessMode: "all" | "specific" | "groups";
  studentIds: string[];
  groupIds: string[];
  groupLabels: string[];
};

export type CourseType = "document" | "onboarding" | "automation" | "blended";
export type CourseBuilderMode = "generic" | "rpa";
export type CourseTemplateType = "rpa" | "rh" | "onboarding" | "procedure" | "quiz_only" | "video_quiz";
export type RulePackId = "beginner" | "intermediate" | "expert" | "production";

export type CoursePrerequisite = {
  id: string;
  type: "course_completed" | "quiz_passed";
  courseId: string;
  courseName: string;
  quizBlockId?: string;
  quizTitle?: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: number;
};

export type ChecklistItem = {
  id: string;
  label: string;
  checked?: boolean;
};

export type AccordionItem = {
  id: string;
  title: string;
  body: string;
};

export type RpaResource = {
  id: number;
  name: string;
  type: string;
  url: string;
};

export type RpaValidationRule = {
  id: number;
  key?: string;
  label?: string;
  description?: string;
  category?: string;
  enabled?: boolean;
  placeholder?: string;
  type: string;
  value: string;
  severity: "blocking" | "warning";
};

export type RpaPythonRule = {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  enabled: boolean;
  severity: "blocking" | "warning";
  scriptName: string;
  param?: string;
  paramLabel?: string;
};

export type RpaOutputColumn = {
  id: number;
  name: string;
  type: string;
  required: boolean;
  sampleValue: string;
};

export type RpaSchemaGenerationMode = "file_example" | "text_brief" | "ai_prompt";

export type RpaSampleRow = {
  id: number;
  title: string;
  input: string;
  expectedOutput: string;
  status: "required" | "bonus";
};

export type RpaAntiPattern = {
  id: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  severity: "blocking" | "warning";
};

export type RpaSubmissionPolicy = {
  primaryFileType: string;
  attachmentFileTypes: string[];
  maxFileSizeMb: number;
  maxFiles: number;
  namingPattern: string;
};

export type RpaCorrectionSettings = {
  allowPythonRerun: boolean;
  allowSecondAiRead: boolean;
  secondAiTemperature: number;
};

export type RpaCourseConfig = {
  techStack: string[];
  resources: RpaResource[];
  validationRules: RpaValidationRule[];
  pythonRules: RpaPythonRule[];
  submissionFileTypes: string[];
  submissionPolicy: RpaSubmissionPolicy;
  outputFileType: string;
  schemaGenerationMode: RpaSchemaGenerationMode;
  outputBriefText: string;
  outputAiPrompt: string;
  outputColumns: RpaOutputColumn[];
  sampleRows: RpaSampleRow[];
  antiPatterns: RpaAntiPattern[];
  correctionSettings: RpaCorrectionSettings;
};

export type CourseBlock =
  | { id: string; type: "heading"; title: string; body: string }
  | { id: string; type: "text"; title: string; body: string }
  | { id: string; type: "callout"; title: string; body: string; tone: "info" | "warning" | "required" }
  | { id: string; type: "deliverable"; title: string; body: string }
  | { id: string; type: "example"; title: string; body: string; variant: "correct" | "incorrect" }
  | { id: string; type: "image"; title: string; imageUrl: string; caption: string }
  | { id: string; type: "video"; title: string; videoUrl: string; mandatory: boolean; lockedSpeed: boolean; durationSeconds: number }
  | { id: string; type: "quiz"; title: string; questions: QuizQuestion[] }
  | { id: string; type: "checkpoint"; title: string; body: string }
  | { id: string; type: "checklist"; title: string; items: ChecklistItem[] }
  | { id: string; type: "table"; title: string; columns: string[]; rows: string[][] }
  | { id: string; type: "accordion"; title: string; items: AccordionItem[] }
  | { id: string; type: "attachment"; title: string; fileName: string; fileType: string; url: string; helperText: string };

export type PublishedCourse = {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  duration: string;
  tags: string[];
  resourcesCount: number;
  rulesCount: number;
  outputColumnsCount: number;
  accessMode: "all" | "specific" | "groups";
  studentIds: string[];
  publishedAt: string;
  orderIndex: number;
  tenantId: string;
  workspaceId: string;
  workspaceName: string;
  courseType: CourseType;
  builderMode: CourseBuilderMode;
  templateType: CourseTemplateType;
  rulePackId: RulePackId;
  prerequisites: CoursePrerequisite[];
  estimatedMinutes: number;
  createdByPersonId: string;
  blocks: CourseBlock[];
  rpaConfig?: RpaCourseConfig;
  settings: {
    saveProgress: boolean;
    videoPlaybackLocked: boolean;
    aiAssisted: boolean;
  };
};

export type CourseProgress = {
  courseId: string;
  userId: string;
  currentBlockId: string | null;
  completedBlockIds: string[];
  completedVideoIds: string[];
  completedQuizIds: string[];
  progressPercent: number;
  lastVisitedAt: string;
};

export type WorkspaceCourseDifficultyInsight = {
  courseId: string;
  courseName: string;
  workspaceId: string;
  attempts: number;
  failures: number;
  averageProgressPercent: number;
  averageEstimatedMinutes: number;
};

export type WorkspaceQuizTarget = {
  courseId: string;
  courseName: string;
  quizBlockId: string;
  quizTitle: string;
};

export type ResolvedCoursePrerequisite = CoursePrerequisite & {
  requiredByDefault?: boolean;
  satisfied: boolean;
};

export type LearningPathItem = {
  course: PublishedCourse;
  index: number;
  positionLabel: string;
  progressPercent: number;
  status: "completed" | "in_progress" | "locked" | "not_started";
  isLocked: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
  prerequisites: ResolvedCoursePrerequisite[];
};

export type WorkspaceLearningMetrics = {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  lockedCourses: number;
  progressPercent: number;
  level: "Debutant" | "Intermediaire" | "Avance" | "Expert";
  activeCourse: LearningPathItem | null;
};

export const COURSE_TEMPLATE_LABELS: Record<CourseTemplateType, string> = {
  rpa: "RPA",
  rh: "RH",
  onboarding: "Onboarding",
  procedure: "Procedure",
  quiz_only: "Quiz only",
  video_quiz: "Video + quiz",
};

export const RULE_PACK_LABELS: Record<RulePackId, string> = {
  beginner: "Debutant",
  intermediate: "Intermediaire",
  expert: "Expert",
  production: "Production",
};

const BASE_COURSE_CATALOG = [
  { id: "p1", name: "Parcours Finance Operations", moduleId: 1, difficulty: "Debutant", duration: "2 jours", tags: ["Finance", "Process"] },
  { id: "p2", name: "Parcours Legal Review", moduleId: 2, difficulty: "Intermediaire", duration: "3 jours", tags: ["Juridique", "Validation"] },
  { id: "p3", name: "Parcours Data Reporting", moduleId: 3, difficulty: "Intermediaire", duration: "4 jours", tags: ["Reporting", "Data"] },
  { id: "p4", name: "Parcours HR Onboarding", moduleId: 4, difficulty: "Avance", duration: "5 jours", tags: ["RH", "Onboarding"] },
  { id: "p5", name: "Certification Expert", moduleId: 5, difficulty: "Expert", duration: "5 jours", tags: ["Certification"] },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function readBootstrapState(): Record<string, boolean> {
  return readJson<Record<string, boolean>>(BOOTSTRAP_KEY, {});
}

function markBootstrapDone(workspaceId: string) {
  const current = readBootstrapState();
  writeJson(BOOTSTRAP_KEY, {
    ...current,
    [workspaceId]: true,
  });
}

function normalizePublishedCourses(courses: PublishedCourse[]): PublishedCourse[] {
  const byWorkspace = new Map<string, PublishedCourse[]>();

  for (const course of courses) {
    const list = byWorkspace.get(course.workspaceId) ?? [];
    list.push(course);
    byWorkspace.set(course.workspaceId, list);
  }

  return Array.from(byWorkspace.values())
    .flatMap((workspaceCourses) =>
      workspaceCourses
        .slice()
        .sort((a, b) => {
          const aOrder = Number.isFinite(a.orderIndex) ? a.orderIndex : Number.MAX_SAFE_INTEGER;
          const bOrder = Number.isFinite(b.orderIndex) ? b.orderIndex : Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        })
        .map((course, index) => ({
          ...hydratePublishedCourse(course),
          orderIndex: index,
        })),
    )
    .sort((a, b) => a.workspaceId.localeCompare(b.workspaceId) || a.orderIndex - b.orderIndex);
}

function inferTemplateType(course: Pick<PublishedCourse, "builderMode" | "courseType" | "workspaceName" | "workspaceId">): CourseTemplateType {
  if (course.builderMode === "rpa") return "rpa";
  if (course.courseType === "onboarding") return "onboarding";
  const haystack = `${course.workspaceName} ${course.workspaceId}`.toLowerCase();
  if (/rh|hr|people/.test(haystack)) return "rh";
  return "procedure";
}

function defaultRulePackForTemplate(templateType: CourseTemplateType): RulePackId {
  if (templateType === "rpa") return "production";
  if (templateType === "quiz_only" || templateType === "video_quiz") return "beginner";
  if (templateType === "rh" || templateType === "onboarding") return "intermediate";
  return "expert";
}

function hydrateRpaConfig(rpaConfig?: RpaCourseConfig): RpaCourseConfig | undefined {
  if (!rpaConfig) return undefined;
  return {
    ...rpaConfig,
    submissionFileTypes: rpaConfig.submissionFileTypes?.length ? rpaConfig.submissionFileTypes : ["nupkg"],
    submissionPolicy: {
      primaryFileType: rpaConfig.submissionPolicy?.primaryFileType ?? rpaConfig.submissionFileTypes?.[0] ?? "nupkg",
      attachmentFileTypes: rpaConfig.submissionPolicy?.attachmentFileTypes ?? [],
      maxFileSizeMb: rpaConfig.submissionPolicy?.maxFileSizeMb ?? 50,
      maxFiles: rpaConfig.submissionPolicy?.maxFiles ?? 2,
      namingPattern: rpaConfig.submissionPolicy?.namingPattern ?? "{workspace}-{course}-{learner}",
    },
    outputFileType: rpaConfig.outputFileType ?? "CSV",
    schemaGenerationMode: rpaConfig.schemaGenerationMode ?? "file_example",
    outputBriefText: rpaConfig.outputBriefText ?? "",
    outputAiPrompt: rpaConfig.outputAiPrompt ?? "",
    outputColumns: rpaConfig.outputColumns ?? [],
    sampleRows: (rpaConfig.sampleRows ?? []).map((row, index) => ({
      ...row,
      title: row.title ?? `Cas ${index + 1}`,
      status: row.status ?? "required",
    })),
    antiPatterns: (rpaConfig.antiPatterns ?? [
      {
        id: "anti-hardcode",
        key: "hardcode",
        label: "Interdire les hardcodes",
        description: "Refuser les valeurs fixes, chemins locaux et credentials en dur.",
        enabled: true,
        severity: "blocking",
      },
      {
        id: "anti-selectors",
        key: "fragile_selectors",
        label: "Signaler les selecteurs fragiles",
        description: "Penaliser les selecteurs trop absolus, indexes instables ou ancres volatiles.",
        enabled: true,
        severity: "warning",
      },
      {
        id: "anti-logs",
        key: "missing_logs",
        label: "Absence de logs utiles",
        description: "Exiger des logs lisibles pour tracer les transactions et erreurs.",
        enabled: true,
        severity: "warning",
      },
      {
        id: "anti-density",
        key: "dense_workflow",
        label: "Workflow trop dense",
        description: "Bloquer les workflows monolithiques et pousser la decomposition.",
        enabled: true,
        severity: "blocking",
      },
    ]).map((item) => ({
      ...item,
      enabled: item.enabled ?? true,
      severity: item.severity ?? "warning",
    })),
    correctionSettings: {
      allowPythonRerun: rpaConfig.correctionSettings?.allowPythonRerun ?? true,
      allowSecondAiRead: rpaConfig.correctionSettings?.allowSecondAiRead ?? true,
      secondAiTemperature: rpaConfig.correctionSettings?.secondAiTemperature ?? 0.1,
    },
  };
}

function hydratePublishedCourse(course: PublishedCourse): PublishedCourse {
  const templateType = course.templateType ?? inferTemplateType(course);
  return {
    ...course,
    builderMode: course.builderMode ?? "generic",
    templateType,
    rulePackId: course.rulePackId ?? defaultRulePackForTemplate(templateType),
    prerequisites: course.prerequisites ?? [],
    rpaConfig: hydrateRpaConfig(course.rpaConfig),
    settings: {
      saveProgress: true,
      videoPlaybackLocked: true,
      aiAssisted: true,
      ...course.settings,
    },
  };
}

function savePublishedCourses(courses: PublishedCourse[]) {
  writeJson(PUBLISHED_KEY, normalizePublishedCourses(courses));
}

function buildLegacyRpaCourses(): PublishedCourse[] {
  const tenant = getCurrentTenant();
  const user = getCurrentUser();
  const rpaWorkspace = tenant.workspaces.find((workspace) => /rpa|automation|automatisation|informatique|it|tech/i.test(`${workspace.name} ${workspace.domain}`));
  if (!rpaWorkspace) return [];

  return PROJECTS.map((project, index) => ({
    id: `legacy-rpa-course-${project.id}`,
    name: project.title,
    description: project.description,
    difficulty: index === 0 ? "Debutant" : index < 3 ? "Intermediaire" : index === 3 ? "Avance" : "Expert",
    duration: project.duration,
    tags: project.tags,
    resourcesCount: project.resources.length,
    rulesCount: project.rules.length,
    outputColumnsCount: 0,
    accessMode: "all",
    studentIds: [],
    publishedAt: new Date(2026, 3, Math.max(1, index + 1)).toISOString(),
    orderIndex: index,
    tenantId: tenant.id,
    workspaceId: rpaWorkspace.id,
    workspaceName: rpaWorkspace.name,
    courseType: "automation",
    builderMode: "rpa",
    templateType: "rpa",
    rulePackId: "production",
    prerequisites: [],
    estimatedMinutes: Math.max(60, (index + 2) * 60),
    createdByPersonId: user.id,
    blocks: [
      { id: `legacy-heading-${project.id}`, type: "heading", title: "Objectif", body: project.context },
      {
        id: `legacy-rules-${project.id}`,
        type: "text",
        title: "Regles de validation",
        body: project.rules.map((rule) => `${rule.label}: ${rule.detail}`).join("\n"),
      },
      {
        id: `legacy-resources-${project.id}`,
        type: "text",
        title: "Ressources",
        body: project.resources.map((resource) => `${resource.label} (${resource.type})`).join("\n"),
      },
    ],
    rpaConfig: {
      techStack: project.tags,
      resources: project.resources.map((resource) => ({
        id: resource.id,
        name: resource.label,
        type: resource.type,
        url: "",
      })),
      validationRules: project.rules.map((rule, ruleIndex) => ({
        id: project.id * 100 + ruleIndex + 1,
        label: rule.label,
        description: rule.detail,
        category: "Legacy",
        enabled: true,
        type: rule.label,
        value: rule.detail,
        severity: rule.severity,
      })),
      pythonRules: [],
      submissionFileTypes: ["nupkg"],
      submissionPolicy: {
        primaryFileType: "nupkg",
        attachmentFileTypes: [],
        maxFileSizeMb: 50,
        maxFiles: 2,
        namingPattern: "{workspace}-{course}-{learner}",
      },
      outputFileType: "CSV",
      schemaGenerationMode: "file_example",
      outputBriefText: "",
      outputAiPrompt: "",
      outputColumns: [],
      sampleRows: [],
      antiPatterns: [],
      correctionSettings: {
        allowPythonRerun: true,
        allowSecondAiRead: true,
        secondAiTemperature: 0.1,
      },
    },
    settings: {
      saveProgress: true,
      videoPlaybackLocked: true,
      aiAssisted: true,
    },
  }));
}

function ensureLegacyBootstrap(courses: PublishedCourse[]): PublishedCourse[] {
  const tenant = getCurrentTenant();
  const currentWorkspace = getCurrentWorkspace();
  const workspaceId = currentWorkspace?.id;
  if (!workspaceId) return courses;

  const bootstrapState = readBootstrapState();
  if (bootstrapState[workspaceId]) return courses;

  const isRpaWorkspace = /rpa|automation|automatisation|informatique|it|tech/i.test(`${currentWorkspace.name} ${currentWorkspace.domain}`);
  if (!isRpaWorkspace) {
    markBootstrapDone(workspaceId);
    return courses;
  }

  const hasExistingWorkspaceCourses = courses.some((course) => course.workspaceId === workspaceId);
  if (hasExistingWorkspaceCourses) {
    markBootstrapDone(workspaceId);
    return courses;
  }

  const legacyCourses = buildLegacyRpaCourses().filter((course) => course.tenantId === tenant.id && course.workspaceId === workspaceId);
  if (!legacyCourses.length) {
    markBootstrapDone(workspaceId);
    return courses;
  }

  const merged = normalizePublishedCourses([...courses, ...legacyCourses]);
  writeJson(PUBLISHED_KEY, merged);
  markBootstrapDone(workspaceId);
  return merged;
}

export const getDrafts = (): Draft[] => readJson(DRAFTS_KEY, []);

export const saveDraft = (draft: Draft): void => {
  const drafts = getDrafts().filter((item) => item.id !== draft.id);
  writeJson(DRAFTS_KEY, [draft, ...drafts]);
};

export const deleteDraft = (id: string): void => {
  writeJson(DRAFTS_KEY, getDrafts().filter((draft) => draft.id !== id));
};

export const getDraft = (id: string): Draft | null =>
  getDrafts().find((draft) => draft.id === id) ?? null;

export const getCourseAccessRules = (): CourseAccessRule[] => readJson<CourseAccessRule[]>(ACCESS_KEY, []).map((rule) => ({
  ...rule,
  accessMode: rule.accessMode ?? "all",
  studentIds: rule.studentIds ?? [],
  groupIds: rule.groupIds ?? [],
  groupLabels: rule.groupLabels ?? [],
}));

export const saveCourseAccessRule = (rule: CourseAccessRule): void => {
  const rules = getCourseAccessRules().filter((item) => item.courseId !== rule.courseId);
  writeJson(ACCESS_KEY, [...rules, { ...rule, groupIds: rule.groupIds ?? [], groupLabels: rule.groupLabels ?? [] }]);
};

export const toggleStudentForCourse = (courseId: string, studentId: string): void => {
  const rules = getCourseAccessRules();
  const course = getCourseCatalog().find((item) => item.id === courseId);
  if (!course) return;
  const existing = rules.find((rule) => rule.courseId === courseId);
  if (!existing) {
    saveCourseAccessRule({
      courseId,
      courseName: course.name,
      accessMode: "specific",
      studentIds: [studentId],
      groupIds: [],
      groupLabels: [],
      workspaceId: (course as { workspaceId?: string }).workspaceId,
    });
    return;
  }
  if (existing.accessMode === "all") {
    saveCourseAccessRule({ ...existing, accessMode: "specific", studentIds: [studentId], groupIds: [], groupLabels: [] });
    return;
  }
  const hasStudent = existing.studentIds.includes(studentId);
  saveCourseAccessRule({
    ...existing,
    studentIds: hasStudent
      ? existing.studentIds.filter((id) => id !== studentId)
      : [...existing.studentIds, studentId],
  });
};

export const getPublishedCourses = (): PublishedCourse[] => {
  const courses = readJson(PUBLISHED_KEY, [] as PublishedCourse[]);
  const withBootstrap = ensureLegacyBootstrap(courses);
  const normalized = normalizePublishedCourses(withBootstrap);
  if (JSON.stringify(courses) !== JSON.stringify(normalized)) {
    writeJson(PUBLISHED_KEY, normalized);
  }
  return normalized;
};

export const getPublishedCoursesForWorkspace = (workspaceId = getCurrentWorkspace()?.id): PublishedCourse[] => {
  return getPublishedCourses()
    .filter((course) => course.workspaceId === workspaceId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
};

export const getCourseTemplateLabel = (templateType: CourseTemplateType) => COURSE_TEMPLATE_LABELS[templateType];

export const getRulePackLabel = (rulePackId: RulePackId) => RULE_PACK_LABELS[rulePackId];

export const savePublishedCourse = (course: PublishedCourse): void => {
  const courses = getPublishedCourses();
  const existing = courses.find((item) => item.id === course.id);
  const workspaceCourses = courses.filter((item) => item.workspaceId === course.workspaceId && item.id !== course.id);
  const nextOrderIndex = existing?.workspaceId === course.workspaceId
    ? existing.orderIndex
    : workspaceCourses.length;

  savePublishedCourses([
    ...courses.filter((item) => item.id !== course.id),
    {
      ...course,
      orderIndex: Number.isFinite(course.orderIndex) ? course.orderIndex : nextOrderIndex,
      publishedAt: existing?.publishedAt ?? course.publishedAt,
      createdByPersonId: existing?.createdByPersonId ?? course.createdByPersonId,
    },
  ]);
};

export const getCourseById = (courseId: string) => getPublishedCourses().find((course) => course.id === courseId) ?? null;

function isPrerequisiteSatisfied(prerequisite: CoursePrerequisite, userId?: string) {
  const progress = prerequisite.courseId ? getCourseProgress(prerequisite.courseId, userId) : null;
  if (!progress) return false;
  if (prerequisite.type === "course_completed") return progress.progressPercent >= 100;
  if (!prerequisite.quizBlockId) return false;
  return progress.progressPercent >= 100 || progress.completedQuizIds.includes(prerequisite.quizBlockId);
}

function courseAccessMatchesGroups(groupIds: string[], studentId: string) {
  const tenant = getCurrentTenant();
  const person = tenant.people.find((item) => item.id === studentId);
  if (!person) return false;
  return groupIds.some((groupId) => {
    const [dimension, rawValue] = groupId.split(":");
    const targetValue = rawValue?.replace(/-/g, " ") ?? "";
    if (dimension === "cohort") return person.cohort?.toLowerCase() === targetValue;
    if (dimension === "team") return person.team?.toLowerCase() === targetValue;
    if (dimension === "jobFamily") return person.jobFamily?.toLowerCase() === targetValue;
    if (dimension === "country") return person.country?.toLowerCase() === targetValue;
    return false;
  });
}

function resolveCoursePrerequisites(course: PublishedCourse, workspaceCourses: PublishedCourse[], index: number, userId?: string): ResolvedCoursePrerequisite[] {
  const explicit = course.prerequisites ?? [];
  const prerequisites = explicit.length
    ? explicit
    : index > 0
      ? [{
          id: `default-prev-${course.id}`,
          type: "course_completed" as const,
          courseId: workspaceCourses[index - 1].id,
          courseName: workspaceCourses[index - 1].name,
        }]
      : [];

  return prerequisites.map((prerequisite) => ({
    ...prerequisite,
    requiredByDefault: explicit.length === 0,
    satisfied: isPrerequisiteSatisfied(prerequisite, userId),
  }));
}

export function getWorkspaceLearningPath(workspaceId = getCurrentWorkspace()?.id, userId = getCurrentUser()?.id): LearningPathItem[] {
  const courses = getPublishedCoursesForWorkspace(workspaceId);
  return courses.map((course, index) => {
    const progress = getCourseProgress(course.id, userId) ?? null;
    const progressPercent = progress?.progressPercent ?? 0;
    const prerequisites = resolveCoursePrerequisites(course, courses, index, userId);
    const isCompleted = progressPercent >= 100;
    const isLocked = !isCompleted && prerequisites.some((prerequisite) => !prerequisite.satisfied);
    const status = isCompleted
      ? "completed"
      : progressPercent > 0
        ? "in_progress"
        : isLocked
          ? "locked"
          : "not_started";

    return {
      course,
      index,
      positionLabel: `P${index + 1}`,
      progressPercent,
      status,
      isLocked,
      isCompleted,
      isInProgress: status === "in_progress",
      prerequisites,
    };
  });
}

export function getWorkspaceLearningMetrics(workspaceId = getCurrentWorkspace()?.id, userId = getCurrentUser()?.id): WorkspaceLearningMetrics {
  const path = getWorkspaceLearningPath(workspaceId, userId);
  const totalCourses = path.length;
  const completedCourses = path.filter((item) => item.isCompleted).length;
  const inProgressCourses = path.filter((item) => item.status === "in_progress").length;
  const lockedCourses = path.filter((item) => item.isLocked).length;
  const progressPercent = totalCourses ? Math.round((completedCourses / totalCourses) * 100) : 0;
  const level = progressPercent >= 75 ? "Expert" : progressPercent >= 50 ? "Avance" : progressPercent >= 25 ? "Intermediaire" : "Debutant";
  const activeCourse = path.find((item) => item.status === "in_progress") ?? path.find((item) => item.status === "not_started") ?? null;

  return {
    totalCourses,
    completedCourses,
    inProgressCourses,
    lockedCourses,
    progressPercent,
    level,
    activeCourse,
  };
}

export function getWorkspaceQuizTargets(workspaceId = getCurrentWorkspace()?.id, excludeCourseId?: string): WorkspaceQuizTarget[] {
  return getPublishedCoursesForWorkspace(workspaceId)
    .filter((course) => course.id !== excludeCourseId)
    .flatMap((course) =>
      course.blocks
        .filter((block): block is Extract<CourseBlock, { type: "quiz" }> => block.type === "quiz")
        .map((block) => ({
          courseId: course.id,
          courseName: course.name,
          quizBlockId: block.id,
          quizTitle: block.title,
        })),
    );
}

export const deletePublishedCourse = (courseId: string): void => {
  savePublishedCourses(getPublishedCourses().filter((course) => course.id !== courseId));
  writeJson(ACCESS_KEY, getCourseAccessRules().filter((rule) => rule.courseId !== courseId));
  saveAllProgress(getAllProgress().filter((progress) => progress.courseId !== courseId));
};

export const setPublishedCourseOrder = (courseId: string, targetOrderIndex: number): void => {
  const courses = getPublishedCourses();
  const course = courses.find((item) => item.id === courseId);
  if (!course) return;

  const workspaceCourses = getPublishedCoursesForWorkspace(course.workspaceId).filter((item) => item.id !== courseId);
  const nextIndex = Math.max(0, Math.min(targetOrderIndex, workspaceCourses.length));
  workspaceCourses.splice(nextIndex, 0, course);

  const outsideWorkspace = courses.filter((item) => item.workspaceId !== course.workspaceId);
  savePublishedCourses([
    ...outsideWorkspace,
    ...workspaceCourses.map((item, index) => ({ ...item, orderIndex: index })),
  ]);
};

export const movePublishedCourse = (courseId: string, direction: -1 | 1): void => {
  const course = getCourseById(courseId);
  if (!course) return;
  setPublishedCourseOrder(courseId, course.orderIndex + direction);
};

export const isStudentEnrolledInCourse = (courseId: string, studentId: string): boolean => {
  const course = getCourseById(courseId);
  if (course) {
    if (course.accessMode === "all") return true;
    if (course.accessMode === "groups") {
      const rule = getCourseAccessRules().find((item) => item.courseId === courseId);
      return courseAccessMatchesGroups(rule?.groupIds ?? [], studentId);
    }
    return course.studentIds.includes(studentId);
  }
  const rule = getCourseAccessRules().find((item) => item.courseId === courseId);
  if (!rule || rule.accessMode === "all") return true;
  if (rule.accessMode === "groups") return courseAccessMatchesGroups(rule.groupIds, studentId);
  return rule.studentIds.includes(studentId);
};

export const getEnrolledCoursesForStudent = (studentId: string) => {
  return getCourseCatalog().filter((course) => isStudentEnrolledInCourse(course.id, studentId));
};

export const getCourseCatalog = () => [
  ...BASE_COURSE_CATALOG,
  ...getPublishedCourses().map((course) => ({
    id: course.id,
    name: course.name,
    moduleId: course.orderIndex + 1,
    difficulty: course.difficulty,
    duration: course.duration,
    tags: course.tags,
    workspaceId: course.workspaceId,
    workspaceName: course.workspaceName,
    courseType: course.courseType,
    builderMode: course.builderMode,
  })),
];

export function createDefaultBlocks(courseType: CourseType): CourseBlock[] {
  if (courseType === "automation") {
    return [
      { id: `block-${Date.now()}-1`, type: "heading", title: "Objectif du module", body: "Expliquez la finalite du workflow ou du processus cible." },
      { id: `block-${Date.now()}-2`, type: "callout", title: "Consignes clefs", body: "Ajoutez ici le contexte metier, les attendus et les points de vigilance.", tone: "required" },
      { id: `block-${Date.now()}-3`, type: "checkpoint", title: "Validation", body: "Le participant doit confirmer qu'il a compris les etapes et les livrables." },
    ];
  }

  if (courseType === "onboarding") {
    return [
      { id: `block-${Date.now()}-1`, type: "heading", title: "Bienvenue", body: "Posez le cadre, l'objectif et les interlocuteurs clefs." },
      { id: `block-${Date.now()}-2`, type: "video", title: "Video d'accueil", videoUrl: "", mandatory: true, lockedSpeed: true, durationSeconds: 180 },
      { id: `block-${Date.now()}-3`, type: "checklist", title: "A faire avant de continuer", items: [{ id: `check-${Date.now()}-1`, label: "Visionner la video d'accueil" }, { id: `check-${Date.now()}-2`, label: "Prendre connaissance des interlocuteurs" }] },
    ];
  }

  return [
    { id: `block-${Date.now()}-1`, type: "heading", title: "Titre de section", body: "Resumez l'objectif du bloc." },
    { id: `block-${Date.now()}-2`, type: "text", title: "Contenu", body: "Ajoutez ici un contenu libre de type document, onboarding ou procedure." },
    { id: `block-${Date.now()}-3`, type: "deliverable", title: "Livrable attendu", body: "Decrivez ici ce que l'apprenant doit produire a la fin du cours." },
  ];
}

export function generateAiQuizSuggestions(input: {
  title: string;
  workspaceName: string;
  courseType: CourseType;
}): QuizQuestion[] {
  const prefix = input.title || input.workspaceName || "ce module";
  return [
    {
      id: `quiz-${Date.now()}-1`,
      prompt: `Quel est l'objectif principal de ${prefix} ?`,
      options: ["Comprendre le cadre attendu", "Ignorer les etapes", "Sauter la validation", "Changer de tenant"],
      correctAnswer: 0,
    },
    {
      id: `quiz-${Date.now()}-2`,
      prompt: "Quelle action est attendue avant de passer a la suite ?",
      options: ["Valider la section precedente", "Accelerer la video", "Supprimer le contenu", "Changer d'espace"],
      correctAnswer: 0,
    },
    {
      id: `quiz-${Date.now()}-3`,
      prompt: `Dans ${input.workspaceName}, que doit permettre ce module ?`,
      options: ["Un parcours coherent et traçable", "Une publication sans cible", "Une progression non sauvegardee", "Un acces sans role"],
      correctAnswer: 0,
    },
  ];
}

function getAllProgress(): CourseProgress[] {
  return readJson(PROGRESS_KEY, []);
}

function saveAllProgress(progress: CourseProgress[]) {
  writeJson(PROGRESS_KEY, progress);
}

export function getCourseProgress(courseId: string, userId = getCurrentUser()?.id): CourseProgress | null {
  if (!userId) return null;
  return getAllProgress().find((item) => item.courseId === courseId && item.userId === userId) ?? null;
}

export function updateCourseProgress(
  courseId: string,
  updater: (current: CourseProgress) => CourseProgress,
  userId = getCurrentUser()?.id,
) {
  if (!userId) return;
  const existing = getCourseProgress(courseId, userId) ?? {
    courseId,
    userId,
    currentBlockId: null,
    completedBlockIds: [],
    completedVideoIds: [],
    completedQuizIds: [],
    progressPercent: 0,
    lastVisitedAt: new Date().toISOString(),
  };
  const next = updater(existing);
  const all = getAllProgress().filter((item) => !(item.courseId === courseId && item.userId === userId));
  saveAllProgress([next, ...all]);
}

export function getAllCourseProgress() {
  return getAllProgress();
}

export function exportWorkspaceCoursesPayload(workspaceId = getCurrentWorkspace()?.id) {
  return {
    exportedAt: new Date().toISOString(),
    workspaceId,
    courses: getPublishedCoursesForWorkspace(workspaceId).map((course) => ({
      ...course,
      tenantId: undefined,
      workspaceId: undefined,
      workspaceName: undefined,
    })),
  };
}

export function importWorkspaceCoursesPayload(payload: { courses?: PublishedCourse[] }, workspaceId = getCurrentWorkspace()?.id, workspaceName = getCurrentWorkspace()?.name ?? "Espace") {
  if (!payload?.courses?.length || !workspaceId) return 0;
  payload.courses.forEach((course, index) => {
    savePublishedCourse({
      ...course,
      id: `course-${Date.now()}-${index}`,
      tenantId: getCurrentTenant().id,
      workspaceId,
      workspaceName,
      publishedAt: new Date().toISOString(),
      orderIndex: index,
      createdByPersonId: getCurrentUser().id,
    });
  });
  return payload.courses.length;
}

export function resetCourseProgress(courseId: string, userId = getCurrentUser()?.id) {
  if (!userId) return;
  saveAllProgress(getAllProgress().filter((item) => !(item.courseId === courseId && item.userId === userId)));
}

export function buildPublishedCourse(input: {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedMinutes: number;
  tags: string[];
  courseType: CourseType;
  builderMode?: CourseBuilderMode;
  templateType?: CourseTemplateType;
  rulePackId?: RulePackId;
  blocks: CourseBlock[];
  accessMode: "all" | "specific" | "groups";
  studentIds: string[];
  workspaceId: string;
  workspaceName: string;
  prerequisites?: CoursePrerequisite[];
  aiAssisted: boolean;
  publishedAt?: string;
  orderIndex?: number;
  createdByPersonId?: string;
  rpaConfig?: RpaCourseConfig;
}) : PublishedCourse {
  const tenant = getCurrentTenant();
  const user = getCurrentUser();
  const resourceBlocks = input.blocks.filter((block) => block.type === "image" || block.type === "video" || block.type === "attachment");
  const quizBlocks = input.blocks.filter((block) => block.type === "quiz");
  const enabledPythonRules = input.rpaConfig?.pythonRules.filter((rule) => rule.enabled).length ?? 0;

  return {
    id: input.id,
    name: input.name,
    description: input.description,
    difficulty: input.difficulty,
    duration: `${Math.max(1, Math.round(input.estimatedMinutes / 60))} h`,
    tags: input.tags,
    resourcesCount: resourceBlocks.length,
    rulesCount: (input.rpaConfig?.validationRules.filter((rule) => rule.enabled !== false).length ?? 0) + enabledPythonRules + quizBlocks.reduce((total, block) => total + (block.type === "quiz" ? block.questions.length : 0), 0),
    outputColumnsCount: input.rpaConfig?.outputColumns.length ?? 0,
    accessMode: input.accessMode,
    studentIds: input.studentIds,
    publishedAt: input.publishedAt ?? new Date().toISOString(),
    orderIndex: input.orderIndex ?? getPublishedCoursesForWorkspace(input.workspaceId).length,
    tenantId: tenant.id,
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
    courseType: input.courseType,
    builderMode: input.builderMode ?? "generic",
    templateType: input.templateType ?? inferTemplateType({ builderMode: input.builderMode ?? "generic", courseType: input.courseType, workspaceName: input.workspaceName, workspaceId: input.workspaceId }),
    rulePackId: input.rulePackId ?? defaultRulePackForTemplate(input.templateType ?? inferTemplateType({ builderMode: input.builderMode ?? "generic", courseType: input.courseType, workspaceName: input.workspaceName, workspaceId: input.workspaceId })),
    prerequisites: input.prerequisites ?? [],
    estimatedMinutes: input.estimatedMinutes,
    createdByPersonId: input.createdByPersonId ?? user.id,
    blocks: input.blocks,
    rpaConfig: input.rpaConfig,
    settings: {
      saveProgress: true,
      videoPlaybackLocked: true,
      aiAssisted: input.aiAssisted,
    },
  };
}
