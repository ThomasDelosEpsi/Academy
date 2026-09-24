import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Dashboard } from "./components/Dashboard";
import { ProjectDetail } from "./components/ProjectDetail";
import { IDE } from "./components/IDE";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminNewCourse } from "./components/AdminNewCourse";
import { AdminCourseCatalog } from "./components/AdminCourseCatalog";
import { AdminBlockedSubmissions } from "./components/AdminBlockedSubmissions";
import { AdminStudentDetail } from "./components/AdminStudentDetail";
import { AdminDrafts } from "./components/AdminDrafts";
import { AdminTenantSettings } from "./components/AdminTenantSettings";
import { AdminTenantLearningPath } from "./components/AdminTenantLearningPath";
import { AdminAtRiskLearners } from "./components/AdminAtRiskLearners";
import { AdminDifficultyCourses } from "./components/AdminDifficultyCourses";
import { LearnerSubmissions } from "./components/LearnerSubmissions";
import { NotificationsCenter } from "./components/NotificationsCenter";
import { ActivityCenter } from "./components/ActivityCenter";
import { MySpace } from "./components/MySpace";
import { MyPlanning } from "./components/MyPlanning";
import { WorkspaceCoursePlayer } from "./components/WorkspaceCoursePlayer";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { FEATURE_FLAGS } from "./config/appConfig";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, Component: Dashboard },
      { path: "mon-espace", Component: MySpace },
      { path: "mon-planning", Component: MyPlanning },
      { path: "soumissions", Component: LearnerSubmissions },
      { path: "notifications", Component: NotificationsCenter },
      { path: "activite", Component: ActivityCenter },
      { path: "projet/:id", Component: ProjectDetail },
      { path: "cours/:id", Component: WorkspaceCoursePlayer },
      ...(FEATURE_FLAGS.ide ? [{ path: "ide/:exerciceId", Component: IDE }] : []),
      {
        path: "admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "apprenants", Component: AdminDashboard },
          { path: "apprenants-a-risque", Component: AdminAtRiskLearners },
          { path: "nouveau-cours", Component: AdminNewCourse },
          { path: "catalogue-cours", Component: AdminCourseCatalog },
          { path: "cours-en-difficulte", Component: AdminDifficultyCourses },
          { path: "parcours-tenant", Component: AdminTenantLearningPath },
          { path: "soumissions-bloquees", Component: AdminBlockedSubmissions },
          { path: "brouillons-a-finir", Component: AdminDrafts },
          { path: "brouillons", Component: AdminDrafts },
          { path: "tenants", Component: AdminTenantSettings },
          { path: "apprenant/:id", Component: AdminStudentDetail },
        ],
      },
    ],
  },
]);
