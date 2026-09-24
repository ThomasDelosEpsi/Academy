import { Building2, Crown, Layers3, Plus, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addNotification } from "../data/academyStore";
import {
  assignExistingPerson,
  createPersonAndAssign,
  createProductOwner,
  createTenant,
  createWorkspace,
  getCurrentTenant,
  getTenantProductOwners,
  getWorkspaceRoster,
  setCurrentTenant,
  useTenantStore,
  type WorkspaceRole,
} from "../data/tenantStore";

const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  tutor: "Tuteur",
  learner: "Apprenant",
  new_joiner: "Nouvel arrivant",
};

export function AdminTenantSettings() {
  const tenantState = useTenantStore();
  const currentTenant = getCurrentTenant();
  const productOwners = getTenantProductOwners(currentTenant);

  const [tenantForm, setTenantForm] = useState({ name: "", industry: "" });
  const [poForm, setPoForm] = useState({ name: "", email: "", title: "Product Owner" });
  const [workspaceForm, setWorkspaceForm] = useState({ name: "", domain: "", description: "" });
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    title: "",
    workspaceId: currentTenant.workspaces[0]?.id ?? "",
    role: "learner" as WorkspaceRole,
  });
  const [assignForm, setAssignForm] = useState({
    personId: currentTenant.people.find((person) => person.tenantRole === "member")?.id ?? "",
    workspaceId: currentTenant.workspaces[0]?.id ?? "",
    role: "tutor" as WorkspaceRole,
  });

  useEffect(() => {
    setMemberForm((value) => ({
      ...value,
      workspaceId: currentTenant.workspaces[0]?.id ?? "",
    }));
    setAssignForm((value) => ({
      ...value,
      personId: currentTenant.people.find((person) => person.tenantRole === "member")?.id ?? "",
      workspaceId: currentTenant.workspaces[0]?.id ?? "",
    }));
  }, [currentTenant.id, currentTenant.people, currentTenant.workspaces]);

  const tenantMembers = useMemo(
    () => currentTenant.people.filter((person) => person.tenantRole === "member"),
    [currentTenant.people],
  );

  const handleCreateTenant = () => {
    if (!tenantForm.name.trim()) return;
    createTenant(tenantForm);
    setTenantForm({ name: "", industry: "" });
    addNotification({
      kind: "success",
      category: "admin",
      title: "Entreprise creee",
      message: "Le tenant a ete initialise avec un PO entreprise et un espace principal.",
      href: "/admin/tenants",
    });
  };

  const handleCreatePo = () => {
    if (!poForm.name.trim() || !poForm.email.trim()) return;
    createProductOwner(currentTenant.id, poForm);
    setPoForm({ name: "", email: "", title: "Product Owner" });
    addNotification({
      kind: "success",
      category: "admin",
      title: "PO entreprise ajoute",
      message: `Le PO a ete rattache a ${currentTenant.name}.`,
      href: "/admin/tenants",
    });
  };

  const handleCreateWorkspace = () => {
    if (!workspaceForm.name.trim()) return;
    createWorkspace(currentTenant.id, workspaceForm);
    setWorkspaceForm({ name: "", domain: "", description: "" });
    addNotification({
      kind: "success",
      category: "admin",
      title: "Espace cree",
      message: `${workspaceForm.name} est disponible pour le tenant ${currentTenant.name}.`,
      href: "/admin/tenants",
    });
  };

  const handleCreateMember = () => {
    if (!memberForm.name.trim() || !memberForm.email.trim() || !memberForm.workspaceId) return;
    createPersonAndAssign(currentTenant.id, memberForm);
    setMemberForm({
      name: "",
      email: "",
      title: "",
      workspaceId: currentTenant.workspaces[0]?.id ?? "",
      role: "learner",
    });
    addNotification({
      kind: "success",
      category: "admin",
      title: "Membre ajoute",
      message: "Le membre a ete cree et affecte a un espace.",
      href: "/admin/tenants",
    });
  };

  const handleAssignExisting = () => {
    if (!assignForm.personId || !assignForm.workspaceId) return;
    assignExistingPerson(currentTenant.id, assignForm.workspaceId, assignForm.personId, assignForm.role);
    addNotification({
      kind: "info",
      category: "admin",
      title: "Affectation mise a jour",
      message: "Le membre a ete affecte a l'espace selectionne.",
      href: "/admin/tenants",
    });
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.45rem" }}>Tenants et gouvernance</h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Le PO est rattache a l'entreprise. Il cree ensuite les espaces et assigne les tuteurs, apprenants et nouveaux arrivants.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Tenants", value: tenantState.tenants.length },
            { label: "PO entreprise", value: productOwners.length },
            { label: "Espaces", value: currentTenant.workspaces.length },
            { label: "Membres", value: tenantMembers.length },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
              <p className="text-xs" style={{ color: "#9CA3AF", fontWeight: 700 }}>{item.label}</p>
              <p style={{ color: "#111827", fontWeight: 800 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
        <div className="space-y-6">
          <section className="rounded-3xl p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="mb-4 flex items-center gap-2">
              <Building2 size={18} color="#005EFA" />
              <h2 style={{ color: "#111827", fontWeight: 700 }}>Entreprises</h2>
            </div>
            <div className="space-y-3">
              {tenantState.tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => setCurrentTenant(tenant.id)}
                  className="w-full rounded-2xl p-4 text-left"
                  style={{ backgroundColor: tenant.id === currentTenant.id ? "#EFF6FF" : "#F9FAFB", border: `1px solid ${tenant.id === currentTenant.id ? "#BFDBFE" : "#E5E7EB"}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p style={{ color: "#111827", fontWeight: 700 }}>{tenant.name}</p>
                      <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>{tenant.industry}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#FFFFFF", color: "#374151", fontWeight: 700 }}>
                      {getTenantProductOwners(tenant).length} PO
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                value={tenantForm.name}
                onChange={(event) => setTenantForm((value) => ({ ...value, name: event.target.value }))}
                placeholder="Nom de l'entreprise"
                className="rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}
              />
              <input
                value={tenantForm.industry}
                onChange={(event) => setTenantForm((value) => ({ ...value, industry: event.target.value }))}
                placeholder="Secteur"
                className="rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}
              />
            </div>
            <button onClick={handleCreateTenant} className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#005EFA", color: "#FFFFFF", fontWeight: 700 }}>
              <Plus size={14} />
              Creer un tenant
            </button>
          </section>

          <section className="rounded-3xl p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="mb-4 flex items-center gap-2">
              <Crown size={18} color="#D97706" />
              <h2 style={{ color: "#111827", fontWeight: 700 }}>PO de {currentTenant.name}</h2>
            </div>

            <div className="space-y-3">
              {productOwners.map((po) => (
                <div key={po.id} className="rounded-2xl p-4" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
                  <p style={{ color: "#111827", fontWeight: 700 }}>{po.name}</p>
                  <p className="mt-1 text-xs" style={{ color: "#9A3412" }}>{po.title}</p>
                  <p className="mt-1 text-xs" style={{ color: "#C2410C" }}>{po.email}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3">
              <input value={poForm.name} onChange={(event) => setPoForm((value) => ({ ...value, name: event.target.value }))} placeholder="Nom du PO" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }} />
              <input value={poForm.email} onChange={(event) => setPoForm((value) => ({ ...value, email: event.target.value }))} placeholder="Email du PO" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }} />
              <input value={poForm.title} onChange={(event) => setPoForm((value) => ({ ...value, title: event.target.value }))} placeholder="Titre" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }} />
            </div>
            <button onClick={handleCreatePo} className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#D97706", color: "#FFFFFF", fontWeight: 700 }}>
              <Plus size={14} />
              Ajouter un PO
            </button>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="mb-4 flex items-center gap-2">
              <Layers3 size={18} color="#7C3AED" />
              <h2 style={{ color: "#111827", fontWeight: 700 }}>Espaces de {currentTenant.name}</h2>
            </div>
            <div className="space-y-3">
              {currentTenant.workspaces.map((workspace) => (
                <div key={workspace.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p style={{ color: "#111827", fontWeight: 700 }}>{workspace.name}</p>
                      <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>{workspace.domain}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#FFFFFF", color: "#374151", fontWeight: 700 }}>
                      {workspace.assignments.length} membre(s)
                    </span>
                  </div>
                  <p className="mt-3 text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>{workspace.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              <input value={workspaceForm.name} onChange={(event) => setWorkspaceForm((value) => ({ ...value, name: event.target.value }))} placeholder="Nom de l'espace" className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }} />
              <input value={workspaceForm.domain} onChange={(event) => setWorkspaceForm((value) => ({ ...value, domain: event.target.value }))} placeholder="Domaine metier" className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }} />
              <textarea value={workspaceForm.description} onChange={(event) => setWorkspaceForm((value) => ({ ...value, description: event.target.value }))} placeholder="Description de l'espace" rows={3} className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }} />
            </div>
            <button onClick={handleCreateWorkspace} className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#7C3AED", color: "#FFFFFF", fontWeight: 700 }}>
              <Plus size={14} />
              Ajouter un espace
            </button>
          </section>

          <section className="rounded-3xl p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="mb-4 flex items-center gap-2">
              <UserPlus size={18} color="#00A05A" />
              <h2 style={{ color: "#111827", fontWeight: 700 }}>Creer un membre d'espace</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={memberForm.name} onChange={(event) => setMemberForm((value) => ({ ...value, name: event.target.value }))} placeholder="Nom complet" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }} />
              <input value={memberForm.email} onChange={(event) => setMemberForm((value) => ({ ...value, email: event.target.value }))} placeholder="Email" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }} />
              <input value={memberForm.title} onChange={(event) => setMemberForm((value) => ({ ...value, title: event.target.value }))} placeholder="Fonction" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }} />
              <select value={memberForm.workspaceId} onChange={(event) => setMemberForm((value) => ({ ...value, workspaceId: event.target.value }))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}>
                {currentTenant.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
              </select>
              <select value={memberForm.role} onChange={(event) => setMemberForm((value) => ({ ...value, role: event.target.value as WorkspaceRole }))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}>
                {Object.entries(WORKSPACE_ROLE_LABELS).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
              </select>
            </div>
            <button onClick={handleCreateMember} className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#00A05A", color: "#FFFFFF", fontWeight: 700 }}>
              <UserPlus size={14} />
              Ajouter le membre
            </button>
          </section>

          <section className="rounded-3xl p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} color="#005EFA" />
              <h2 style={{ color: "#111827", fontWeight: 700 }}>Affecter un membre existant</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select value={assignForm.personId} onChange={(event) => setAssignForm((value) => ({ ...value, personId: event.target.value }))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}>
                {tenantMembers.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
              <select value={assignForm.workspaceId} onChange={(event) => setAssignForm((value) => ({ ...value, workspaceId: event.target.value }))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}>
                {currentTenant.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
              </select>
              <select value={assignForm.role} onChange={(event) => setAssignForm((value) => ({ ...value, role: event.target.value as WorkspaceRole }))} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}>
                {Object.entries(WORKSPACE_ROLE_LABELS).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
              </select>
            </div>
            <button onClick={handleAssignExisting} className="mt-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#111827", color: "#FFFFFF", fontWeight: 700 }}>
              Mettre a jour l'affectation
            </button>

            <div className="mt-6 space-y-4">
              {currentTenant.workspaces.map((workspace) => (
                <div key={workspace.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p style={{ color: "#111827", fontWeight: 700 }}>{workspace.name}</p>
                      <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>{workspace.domain}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#FFFFFF", color: "#374151", fontWeight: 700 }}>
                      {workspace.assignments.length} role(s)
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {getWorkspaceRoster(currentTenant, workspace.id).map((entry) => (
                      <div key={`${workspace.id}-${entry.personId}`} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                        <div>
                          <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{entry.person?.name ?? "Inconnu"}</p>
                          <p className="text-xs" style={{ color: "#6B7280" }}>{entry.person?.title ?? "-"}</p>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                          {WORKSPACE_ROLE_LABELS[entry.role]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
