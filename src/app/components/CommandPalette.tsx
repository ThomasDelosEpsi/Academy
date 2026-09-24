import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "cmdk";
import { BookOpen, Command as CommandIcon, FileText, History, Search, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getAllCourseSubmissionHistory, getLearnerActivity, getFavorites, useAcademyStore } from "../data/academyStore";
import { getDrafts, getPublishedCourses } from "../data/courseStore";
import {
  getCurrentTenant,
  getCurrentUser,
  getCurrentWorkspace,
  getCurrentWorkspaceRole,
  getWorkspaceRoster,
  useTenantStore,
} from "../data/tenantStore";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
};

type PaletteItem = {
  id: string;
  label: string;
  href: string;
  keywords: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  meta?: string;
  iconColor?: string;
};

export function CommandPalette({ open, onOpenChange, initialQuery = "" }: CommandPaletteProps) {
  useAcademyStore();
  useTenantStore();
  const navigate = useNavigate();
  const currentTenant = getCurrentTenant();
  const currentWorkspace = getCurrentWorkspace();
  const currentUser = getCurrentUser();
  const workspaceRole = getCurrentWorkspaceRole(currentWorkspace?.id);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (open) setQuery(initialQuery);
  }, [initialQuery, open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
      if (event.key === "Escape" && open) onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  const workspaceCourses = useMemo(
    () => getPublishedCourses().filter((course) => course.workspaceId === currentWorkspace?.id),
    [currentWorkspace?.id, open],
  );
  const favorites = getFavorites();
  const activity = getLearnerActivity(6);
  const submissions = useMemo(
    () => getAllCourseSubmissionHistory(currentUser?.id).slice(0, 8),
    [currentUser?.id, open],
  );
  const drafts = useMemo(
    () => getDrafts().filter((draft) => !currentWorkspace?.id || draft.formData?.workspaceId === currentWorkspace.id).slice(0, 8),
    [currentWorkspace?.id, open],
  );
  const learners = useMemo(
    () => getWorkspaceRoster(currentTenant, currentWorkspace?.id ?? "").filter((entry) => entry.person).slice(0, 10),
    [currentTenant, currentWorkspace?.id, open],
  );
  const otherTenantPeople = useMemo(() => {
    const workspaceIds = new Set(learners.map((entry) => entry.personId));
    return currentTenant.people
      .filter((person) => person.id !== currentUser?.id && !workspaceIds.has(person.id))
      .slice(0, 10);
  }, [currentTenant.people, currentUser?.id, learners]);

  const quickActions: PaletteItem[] = useMemo(() => {
    const isPo = currentUser?.tenantRole === "product_owner";
    if (isPo) {
      return [
        { id: "quick-create-course", label: "Creer un cours", href: "/admin/nouveau-cours", keywords: "action rapide builder nouveau cours", icon: Sparkles, iconColor: "#1D4ED8" },
        { id: "quick-tenant-path", label: "Publier un parcours", href: "/admin/parcours-tenant", keywords: "action rapide publier parcours ordre tenant", icon: ShieldCheck, iconColor: "#1D4ED8" },
        { id: "quick-blocked", label: "Voir les soumissions", href: "/admin/soumissions-bloquees", keywords: "action rapide soumissions bloquees review", icon: Search, iconColor: "#1D4ED8" },
      ];
    }
    if (workspaceRole === "tutor") {
      return [
        { id: "quick-students", label: "Voir les apprenants", href: "/admin/apprenants", keywords: "action rapide apprenants roster", icon: Users, iconColor: "#1D4ED8" },
        { id: "quick-submissions", label: "Revoir les soumissions", href: "/admin/soumissions-bloquees", keywords: "action rapide soumissions correction", icon: ShieldCheck, iconColor: "#1D4ED8" },
      ];
    }
    return [
      { id: "quick-my-space", label: "Mon espace", href: "/mon-espace", keywords: "action rapide mon espace profil", icon: BookOpen, iconColor: "#1D4ED8" },
      { id: "quick-my-submissions", label: "Mes soumissions", href: "/soumissions", keywords: "action rapide soumissions rendus", icon: History, iconColor: "#1D4ED8" },
      { id: "quick-my-planning", label: "Mon planning", href: "/mon-planning", keywords: "action rapide planning agenda", icon: Sparkles, iconColor: "#1D4ED8" },
    ];
  }, [currentUser?.tenantRole, workspaceRole]);

  const pages: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [
      { id: "page-dashboard", label: "Parcours", href: "/", keywords: "accueil home parcours tableau de bord", icon: BookOpen, iconColor: "#334155" },
      { id: "page-my-space", label: "Mon espace", href: "/mon-espace", keywords: "profil espace apprenant", icon: Users, iconColor: "#334155" },
      { id: "page-submissions", label: "Mes soumissions", href: "/soumissions", keywords: "soumissions rendus historique", icon: ShieldCheck, iconColor: "#334155" },
      { id: "page-notifications", label: "Notifications", href: "/notifications", keywords: "notifications alertes centre", icon: Sparkles, iconColor: "#334155" },
      { id: "page-activity", label: "Activite", href: "/activite", keywords: "activite timeline historique recent", icon: History, iconColor: "#334155" },
    ];

    if (currentUser?.tenantRole === "product_owner" || workspaceRole === "tutor") {
      items.push(
        { id: "page-admin-dashboard", label: "Accueil admin", href: "/admin", keywords: "admin pilotage dashboard", icon: ShieldCheck, iconColor: "#334155" },
        { id: "page-admin-catalog", label: "Catalogue cours", href: "/admin/catalogue-cours", keywords: "catalogue cours liste publie", icon: BookOpen, iconColor: "#334155" },
        { id: "page-admin-new-course", label: "Creer un cours", href: "/admin/nouveau-cours", keywords: "builder creation nouveau cours", icon: Sparkles, iconColor: "#334155" },
        { id: "page-admin-path", label: "Parcours du tenant", href: "/admin/parcours-tenant", keywords: "parcours tenant p1 p2 p3 ordre", icon: ShieldCheck, iconColor: "#334155" },
        { id: "page-admin-risk", label: "Apprenants a risque", href: "/admin/apprenants-a-risque", keywords: "apprenants risque blocage", icon: Users, iconColor: "#334155" },
        { id: "page-admin-difficulty", label: "Cours en difficulte", href: "/admin/cours-en-difficulte", keywords: "cours difficulte echecs", icon: BookOpen, iconColor: "#334155" },
        { id: "page-admin-drafts", label: "Brouillons", href: "/admin/brouillons", keywords: "brouillons drafts cours a finir", icon: FileText, iconColor: "#334155" },
        { id: "page-admin-blocked", label: "Soumissions bloquees", href: "/admin/soumissions-bloquees", keywords: "soumissions bloquees review validation", icon: ShieldCheck, iconColor: "#334155" },
        { id: "page-admin-students", label: "Apprenants", href: "/admin/apprenants", keywords: "apprenants roster participants", icon: Users, iconColor: "#334155" },
      );
    }

    return items;
  }, [currentUser?.tenantRole, workspaceRole]);

  const goTo = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/30 p-4 pt-[12vh]" onClick={() => onOpenChange(false)}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[28px] border bg-white shadow-2xl"
        style={{ borderColor: "#E5E7EB" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "#F1F5F9" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "#EFF6FF" }}>
            <CommandIcon size={18} color="#1D4ED8" />
          </div>
          <div className="min-w-0">
            <p style={{ color: "#111827", fontWeight: 800 }}>Command palette</p>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Recherche un cours, un apprenant, une vue ou une action utile. Raccourci: Ctrl+K
            </p>
          </div>
        </div>

        <Command shouldFilter className="bg-white">
          <div className="border-b px-4 py-3" style={{ borderColor: "#F1F5F9" }}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Rechercher un cours, un brouillon, un apprenant, une soumission..."
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}
            />
          </div>

          <CommandList className="max-h-[55vh] overflow-y-auto px-2 py-2">
            <CommandEmpty className="px-4 py-8 text-sm" style={{ color: "#6B7280" }}>
              Aucun resultat pour cette recherche.
            </CommandEmpty>

            <CommandGroup heading="Actions rapides">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.keywords}`}
                    onSelect={() => goTo(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <Icon size={16} color={item.iconColor} />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator className="my-2 h-px bg-slate-100" />

            <CommandGroup heading="Pages">
              {pages.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.keywords}`}
                    onSelect={() => goTo(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <Icon size={16} color={item.iconColor} />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator className="my-2 h-px bg-slate-100" />

            <CommandGroup heading="Cours de l'espace">
              {workspaceCourses.slice(0, 10).map((course) => (
                <CommandItem
                  key={course.id}
                  value={`${course.name} ${course.description} ${course.tags.join(" ")} cours module projet ${course.workspaceName} ${course.courseType}`}
                  onSelect={() => goTo(`/cours/${course.id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                >
                  <BookOpen size={16} color="#166534" />
                  <span>{course.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="my-2 h-px bg-slate-100" />

            <CommandGroup heading="Brouillons">
              {drafts.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>Aucun brouillon pour cet espace.</div>
              ) : (
                drafts.map((draft) => (
                  <CommandItem
                    key={draft.id}
                    value={`${draft.title} brouillon draft ${draft.formData?.description ?? ""}`}
                    onSelect={() => goTo(`/admin/nouveau-cours?draft=${draft.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <FileText size={16} color="#7C3AED" />
                    <div className="min-w-0">
                      <p className="truncate">{draft.title || "Brouillon sans titre"}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>Etape {draft.step + 1}</p>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>

            <CommandSeparator className="my-2 h-px bg-slate-100" />

            <CommandGroup heading="Apprenants de l'espace">
              {learners.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>Aucun apprenant indexe dans cet espace.</div>
              ) : (
                learners.map((entry) => (
                  <CommandItem
                    key={entry.personId}
                    value={`${entry.person?.name ?? ""} ${entry.person?.email ?? ""} ${entry.person?.title ?? ""} apprenant tutor ${entry.role}`}
                    onSelect={() => goTo(`/admin/apprenant/${entry.personId}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <Users size={16} color="#1D4ED8" />
                    <div className="min-w-0">
                      <p className="truncate">{entry.person?.name ?? entry.personId}</p>
                      <p className="text-xs capitalize" style={{ color: "#6B7280" }}>{entry.role}</p>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>

            <CommandSeparator className="my-2 h-px bg-slate-100" />

            <CommandGroup heading="Autres personnes de l'entreprise">
              {otherTenantPeople.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>Aucune autre personne visible dans cette entreprise.</div>
              ) : (
                otherTenantPeople.map((person) => (
                  <CommandItem
                    key={person.id}
                    value={`${person.name} ${person.email} ${person.title} entreprise ${currentTenant.name} ${person.tenantRole} ${person.team ?? ""} ${person.jobFamily ?? ""}`}
                    onSelect={() => goTo("/admin/apprenants")}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <Users size={16} color="#64748B" />
                    <div className="min-w-0">
                      <p className="truncate">{person.name}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>
                        {person.title} · {person.team ?? "Equipe"}
                      </p>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>

            <CommandSeparator className="my-2 h-px bg-slate-100" />

            <CommandGroup heading="Soumissions recentes">
              {submissions.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>Aucune soumission recente.</div>
              ) : (
                submissions.map((submission) => (
                  <CommandItem
                    key={submission.id}
                    value={`${submission.courseName} ${submission.fileName} soumission rendu tentative ${submission.outcome}`}
                    onSelect={() => goTo("/soumissions")}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <ShieldCheck size={16} color={submission.outcome === "validated" ? "#00A05A" : submission.outcome === "refused" ? "#EF4444" : "#1D4ED8"} />
                    <div className="min-w-0">
                      <p className="truncate">{submission.courseName}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>Tentative {submission.attempt} · {submission.outcome}</p>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>

            <CommandSeparator className="my-2 h-px bg-slate-100" />

            <CommandGroup heading="Favoris">
              {favorites.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>Aucun favori pour le moment.</div>
              ) : (
                favorites.slice(0, 8).map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} favori ${item.type}`}
                    onSelect={() => goTo(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <Star size={16} color="#D97706" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>

            <CommandSeparator className="my-2 h-px bg-slate-100" />

            <CommandGroup heading="Dernieres activites">
              {activity.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>Aucune activite recente.</div>
              ) : (
                activity.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.detail} activite historique recent`}
                    onSelect={() => goTo(item.href ?? "/")}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl px-4 py-3"
                  >
                    <History size={16} color="#6B7280" className="mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm" style={{ color: "#111827", fontWeight: 700 }}>{item.title}</p>
                      <p className="text-xs" style={{ color: "#6B7280", lineHeight: 1.5 }}>{item.detail}</p>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
