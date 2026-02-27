import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
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

function AppRouter() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const principal = identity?.getPrincipal().toString() ?? "";

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isApproved, isLoading: approvedLoading } = useIsApproved();

  const navigate = useNavigate();
  const location = useLocation();

  const isLoading =
    isInitializing ||
    (isAuthenticated &&
      (profileLoading || adminLoading || approvedLoading));

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isLoading) return;

    const publicPaths = ["/validate"];
    const isPublicPath = publicPaths.some((p) => location.pathname.startsWith(p));
    if (isPublicPath) return;

    if (!profile) {
      if (location.pathname !== "/register") navigate("/register");
      return;
    }

    // Check if local profile exists (CPF etc.)
    const localProfile = getLocalProfile(principal);
    if (!localProfile && location.pathname !== "/register") {
      navigate("/register");
      return;
    }

    if (isAdmin) {
      if (location.pathname === "/" || location.pathname === "/register" || location.pathname === "/pending") {
        navigate("/admin");
      }
      return;
    }

    if (!isApproved) {
      if (location.pathname !== "/pending") navigate("/pending");
      return;
    }

    if (
      location.pathname === "/" ||
      location.pathname === "/register" ||
      location.pathname === "/pending"
    ) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, profile, isAdmin, isApproved, location.pathname, navigate, principal]);

  if (isLoading && isAuthenticated && location.pathname !== "/") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/validate/:code" element={<ValidateCertPage />} />

      {/* Auth required */}
      <Route
        path="/register"
        element={isAuthenticated ? <RegisterPage /> : <Navigate to="/" />}
      />
      <Route
        path="/pending"
        element={isAuthenticated ? <PendingPage /> : <Navigate to="/" />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/" />}
      />
      <Route
        path="/course/:id"
        element={isAuthenticated ? <CoursePage /> : <Navigate to="/" />}
      />
      <Route
        path="/lesson/:courseId/:lessonId"
        element={isAuthenticated ? <LessonPage /> : <Navigate to="/" />}
      />
      <Route
        path="/certificate/:id"
        element={isAuthenticated ? <CertificatePage /> : <Navigate to="/" />}
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={isAuthenticated ? <AdminPage /> : <Navigate to="/" />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}
