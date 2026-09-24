import { Outlet, useLocation } from "react-router";
import { FEATURE_FLAGS } from "./config/appConfig";
import { FeedbackProvider } from "./components/FeedbackProvider";
import { AppBreadcrumbs } from "./components/AppBreadcrumbs";
import { Header } from "./components/Header";

export function Root() {
  const location = useLocation();
  const isIDE = FEATURE_FLAGS.ide && location.pathname.startsWith("/ide");
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <FeedbackProvider>
      <div
        className="min-h-screen flex flex-col"
        style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#F4F6F8" }}
      >
        {!isIDE && <Header />}
        {!isIDE && !isAdmin && <AppBreadcrumbs />}
        <main className={isIDE ? "flex-1 flex flex-col overflow-hidden" : "flex-1"}>
          <Outlet />
        </main>
      </div>
    </FeedbackProvider>
  );
}
