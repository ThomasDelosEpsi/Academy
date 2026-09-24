import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  PlusCircle,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  Wifi,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import { addNotification, useAcademyStore } from "../data/academyStore";
import { getPublishedCoursesForWorkspace, getWorkspaceLearningMetrics } from "../data/courseStore";
import { getCurrentTenant, getCurrentWorkspace, getWorkspaceRoster } from "../data/tenantStore";
import { AdminCompetitiveLayer } from "./AdminCompetitiveLayer";

const BOTTLENECK_DATA = [
  { module: "P1", name: "SAP & SharePoint", days: 2.1 },
  { module: "P2", name: "Contrats juridiques", days: 3.8 },
  { module: "P3", name: "Reporting finance", days: 5.2 },
  { module: "P4", name: "Onboarding RH", days: 14.3 },
  { module: "P5", name: "Certification", days: 6.0 },
];

export const STUDENTS = [
  { id: "alice-martin", name: "Alice Martin", avatar: "AM", module: "P2 - Contrats Juridiques", moduleId: 2, timeOnModule: "3j 04h", lastSeen: "Il y a 2h", status: "active", risk: false, tutorId: "marie-dupont" },
  { id: "benjamin-leclerc", name: "Benjamin Leclerc", avatar: "BL", module: "P4 - Onboarding RH", moduleId: 4, timeOnModule: "16j 11h", lastSeen: "Il y a 15m", status: "active", risk: true, tutorId: "pierre-garcia" },
  { id: "camille-durand", name: "Camille Durand", avatar: "CD", module: "P4 - Onboarding RH", moduleId: 4, timeOnModule: "13j 08h", lastSeen: "Il y a 1h", status: "active", risk: true, tutorId: "pierre-garcia" },
  { id: "david-bernard", name: "David Bernard", avatar: "DB", module: "P3 - Reporting Finance", moduleId: 3, timeOnModule: "4j 22h", lastSeen: "Il y a 3h", status: "active", risk: false, tutorId: "marie-dupont" },
  { id: "elodie-petit", name: "Elodie Petit", avatar: "EP", module: "P1 - SAP & SharePoint", moduleId: 1, timeOnModule: "1j 14h", lastSeen: "Il y a 30m", status: "active", risk: false, tutorId: "jean-rousseau" },
  { id: "francois-moreau", name: "Francois Moreau", avatar: "FM", module: "P4 - Onboarding RH", moduleId: 4, timeOnModule: "15j 00h", lastSeen: "Hier", status: "inactive", risk: true, tutorId: "pierre-garcia" },
  { id: "gabrielle-simon", name: "Gabrielle Simon", avatar: "GS", module: "P2 - Contrats Juridiques", moduleId: 2, timeOnModule: "2j 08h", lastSeen: "Il y a 5h", status: "active", risk: false, tutorId: "jean-rousseau" },
  { id: "hugo-lambert", name: "Hugo Lambert", avatar: "HL", module: "P5 - Certification", moduleId: 5, timeOnModule: "5j 17h", lastSeen: "Il y a 1h", status: "active", risk: false, tutorId: "marie-dupont" },
];

export const TUTORS = [
  { id: "marie-dupont", name: "Marie Dupont", avatar: "MD", email: "marie.dupont@academy.local", specialty: "SAP & Finance", color: "#7C3AED" },
  { id: "pierre-garcia", name: "Pierre Garcia", avatar: "PG", email: "pierre.garcia@academy.local", specialty: "RH & UiPath", color: "#0369A1" },
  { id: "jean-rousseau", name: "Jean Rousseau", avatar: "JR", email: "jean.rousseau@academy.local", specialty: "Juridique & PDF", color: "#065F46" },
];

function downloadWorkbook(filename: string, rows: Record<string, unknown>[]) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Apprenants");
  XLSX.writeFile(workbook, filename);
}

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Users;
  tone: "blue" | "green" | "orange" | "red";
}) {
  const colors = {
    blue: ["#EFF6FF", "#1D4ED8"],
    green: ["#F0FDF4", "#166534"],
    orange: ["#FFF7ED", "#C2410C"],
    red: ["#FEF2F2", "#B91C1C"],
  }[tone];

  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs" style={{ color: "#64748B", fontWeight: 800 }}>{label}</p>
          <p className="mt-2 text-2xl" style={{ color: "#111827", fontWeight: 850 }}>{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: colors[0], color: colors[1] }}>
          <Icon size={17} />
        </div>
      </div>
      <p className="mt-2 text-xs" style={{ color: "#64748B" }}>{helper}</p>
    </div>
  );
}

function StatusPill({ risk, status }: { risk: boolean; status: string }) {
  if (risk) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", fontWeight: 800 }}>
        <AlertTriangle size={11} /> A risque
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: status === "active" ? "#F0FDF4" : "#F8FAFC", color: status === "active" ? "#166534" : "#64748B", fontWeight: 800 }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status === "active" ? "#22C55E" : "#94A3B8" }} />
      {status === "active" ? "Actif" : "Inactif"}
    </span>
  );
}

export function AdminDashboard() {
  const academyState = useAcademyStore();
  const navigate = useNavigate();
  const currentWorkspace = getCurrentWorkspace();
  const currentTenant = getCurrentTenant();
  const learningMetrics = getWorkspaceLearningMetrics(currentWorkspace?.id);
  const workspaceCourses = getPublishedCoursesForWorkspace(currentWorkspace?.id);
  const workspaceRoster = getWorkspaceRoster(currentTenant, currentWorkspace?.id ?? "");
  const workspaceLearners = workspaceRoster.filter((item) => item.role === "learner" || item.role === "new_joiner");

  const [searchQuery, setSearchQuery] = useState("");
  const [riskOnly, setRiskOnly] = useState(false);
  const [sortKey, setSortKey] = useState<"name" | "module" | "time">("name");

  const riskStudents = STUDENTS.filter((student) => student.risk);
  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return STUDENTS.filter((student) => {
      const matchesQuery = !query || student.name.toLowerCase().includes(query) || student.module.toLowerCase().includes(query);
      const matchesRisk = riskOnly ? student.risk : true;
      return matchesQuery && matchesRisk;
    }).sort((a, b) => {
      if (sortKey === "module") return a.module.localeCompare(b.module);
      if (sortKey === "time") return parseInt(b.timeOnModule, 10) - parseInt(a.timeOnModule, 10);
      return a.name.localeCompare(b.name);
    });
  }, [riskOnly, searchQuery, sortKey]);

  const setupItems = [
    { label: "Espace cree", done: !!currentWorkspace },
    { label: "Cours publies", done: workspaceCourses.length > 0 },
    { label: "Parcours ordonne", done: learningMetrics.totalCourses > 0 },
    { label: "Apprenants affectes", done: workspaceLearners.length > 0 },
  ];

  const actionQueue = [
    { label: "Traiter les blocages P4", helper: "3 apprenants attendent une action", href: "/admin/soumissions-bloquees", tone: "#B91C1C" },
    { label: "Verifier les brouillons", helper: "Publier ou archiver les cours incomplets", href: "/admin/brouillons", tone: "#C2410C" },
    { label: "Revoir le parcours", helper: "Confirmer l'ordre P1/P2/P3", href: "/admin/parcours-tenant", tone: "#1D4ED8" },
  ];

  return (
    <div className="w-full px-4 py-5 md:px-6 xl:px-8 2xl:px-10">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase" style={{ color: "#1D4ED8", fontWeight: 850, letterSpacing: "0.12em" }}>Pilotage</p>
          <h1 className="mt-1 text-2xl" style={{ color: "#111827", fontWeight: 850 }}>Tableau de bord admin</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
            {currentTenant.name} / {currentWorkspace?.name ?? "Aucun espace"} / vue orientee actions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/admin/nouveau-cours" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: "#00A05A", color: "#FFFFFF", fontWeight: 850 }}>
            <PlusCircle size={14} /> Creer un cours
          </Link>
          <button
            onClick={() => downloadWorkbook("academy-apprenants.xlsx", filteredStudents)}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"
            style={{ borderColor: "#E5E7EB", color: "#475569", fontWeight: 800 }}
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Apprenants suivis" value={String(STUDENTS.length)} helper={`${workspaceLearners.length} affecte(s) dans l'espace actif`} icon={Users} tone="blue" />
        <KpiCard label="Cours publies" value={String(learningMetrics.totalCourses)} helper={`${learningMetrics.completedCourses} valides`} icon={BookOpen} tone="green" />
        <KpiCard label="Progression" value={`${learningMetrics.progressPercent}%`} helper={`niveau ${learningMetrics.level}`} icon={TrendingUp} tone="orange" />
        <KpiCard label="A risque" value={String(riskStudents.length)} helper="a traiter en priorite" icon={AlertTriangle} tone="red" />
      </div>

      <AdminCompetitiveLayer
        tenant={currentTenant}
        workspace={currentWorkspace}
        courses={workspaceCourses}
        metrics={learningMetrics}
        learnerCount={workspaceLearners.length}
      />

      <div className="mb-5 grid items-start gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base" style={{ color: "#111827", fontWeight: 850 }}>Parcours tenant</h2>
              <p className="text-sm" style={{ color: "#64748B" }}>Ordre, statut et points de friction visibles en un seul bloc.</p>
            </div>
            <Link to="/admin/parcours-tenant" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 800 }}>
              Gerer <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {BOTTLENECK_DATA.map((item, index) => {
              const blocked = item.days >= 10;
              const done = index < learningMetrics.completedCourses;
              return (
                <Link
                  key={item.module}
                  to="/admin/parcours-tenant"
                  className="rounded-xl border p-3 transition-colors hover:bg-slate-50"
                  style={{ borderColor: blocked ? "#FCA5A5" : done ? "#BBF7D0" : "#E5E7EB", backgroundColor: blocked ? "#FEF2F2" : "#FFFFFF" }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-lg px-2 py-1 text-xs" style={{ backgroundColor: done ? "#DCFCE7" : blocked ? "#FEE2E2" : "#F8FAFC", color: done ? "#166534" : blocked ? "#B91C1C" : "#475569", fontWeight: 850 }}>
                      {item.module}
                    </span>
                    {done ? <CheckCircle2 size={15} color="#16A34A" /> : blocked ? <AlertTriangle size={15} color="#DC2626" /> : <Clock size={15} color="#94A3B8" />}
                  </div>
                  <p className="text-sm" style={{ color: "#111827", fontWeight: 850 }}>{item.name}</p>
                  <p className="mt-2 text-xs" style={{ color: blocked ? "#B91C1C" : "#64748B", fontWeight: blocked ? 800 : 600 }}>{item.days}j moyen</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="text-base" style={{ color: "#111827", fontWeight: 850 }}>File d'actions</h2>
          <div className="mt-4 space-y-3">
            {actionQueue.map((item) => (
              <Link key={item.label} to={item.href} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 hover:bg-slate-50" style={{ borderColor: "#E5E7EB" }}>
                <div>
                  <p className="text-sm" style={{ color: item.tone, fontWeight: 850 }}>{item.label}</p>
                  <p className="mt-1 text-xs" style={{ color: "#64748B" }}>{item.helper}</p>
                </div>
                <ArrowRight size={15} color="#94A3B8" />
              </Link>
            ))}
          </div>

          <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
            <p className="text-xs uppercase" style={{ color: "#64748B", fontWeight: 850, letterSpacing: "0.1em" }}>Setup PO</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {setupItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs" style={{ color: item.done ? "#166534" : "#64748B", fontWeight: 800 }}>
                  <CheckCircle2 size={13} color={item.done ? "#16A34A" : "#CBD5E1"} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mb-5 grid items-start gap-4 2xl:grid-cols-[0.72fr_1.28fr]">
        <section className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={16} color="#1D4ED8" />
            <h2 className="text-base" style={{ color: "#111827", fontWeight: 850 }}>Cours en difficulte</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={BOTTLENECK_DATA} barSize={34} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="module" tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}j`} />
              <Tooltip
                cursor={{ fill: "rgba(15,23,42,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload as (typeof BOTTLENECK_DATA)[number];
                  return (
                    <div className="rounded-xl border bg-white px-3 py-2 text-sm shadow-lg" style={{ borderColor: "#E5E7EB" }}>
                      <p style={{ color: "#111827", fontWeight: 850 }}>{data.name}</p>
                      <p style={{ color: data.days >= 10 ? "#B91C1C" : "#1D4ED8", fontWeight: 800 }}>{data.days} jours</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="days" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                {BOTTLENECK_DATA.map((entry) => (
                  <Cell key={entry.module} fill={entry.days >= 10 ? "#EF4444" : "#2563EB"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center gap-2">
              <Users size={16} color="#111827" />
              <h2 className="text-base" style={{ color: "#111827", fontWeight: 850 }}>Suivi des apprenants</h2>
              <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 850 }}>{filteredStudents.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-[210px] items-center gap-2 rounded-lg border bg-white px-3 py-2" style={{ borderColor: "#E5E7EB" }}>
                <Search size={14} color="#94A3B8" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher..."
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: "#111827" }}
                />
              </div>
              <button
                onClick={() => setRiskOnly((value) => !value)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: riskOnly ? "#FEF2F2" : "#F8FAFC", color: riskOnly ? "#B91C1C" : "#475569", border: `1px solid ${riskOnly ? "#FCA5A5" : "#E5E7EB"}`, fontWeight: 800 }}
              >
                <Filter size={13} />
                {riskOnly ? "Tous" : "A risque"}
              </button>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as "name" | "module" | "time")}
                className="rounded-lg border bg-white px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E5E7EB", color: "#475569", fontWeight: 700 }}
              >
                <option value="name">Nom</option>
                <option value="module">Cours</option>
                <option value="time">Temps</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  {["Apprenant", "Cours actuel", "Temps", "Statut", "Connexion", "Actions"].map((column) => (
                    <th key={column} className="px-4 py-3 text-left text-xs uppercase" style={{ color: "#94A3B8", fontWeight: 850, letterSpacing: "0.06em" }}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} style={{ borderBottom: index < filteredStudents.length - 1 ? "1px solid #F8FAFC" : "none", backgroundColor: student.risk ? "#FFFBFB" : "#FFFFFF" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs text-white" style={{ backgroundColor: student.risk ? "#EF4444" : "#2563EB", fontWeight: 850 }}>{student.avatar}</div>
                        <div>
                          <p className="text-sm" style={{ color: "#111827", fontWeight: 850 }}>{student.name}</p>
                          <p className="text-xs" style={{ color: "#94A3B8" }}>{TUTORS.find((tutor) => tutor.id === student.tutorId)?.name ?? "Tuteur non assigne"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F0F9FF", color: "#0369A1", fontWeight: 800 }}>{student.module}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock size={13} color={student.risk ? "#EF4444" : "#64748B"} />
                        <span className="text-sm" style={{ color: student.risk ? "#B91C1C" : "#334155", fontFamily: "monospace", fontWeight: 850 }}>{student.timeOnModule}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusPill risk={student.risk} status={student.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B", fontWeight: 700 }}>
                        <Wifi size={12} />
                        {student.lastSeen}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/apprenant/${student.id}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 850 }}>
                          <Eye size={12} /> Voir
                        </Link>
                        {student.risk && (
                          <button
                            onClick={() => addNotification({ kind: "warning", title: "Action forcee preparee", message: `${student.name} a ete ajoute a la file de revue tuteur.`, href: `/admin/apprenant/${student.id}` })}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs"
                            style={{ backgroundColor: "#FEF3C7", color: "#92400E", fontWeight: 850 }}
                          >
                            <ShieldCheck size={12} /> Revue
                          </button>
                        )}
                        <button onClick={() => navigate(`/admin/apprenant/${student.id}`)} className="rounded-lg p-1.5 hover:bg-slate-100">
                          <MoreHorizontal size={14} color="#94A3B8" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p style={{ color: "#111827", fontWeight: 850 }}>Aucun apprenant trouve</p>
              <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Modifie la recherche ou retire le filtre a risque.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
