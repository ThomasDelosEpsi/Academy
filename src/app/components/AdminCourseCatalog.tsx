import { ArrowDown, ArrowUp, Download, Eye, Filter, Pencil, PlusCircle, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { addNotification, getAllCourseSubmissionHistory } from "../data/academyStore";
import { deletePublishedCourse, exportWorkspaceCoursesPayload, getAllCourseProgress, getCourseTemplateLabel, getPublishedCourses, getRulePackLabel, importWorkspaceCoursesPayload, movePublishedCourse, savePublishedCourse, setPublishedCourseOrder } from "../data/courseStore";
import { getCurrentTenant, getCurrentWorkspace, useTenantStore } from "../data/tenantStore";
import { InlineFeedback, useConfirm } from "./FeedbackProvider";

export function AdminCourseCatalog() {
  useTenantStore();
  const confirm = useConfirm();
  const currentTenant = getCurrentTenant();
  const currentWorkspace = getCurrentWorkspace();
  const [refreshKey, setRefreshKey] = useState(0);
  const [domainFilter, setDomainFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [workspaceFilter, setWorkspaceFilter] = useState(currentWorkspace?.id ?? "all");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [bulkWorkspaceTargetId, setBulkWorkspaceTargetId] = useState(currentWorkspace?.id ?? currentTenant.workspaces[0]?.id ?? "");
  const importRef = useRef<HTMLInputElement>(null);

  const tenantCourses = useMemo(
    () => getPublishedCourses().filter((course) => course.tenantId === currentTenant.id),
    [currentTenant.id, refreshKey],
  );

  const courses = useMemo(() => tenantCourses.filter((course) => {
    const workspace = currentTenant.workspaces.find((item) => item.id === course.workspaceId);
    const author = currentTenant.people.find((person) => person.id === course.createdByPersonId);
    const derivedStatus = course.accessMode === "all" ? "open" : course.accessMode === "groups" ? "groups" : "restricted";
    return (workspaceFilter === "all" || course.workspaceId === workspaceFilter)
      && (domainFilter === "all" || workspace?.domain === domainFilter)
      && (templateFilter === "all" || course.templateType === templateFilter)
      && (statusFilter === "all" || derivedStatus === statusFilter)
      && (authorFilter === "all" || author?.id === authorFilter);
  }), [authorFilter, currentTenant.people, currentTenant.workspaces, domainFilter, statusFilter, templateFilter, tenantCourses, workspaceFilter]);

  const difficultyInsights = useMemo(() => {
    const progress = getAllCourseProgress();
    const history = getAllCourseSubmissionHistory();
    return tenantCourses.map((course) => {
      const courseAttempts = history.filter((item) => item.courseId === course.id);
      const failures = courseAttempts.filter((item) => item.outcome === "refused").length;
      const progressRows = progress.filter((item) => item.courseId === course.id);
      const averageProgressPercent = progressRows.length ? Math.round(progressRows.reduce((total, item) => total + item.progressPercent, 0) / progressRows.length) : 0;
      return { course, attempts: courseAttempts.length, failures, averageProgressPercent };
    }).sort((a, b) => b.failures - a.failures || a.averageProgressPercent - b.averageProgressPercent).slice(0, 3);
  }, [tenantCourses]);

  const selectedCourses = useMemo(
    () => tenantCourses.filter((course) => selectedCourseIds.includes(course.id)),
    [selectedCourseIds, tenantCourses],
  );

  useEffect(() => {
    setSelectedCourseIds((current) => current.filter((courseId) => tenantCourses.some((course) => course.id === courseId)));
  }, [tenantCourses]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const resetFilters = () => {
    setDomainFilter("all");
    setTemplateFilter("all");
    setStatusFilter("all");
    setAuthorFilter("all");
    setWorkspaceFilter("all");
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((current) => current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId]);
  };

  const toggleVisibleSelection = () => {
    setSelectedCourseIds((current) => {
      const visibleIds = courses.map((course) => course.id);
      const areAllSelected = visibleIds.length > 0 && visibleIds.every((id) => current.includes(id));
      return areAllSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const handleBulkAssign = () => {
    if (!selectedCourses.length) return;
    selectedCourses.forEach((course) => {
      savePublishedCourse({ ...course, accessMode: "all", studentIds: [] });
    });
    addNotification({
      kind: "success",
      category: "course",
      title: "Cours affectes a l'espace",
      message: `${selectedCourses.length} cours sont maintenant visibles pour tout l'espace cible.`,
      href: "/admin/catalogue-cours",
    });
    setSelectedCourseIds([]);
    refresh();
  };

  const handleBulkRelance = () => {
    if (!selectedCourses.length) return;
    addNotification({
      kind: "info",
      category: "admin",
      title: "Relance en file d'attente",
      message: `${selectedCourses.length} cours ont ete marques pour relance et suivi tuteur.`,
      href: "/admin/catalogue-cours",
    });
    setSelectedCourseIds([]);
  };

  const handleBulkDuplicate = () => {
    if (!selectedCourses.length) return;
    selectedCourses.forEach((course, index) => {
      savePublishedCourse({
        ...course,
        id: `course-copy-${Date.now()}-${index}`,
        name: `${course.name} - Copie`,
        publishedAt: new Date().toISOString(),
        orderIndex: getPublishedCourses().filter((item) => item.workspaceId === course.workspaceId).length,
      });
    });
    addNotification({
      kind: "success",
      category: "course",
      title: "Cours dupliques",
      message: `${selectedCourses.length} copie(s) ont ete ajoutees au catalogue.`,
      href: "/admin/catalogue-cours",
    });
    setSelectedCourseIds([]);
    refresh();
  };

  const handleBulkChangeWorkspace = () => {
    if (!selectedCourses.length || !bulkWorkspaceTargetId) return;
    const targetWorkspace = currentTenant.workspaces.find((workspace) => workspace.id === bulkWorkspaceTargetId);
    if (!targetWorkspace) return;
    selectedCourses.forEach((course) => {
      savePublishedCourse({
        ...course,
        workspaceId: targetWorkspace.id,
        workspaceName: targetWorkspace.name,
        orderIndex: getPublishedCourses().filter((item) => item.workspaceId === targetWorkspace.id && item.id !== course.id).length,
      });
    });
    addNotification({
      kind: "success",
      category: "admin",
      title: "Espace mis a jour",
      message: `${selectedCourses.length} cours ont ete deplaces vers ${targetWorkspace.name}.`,
      href: "/admin/catalogue-cours",
    });
    setSelectedCourseIds([]);
    refresh();
  };

  const handleMove = (courseId: string, direction: -1 | 1) => {
    const course = courses.find((item) => item.id === courseId);
    movePublishedCourse(courseId, direction);
    if (course) {
      addNotification({
        kind: "info",
        category: "course",
        title: "Ordre du parcours mis a jour",
        message: `${course.name} a ete ${direction === -1 ? "remonte" : "descendu"} dans le parcours du workspace.`,
        href: "/admin/catalogue-cours",
      });
    }
    refresh();
  };

  const handlePromote = (courseId: string) => {
    setPublishedCourseOrder(courseId, 0);
    addNotification({
      kind: "success",
      category: "course",
      title: "Ordre du parcours mis a jour",
      message: "Le cours a ete place en P1 et les autres cours ont ete decales.",
      href: "/admin/catalogue-cours",
    });
    refresh();
  };

  const handleDelete = async (courseId: string, courseName: string) => {
    const ok = await confirm({
      title: "Supprimer ce cours ?",
      description: `${courseName} sera retire du catalogue de ${currentWorkspace?.name ?? "cet espace"}.`,
      confirmLabel: "Supprimer",
    });
    if (!ok) return;

    deletePublishedCourse(courseId);
    addNotification({
      kind: "success",
      category: "course",
      title: "Cours supprime",
      message: `${courseName} a ete retire du parcours et son ordre a ete normalise.`,
      href: "/admin/catalogue-cours",
    });
    refresh();
  };

  const handleBulkDelete = async () => {
    if (!selectedCourses.length) return;
    const ok = await confirm({
      title: "Archiver les cours selectionnes ?",
      description: `${selectedCourses.length} cours seront retires du catalogue courant.`,
      confirmLabel: "Archiver",
    });
    if (!ok) return;

    selectedCourses.forEach((course) => deletePublishedCourse(course.id));
    addNotification({
      kind: "success",
      category: "admin",
      title: "Cours archives",
      message: `${selectedCourses.length} cours ont ete retires du catalogue.`,
      href: "/admin/catalogue-cours",
    });
    setSelectedCourseIds([]);
    refresh();
  };

  const exportJson = () => {
    const targetWorkspaceId = workspaceFilter === "all" ? currentWorkspace?.id : workspaceFilter;
    const payload = exportWorkspaceCoursesPayload(targetWorkspaceId);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `academy-parcours-${(targetWorkspaceId ?? "workspace").toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addNotification({ kind: "success", category: "admin", title: "Export JSON termine", message: "Le parcours courant a ete exporte avec son ordre et sa configuration.", href: "/admin/catalogue-cours" });
  };

  const importJson = async (file?: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const targetWorkspaceId = workspaceFilter === "all" ? currentWorkspace?.id : workspaceFilter;
      const workspaceName = currentTenant.workspaces.find((item) => item.id === targetWorkspaceId)?.name ?? currentWorkspace?.name ?? "Espace";
      const imported = importWorkspaceCoursesPayload(payload, targetWorkspaceId, workspaceName);
      addNotification({ kind: "success", category: "admin", title: "Import JSON termine", message: `${imported} cours ont ete recrees dans ${workspaceName}.`, href: "/admin/catalogue-cours" });
      refresh();
    } catch {
      addNotification({ kind: "error", category: "admin", title: "Import JSON impossible", message: "Le fichier JSON n'a pas pu etre lu ou ne respecte pas le format attendu.", href: "/admin/catalogue-cours" });
    }
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ color: "#111827", fontWeight: 800, fontSize: "1.45rem" }}>Catalogue des cours</h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Vue catalogue du tenant avec filtres domaine, type, statut, auteur et espace, plus import/export JSON du parcours.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/parcours-tenant" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#F8FAFC", color: "#334155", fontWeight: 700, border: "1px solid #E5E7EB" }}>
            <Eye size={15} />
            Parcours du tenant
          </Link>
          <button onClick={exportJson} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
            <Download size={15} />
            Export JSON
          </button>
          <button onClick={() => importRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
            <Upload size={15} />
            Import JSON
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={(event) => { void importJson(event.target.files?.[0]); event.currentTarget.value = ""; }} />
          <Link to="/admin/nouveau-cours" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#00A05A", color: "#FFFFFF", fontWeight: 700 }}>
            <PlusCircle size={15} />
            Creer un cours
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-5">
        <label className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <span className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Domaine</span>
          <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="mt-2 w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <option value="all">Tous</option>
            {Array.from(new Set(currentTenant.workspaces.map((workspace) => workspace.domain))).map((domain) => <option key={domain} value={domain}>{domain}</option>)}
          </select>
        </label>
        <label className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <span className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Type</span>
          <select value={templateFilter} onChange={(event) => setTemplateFilter(event.target.value)} className="mt-2 w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <option value="all">Tous</option>
            {Array.from(new Set(tenantCourses.map((course) => course.templateType))).map((type) => <option key={type} value={type}>{getCourseTemplateLabel(type)}</option>)}
          </select>
        </label>
        <label className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <span className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Statut</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <option value="all">Tous</option>
            <option value="open">Tout l'espace</option>
            <option value="groups">Par groupes</option>
            <option value="restricted">Population cible</option>
          </select>
        </label>
        <label className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <span className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Auteur</span>
          <select value={authorFilter} onChange={(event) => setAuthorFilter(event.target.value)} className="mt-2 w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <option value="all">Tous</option>
            {currentTenant.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>
        <label className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <span className="text-xs" style={{ color: "#6B7280", fontWeight: 800 }}>Espace</span>
          <select value={workspaceFilter} onChange={(event) => setWorkspaceFilter(event.target.value)} className="mt-2 w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <option value="all">Tous les espaces</option>
            {currentTenant.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
          </select>
        </label>
      </div>

      {courses.length > 0 && (
        <div className="mb-6 rounded-[24px] p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={toggleVisibleSelection} className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
                {courses.length > 0 && courses.every((course) => selectedCourseIds.includes(course.id)) ? "Tout deselectionner" : "Selectionner les cours visibles"}
              </button>
              <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: selectedCourses.length ? "#DBEAFE" : "#F3F4F6", color: selectedCourses.length ? "#1D4ED8" : "#6B7280", fontWeight: 800 }}>
                {selectedCourses.length} cours selectionne(s)
              </span>
              {!selectedCourses.length && <span className="text-xs" style={{ color: "#6B7280" }}>Selectionne un ou plusieurs cours pour activer les actions de masse.</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleBulkAssign} disabled={!selectedCourses.length} className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: selectedCourses.length ? "#ECFDF5" : "#E5E7EB", color: selectedCourses.length ? "#166534" : "#94A3B8", fontWeight: 700 }}>
                Affecter a tout l'espace
              </button>
              <button onClick={handleBulkRelance} disabled={!selectedCourses.length} className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: selectedCourses.length ? "#EFF6FF" : "#E5E7EB", color: selectedCourses.length ? "#1D4ED8" : "#94A3B8", fontWeight: 700 }}>
                Relancer
              </button>
              <button onClick={handleBulkDuplicate} disabled={!selectedCourses.length} className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: selectedCourses.length ? "#EEF2FF" : "#E5E7EB", color: selectedCourses.length ? "#4338CA" : "#94A3B8", fontWeight: 700 }}>
                Dupliquer
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <select value={bulkWorkspaceTargetId} onChange={(event) => setBulkWorkspaceTargetId(event.target.value)} className="rounded-xl px-4 py-2.5 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  {currentTenant.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
                </select>
                <button onClick={handleBulkChangeWorkspace} disabled={!selectedCourses.length || !bulkWorkspaceTargetId} className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: selectedCourses.length ? "#FFF7ED" : "#E5E7EB", color: selectedCourses.length ? "#9A3412" : "#94A3B8", fontWeight: 700 }}>
                  Changer d'espace
                </button>
              </div>
              <button onClick={() => void handleBulkDelete()} disabled={!selectedCourses.length} className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: selectedCourses.length ? "#FEE2E2" : "#E5E7EB", color: selectedCourses.length ? "#B91C1C" : "#94A3B8", fontWeight: 700 }}>
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
          <InlineFeedback
            title={tenantCourses.length === 0 ? "Aucun cours publie dans ce tenant" : "Aucun cours ne correspond aux filtres actifs"}
            description={tenantCourses.length === 0 ? "Commence par creer un premier cours ou importe un parcours JSON pour alimenter le catalogue." : "Ajuste les filtres ou reviens au catalogue complet pour retrouver les cours deja publies."}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/admin/nouveau-cours" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#00A05A", color: "#FFFFFF", fontWeight: 700 }}>
              <PlusCircle size={14} />
              Creer un cours
            </Link>
            <button onClick={resetFilters} className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
              Reinitialiser les filtres
            </button>
            <button onClick={() => importRef.current?.click()} className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
              Importer un parcours
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course, index) => {
            const workspace = currentTenant.workspaces.find((item) => item.id === course.workspaceId);
            const author = currentTenant.people.find((person) => person.id === course.createdByPersonId);
            return (
              <div key={course.id} className="rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs" style={{ backgroundColor: selectedCourseIds.includes(course.id) ? "#DBEAFE" : "#F3F4F6", color: selectedCourseIds.includes(course.id) ? "#1D4ED8" : "#374151", fontWeight: 700 }}>
                        <input type="checkbox" checked={selectedCourseIds.includes(course.id)} onChange={() => toggleCourseSelection(course.id)} />
                        Selection
                      </label>
                      <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8", fontWeight: 800 }}>P{index + 1}</span>
                      <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F9FAFB", color: "#4B5563", fontWeight: 600 }}>{getCourseTemplateLabel(course.templateType)}</span>
                      <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#EEF2FF", color: "#4338CA", fontWeight: 700 }}>Pack {getRulePackLabel(course.rulePackId)}</span>
                      <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: course.accessMode === "all" ? "#F0FDF4" : "#FFF7ED", color: course.accessMode === "all" ? "#166534" : "#9A3412", fontWeight: 700 }}>
                        {course.accessMode === "all" ? "Tout l'espace" : course.accessMode === "groups" ? "Par groupes" : `Cible restreinte · ${course.studentIds.length}`}
                      </span>
                      <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F8FAFC", color: "#4B5563", fontWeight: 600 }}>{workspace?.name ?? course.workspaceName}</span>
                    </div>

                    <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.1rem" }}>{course.name}</h2>
                    <p className="mt-2 text-sm" style={{ color: "#6B7280", lineHeight: 1.65 }}>{course.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {course.tags.map((tag) => <span key={tag} className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "#F0F9FF", color: "#0369A1", fontWeight: 600 }}>{tag}</span>)}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-5">
                      <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                        <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Duree</p>
                        <p style={{ color: "#111827", fontWeight: 700 }}>{course.duration}</p>
                      </div>
                      <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                        <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Ressources</p>
                        <p style={{ color: "#111827", fontWeight: 700 }}>{course.resourcesCount}</p>
                      </div>
                      <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                        <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Regles</p>
                        <p style={{ color: "#111827", fontWeight: 700 }}>{course.rulesCount}</p>
                      </div>
                      <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                        <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Prerequis</p>
                        <p style={{ color: "#111827", fontWeight: 700 }}>{course.prerequisites.length || "Sequentiel"}</p>
                      </div>
                      <div className="rounded-2xl p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                        <p className="text-xs" style={{ color: "#6B7280", fontWeight: 700 }}>Auteur</p>
                        <p style={{ color: "#111827", fontWeight: 700 }}>{author?.name ?? "Auteur inconnu"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-[320px]">
                    <div className="rounded-[20px] p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                      <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#6B7280", fontWeight: 800 }}>Ordre du parcours</p>

                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => handleMove(course.id, -1)} disabled={index === 0} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: index === 0 ? "#E5E7EB" : "#EFF6FF", color: index === 0 ? "#94A3B8" : "#1D4ED8", fontWeight: 700 }}>
                          <ArrowUp size={14} />
                          Monter
                        </button>
                        <button onClick={() => handleMove(course.id, 1)} disabled={index === courses.length - 1} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: index === courses.length - 1 ? "#E5E7EB" : "#EFF6FF", color: index === courses.length - 1 ? "#94A3B8" : "#1D4ED8", fontWeight: 700 }}>
                          <ArrowDown size={14} />
                          Descendre
                        </button>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                        <select value={index + 1} onChange={(event) => { setPublishedCourseOrder(course.id, Number(event.target.value) - 1); addNotification({ kind: "info", category: "course", title: "Position mise a jour", message: `${course.name} est maintenant en P${event.target.value}.`, href: "/admin/catalogue-cours" }); refresh(); }} className="rounded-xl px-4 py-2.5 text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                          {courses.map((_, orderIndex) => <option key={orderIndex + 1} value={orderIndex + 1}>Position P{orderIndex + 1}</option>)}
                        </select>
                        <button onClick={() => handlePromote(course.id)} className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#111827", color: "#FFFFFF", fontWeight: 700 }}>Passer en P1</button>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Link to={`/admin/nouveau-cours?course=${course.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
                          <Pencil size={14} />
                          Modifier
                        </Link>
                        <Link to={`/cours/${course.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                          <Eye size={14} />
                          Ouvrir
                        </Link>
                      </div>

                      <button onClick={() => void handleDelete(course.id, course.name)} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-[24px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
        <div className="mb-4 flex items-center gap-2">
          <Filter size={16} color="#DC2626" />
          <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1rem" }}>Cours en difficulte</h2>
        </div>
        {difficultyInsights.length === 0 ? (
          <div className="space-y-4">
            <InlineFeedback title="Aucun signal de difficulte pour le moment" description="Les cours les plus en echec ou avec faible progression apparaitront ici automatiquement." tone="success" />
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/parcours-tenant" className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                Voir le parcours du tenant
              </Link>
              <Link to="/admin/nouveau-cours" className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700 }}>
                Enrichir un cours
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {difficultyInsights.map(({ course, failures, attempts, averageProgressPercent }) => (
              <div key={course.id} className="rounded-2xl p-4" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
                <p className="text-sm" style={{ color: "#111827", fontWeight: 800 }}>{course.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>{failures} echec(s)</span>
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{attempts} tentative(s)</span>
                </div>
                <p className="mt-3 text-xs" style={{ color: "#9A3412", lineHeight: 1.6 }}>Progression moyenne observee : {averageProgressPercent}%.</p>
                <Link to={`/admin/nouveau-cours?course=${course.id}`} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "#FFFFFF", color: "#C2410C", fontWeight: 700 }}>Ajuster le cours</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
