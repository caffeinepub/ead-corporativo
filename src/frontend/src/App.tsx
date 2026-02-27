import { useEffect, useRef, startTransition } from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  Navigate,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile, useIsAdmin, useIsApproved } from "./hooks/useQueries";
import { getLocalProfile } from "./lib/ead-storage";

// Pages
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import PendingPage from "./pages/PendingPage";
import DashboardPage from "./pages/DashboardPage";
import CoursePage from "./pages/CoursePage";
import LessonPage from "./pages/LessonPage";
import CertificatePage from "./pages/CertificatePage";
import ValidateCertPage from "./pages/ValidateCertPage";
import AdminPage from "./pages/AdminPage";

// ── Route Tree ────────────────────────────────────────────────────────────────

function AppLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isApproved, isLoading: approvedLoading } = useIsApproved();

  const navigate = useNavigate();
  const location = useLocation();
  const hasNavigatedRef = useRef(false);

  const isLoading =
    isInitializing ||
    (isAuthenticated && (profileLoading || adminLoading || approvedLoading));

  useEffect(() => {
    // Reset navigation guard when location changes (after navigation completes)
    const _ = location.pathname; // read to satisfy exhaustive-deps
    void _;
    hasNavigatedRef.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isLoading) return;
    if (hasNavigatedRef.current) return;

    const publicPaths = ["/validate"];
    const isPublicPath = publicPaths.some((p) =>
      location.pathname.startsWith(p)
    );
    if (isPublicPath) return;

    let targetPath: string | null = null;

    if (!profile) {
      if (location.pathname !== "/register") {
        targetPath = "/register";
      }
    } else if (isAdmin) {
      if (
        location.pathname === "/" ||
        location.pathname === "/register" ||
        location.pathname === "/pending"
      ) {
        targetPath = "/admin";
      }
    } else if (!isApproved) {
      if (location.pathname !== "/pending") {
        targetPath = "/pending";
      }
    } else if (
      location.pathname === "/" ||
      location.pathname === "/register" ||
      location.pathname === "/pending"
    ) {
      targetPath = "/dashboard";
    }

    if (targetPath) {
      hasNavigatedRef.current = true;
      const path = targetPath;
      // Use startTransition to defer navigation outside React's render cycle
      startTransition(() => {
        navigate({ to: path as any });
      });
    }
  }, [
    isAuthenticated,
    isLoading,
    profile,
    isAdmin,
    isApproved,
    location.pathname,
    navigate,
  ]);

  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/",
  component: LandingPage,
});

const registerRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/register",
  component: function RegisterGuard() {
    const { identity } = useInternetIdentity();
    if (!identity) return <Navigate to="/" />;
    return <RegisterPage />;
  },
});

const pendingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/pending",
  component: function PendingGuard() {
    const { identity } = useInternetIdentity();
    if (!identity) return <Navigate to="/" />;
    return <PendingPage />;
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/dashboard",
  component: function DashboardGuard() {
    const { identity } = useInternetIdentity();
    if (!identity) return <Navigate to="/" />;
    return <DashboardPage />;
  },
});

const courseRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/course/$id",
  component: function CourseGuard() {
    const { identity } = useInternetIdentity();
    if (!identity) return <Navigate to="/" />;
    return <CoursePage />;
  },
});

const lessonRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/lesson/$courseId/$lessonId",
  component: function LessonGuard() {
    const { identity } = useInternetIdentity();
    if (!identity) return <Navigate to="/" />;
    return <LessonPage />;
  },
});

const certificateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/certificate/$id",
  component: function CertGuard() {
    const { identity } = useInternetIdentity();
    if (!identity) return <Navigate to="/" />;
    return <CertificatePage />;
  },
});

const validateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/validate/$code",
  component: ValidateCertPage,
});

const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin",
  component: function AdminGuard() {
    const { identity } = useInternetIdentity();
    if (!identity) return <Navigate to="/" />;
    return <AdminPage />;
  },
});

const catchAllRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "*",
  component: function CatchAll() {
    return <Navigate to="/" />;
  },
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    indexRoute,
    registerRoute,
    pendingRoute,
    dashboardRoute,
    courseRoute,
    lessonRoute,
    certificateRoute,
    validateRoute,
    adminRoute,
    catchAllRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
