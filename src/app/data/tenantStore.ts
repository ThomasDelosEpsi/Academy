import { useSyncExternalStore } from "react";

const STORAGE_KEY = "academy_tenant_state_v2";
const LEGACY_STORAGE_KEY = "academy_tenant_state_v1";
const STORE_EVENT = "academy-tenant-store-update";

export type TenantRole = "product_owner" | "member";
export type WorkspaceRole = "tutor" | "learner" | "new_joiner";

export type TenantPerson = {
  id: string;
  name: string;
  email: string;
  title: string;
  tenantRole: TenantRole;
  cohort?: string;
  team?: string;
  jobFamily?: string;
  country?: string;
};

export type TenantGroupDimension = "cohort" | "team" | "jobFamily" | "country";

export type TenantGroupOption = {
  id: string;
  label: string;
  dimension: TenantGroupDimension;
  value: string;
  count: number;
};

export type WorkspaceAssignment = {
  personId: string;
  role: WorkspaceRole;
};

export type Workspace = {
  id: string;
  name: string;
  domain: string;
  description: string;
  assignments: WorkspaceAssignment[];
};

export type Tenant = {
  id: string;
  name: string;
  industry: string;
  workspaces: Workspace[];
  people: TenantPerson[];
};

type TenantState = {
  tenants: Tenant[];
  currentTenantId: string;
  currentWorkspaceId: string;
  currentUserId: string;
};

function canUseDom() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function cloneState<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function defaultState(): TenantState {
  return {
    currentUserId: "jean-dupont",
    currentTenantId: "tenant-aurora",
    currentWorkspaceId: "workspace-aurora-rpa",
    tenants: [
      {
        id: "tenant-aurora",
        name: "Aurora Logistics",
        industry: "Supply Chain",
        people: [
          { id: "jean-dupont", name: "Jean Dupont", email: "jean.dupont@aurora.io", title: "Product Owner", tenantRole: "product_owner", cohort: "Spring 2026", team: "Platform", jobFamily: "Operations", country: "France" },
          { id: "marie-nguyen", name: "Marie Nguyen", email: "marie.nguyen@aurora.io", title: "Tutor Lead", tenantRole: "member", cohort: "Spring 2026", team: "Automation", jobFamily: "Technology", country: "France" },
          { id: "camille-roy", name: "Camille Roy", email: "camille.roy@aurora.io", title: "New Joiner", tenantRole: "member", cohort: "Spring 2026", team: "People Ops", jobFamily: "HR", country: "Belgium" },
          { id: "leo-bernard", name: "Leo Bernard", email: "leo.bernard@aurora.io", title: "Learner", tenantRole: "member", cohort: "Spring 2026", team: "Automation", jobFamily: "Technology", country: "France" },
        ],
        workspaces: [
          {
            id: "workspace-aurora-rpa",
            name: "Espace RPA",
            domain: "Automation",
            description: "Automatisation, gouvernance et delivery.",
            assignments: [
              { personId: "marie-nguyen", role: "tutor" },
              { personId: "leo-bernard", role: "learner" },
            ],
          },
          {
            id: "workspace-aurora-rh",
            name: "Espace RH",
            domain: "People",
            description: "Onboarding, formation et process RH.",
            assignments: [{ personId: "camille-roy", role: "new_joiner" }],
          },
        ],
      },
      {
        id: "tenant-nova",
        name: "Nova Retail",
        industry: "Retail",
        people: [
          { id: "sarah-martin", name: "Sarah Martin", email: "sarah.martin@nova.com", title: "Product Owner", tenantRole: "product_owner", cohort: "Retail 2026", team: "Leadership", jobFamily: "Operations", country: "France" },
          { id: "hugo-lemaire", name: "Hugo Lemaire", email: "hugo.lemaire@nova.com", title: "Marketing Tutor", tenantRole: "member", cohort: "Retail 2026", team: "Brand", jobFamily: "Marketing", country: "Spain" },
        ],
        workspaces: [
          {
            id: "workspace-nova-marketing",
            name: "Espace Marketing",
            domain: "Marketing",
            description: "Campagnes, contenu et operations commerciales.",
            assignments: [{ personId: "hugo-lemaire", role: "tutor" }],
          },
        ],
      },
    ],
  };
}

function normalizeState(parsed: Partial<TenantState> | null | undefined): TenantState {
  const base = defaultState();
  const tenants = (parsed?.tenants?.length ? parsed.tenants : base.tenants).map((tenant) => ({
      ...tenant,
      people: tenant.people.map((person) => ({
        ...person,
        tenantRole: (person as TenantPerson).tenantRole ?? (/product owner|platform owner/i.test(person.title) ? "product_owner" : "member"),
        cohort: person.cohort ?? "General",
        team: person.team ?? "General",
        jobFamily: person.jobFamily ?? "General",
        country: person.country ?? "France",
      })),
    workspaces: tenant.workspaces.map((workspace) => ({
      ...workspace,
      assignments: workspace.assignments.filter((assignment) => assignment.role !== ("platform_owner" as WorkspaceRole) && assignment.role !== ("workspace_owner" as WorkspaceRole)),
    })),
  }));

  const currentTenantId = parsed?.currentTenantId ?? base.currentTenantId;
  const currentTenant = tenants.find((tenant) => tenant.id === currentTenantId) ?? tenants[0];
  const currentWorkspaceId = currentTenant.workspaces.some((workspace) => workspace.id === parsed?.currentWorkspaceId)
    ? parsed?.currentWorkspaceId ?? currentTenant.workspaces[0]?.id ?? ""
    : currentTenant.workspaces[0]?.id ?? "";

  return {
    tenants,
    currentTenantId: currentTenant.id,
    currentWorkspaceId,
    currentUserId: parsed?.currentUserId ?? base.currentUserId,
  };
}

function loadState(): TenantState {
  if (!canUseDom()) return defaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

let currentTenantState: TenantState = loadState();

function emitStoreUpdate() {
  if (!canUseDom()) return;
  window.dispatchEvent(new Event(STORE_EVENT));
}

function writeState(next: TenantState) {
  if (!canUseDom()) return;
  currentTenantState = normalizeState(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTenantState));
  emitStoreUpdate();
}

function mutateState(mutator: (draft: TenantState) => void) {
  const draft = cloneState(currentTenantState);
  mutator(draft);
  writeState(draft);
}

function subscribe(listener: () => void) {
  if (!canUseDom()) return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === LEGACY_STORAGE_KEY) {
      currentTenantState = loadState();
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

export function useTenantStore() {
  return useSyncExternalStore(subscribe, () => currentTenantState, () => currentTenantState);
}

export function getTenantState() {
  return currentTenantState;
}

export function getCurrentTenant() {
  return currentTenantState.tenants.find((tenant) => tenant.id === currentTenantState.currentTenantId) ?? currentTenantState.tenants[0];
}

export function getCurrentWorkspace() {
  const tenant = getCurrentTenant();
  return tenant.workspaces.find((workspace) => workspace.id === currentTenantState.currentWorkspaceId) ?? tenant.workspaces[0];
}

export function getCurrentUser() {
  const tenant = getCurrentTenant();
  return tenant.people.find((person) => person.id === currentTenantState.currentUserId) ?? tenant.people[0];
}

export function getCurrentWorkspaceRole(workspaceId = getCurrentWorkspace()?.id): WorkspaceRole | "product_owner" | null {
  const tenant = getCurrentTenant();
  const currentUser = getCurrentUser();
  if (!tenant || !currentUser) return null;
  if (currentUser.tenantRole === "product_owner") return "product_owner";
  const workspace = tenant.workspaces.find((item) => item.id === workspaceId);
  const assignment = workspace?.assignments.find((item) => item.personId === currentUser.id);
  return assignment?.role ?? null;
}

export function getTenantProductOwners(tenant: Tenant) {
  return tenant.people.filter((person) => person.tenantRole === "product_owner");
}

export function getWorkspaceRoster(tenant: Tenant, workspaceId: string) {
  const workspace = tenant.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return [];
  return workspace.assignments.map((assignment) => ({
    ...assignment,
    person: tenant.people.find((person) => person.id === assignment.personId),
  }));
}

export function getTenantGroupOptions(tenant: Tenant, workspaceId?: string): TenantGroupOption[] {
  const rosterIds = workspaceId
    ? new Set(getWorkspaceRoster(tenant, workspaceId).map((assignment) => assignment.personId))
    : null;
  const people = tenant.people.filter((person) => person.tenantRole !== "product_owner" && (!rosterIds || rosterIds.has(person.id)));
  const dimensions: TenantGroupDimension[] = ["cohort", "team", "jobFamily", "country"];
  const options = dimensions.flatMap((dimension) => {
    const counts = new Map<string, number>();
    for (const person of people) {
      const value = person[dimension] ?? "General";
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([value, count]) => ({
      id: `${dimension}:${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      label: `${dimension === "jobFamily" ? "Metier" : dimension === "team" ? "Equipe" : dimension === "country" ? "Pays" : "Cohorte"} · ${value}`,
      dimension,
      value,
      count,
    }));
  });
  return options.sort((a, b) => a.dimension.localeCompare(b.dimension) || a.value.localeCompare(b.value));
}

export function getAccessibleWorkspacesForCurrentUser() {
  const tenant = getCurrentTenant();
  const currentUser = getCurrentUser();
  if (!tenant || !currentUser) return [];
  if (currentUser.tenantRole === "product_owner") return tenant.workspaces;
  return tenant.workspaces.filter((workspace) => workspace.assignments.some((assignment) => assignment.personId === currentUser.id));
}

export function setCurrentTenant(tenantId: string) {
  mutateState((state) => {
    const tenant = state.tenants.find((item) => item.id === tenantId);
    if (!tenant) return;
    state.currentTenantId = tenantId;
    state.currentWorkspaceId = tenant.workspaces[0]?.id ?? "";
    if (!tenant.people.some((person) => person.id === state.currentUserId)) {
      state.currentUserId = tenant.people[0]?.id ?? state.currentUserId;
    }
  });
}

export function setCurrentWorkspace(workspaceId: string) {
  mutateState((state) => {
    const tenant = state.tenants.find((item) => item.id === state.currentTenantId);
    if (!tenant?.workspaces.some((workspace) => workspace.id === workspaceId)) return;
    state.currentWorkspaceId = workspaceId;
  });
}

export function createTenant(input: { name: string; industry: string }) {
  mutateState((state) => {
    const now = Date.now();
    const tenantId = `tenant-${now}`;
    const ownerId = `person-${now + 1}`;
    const workspaceId = `workspace-${now}`;
    state.tenants.unshift({
      id: tenantId,
      name: input.name,
      industry: input.industry,
      people: [
        {
          id: ownerId,
          name: `${input.name} PO`,
          email: `po@${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "academy"}.com`,
          title: "Product Owner",
          tenantRole: "product_owner",
        },
      ],
      workspaces: [
        {
          id: workspaceId,
          name: "Espace principal",
          domain: "General",
          description: "Premier espace du tenant.",
          assignments: [],
        },
      ],
    });
    state.currentTenantId = tenantId;
    state.currentWorkspaceId = workspaceId;
    state.currentUserId = ownerId;
  });
}

export function createProductOwner(
  tenantId: string,
  input: { name: string; email: string; title: string },
) {
  mutateState((state) => {
    const tenant = state.tenants.find((item) => item.id === tenantId);
    if (!tenant) return;
    tenant.people.unshift({
      id: `person-${Date.now()}`,
      name: input.name,
      email: input.email,
      title: input.title || "Product Owner",
      tenantRole: "product_owner",
    });
  });
}

export function createWorkspace(tenantId: string, input: { name: string; domain: string; description: string }) {
  mutateState((state) => {
    const tenant = state.tenants.find((item) => item.id === tenantId);
    if (!tenant) return;
    tenant.workspaces.unshift({
      id: `workspace-${Date.now()}`,
      name: input.name,
      domain: input.domain,
      description: input.description,
      assignments: [],
    });
    if (state.currentTenantId === tenantId) {
      state.currentWorkspaceId = tenant.workspaces[0].id;
    }
  });
}

export function createPersonAndAssign(
  tenantId: string,
  input: {
    name: string;
    email: string;
    title: string;
    workspaceId: string;
    role: WorkspaceRole;
  },
) {
  mutateState((state) => {
    const tenant = state.tenants.find((item) => item.id === tenantId);
    if (!tenant) return;

    const personId = `person-${Date.now()}`;
    tenant.people.unshift({
      id: personId,
      name: input.name,
      email: input.email,
      title: input.title,
      tenantRole: "member",
    });

    const workspace = tenant.workspaces.find((item) => item.id === input.workspaceId);
    if (!workspace) return;
    workspace.assignments.push({
      personId,
      role: input.role,
    });
  });
}

export function assignExistingPerson(
  tenantId: string,
  workspaceId: string,
  personId: string,
  role: WorkspaceRole,
) {
  mutateState((state) => {
    const tenant = state.tenants.find((item) => item.id === tenantId);
    const workspace = tenant?.workspaces.find((item) => item.id === workspaceId);
    const person = tenant?.people.find((item) => item.id === personId);
    if (!tenant || !workspace || !person) return;
    if (person.tenantRole === "product_owner") return;

    const existing = workspace.assignments.find((item) => item.personId === personId);
    if (existing) {
      existing.role = role;
      return;
    }
    workspace.assignments.push({ personId, role });
  });
}
