import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile, useIsAdmin, useIsApproved } from "./hooks/useQueries";

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

// ── Simple hash-based router (no library) ──────────────────────────────────

function getHash(): string {
  return window.location.hash.replace(/^#/, "") || "/";
}

function navigate(path: string) {
  window.location.hash = path;
}

function useHash() {
  const [hash, setHash] = useState(getHash);
  useEffect(() => {
    const handler = () => setHash(getHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return hash;
}

// Export navigate for use in pages
export { navigate };

// ── Route matching helpers ────────────────────────────────────────────────────

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (p !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

// ── Auth Guard & Routing ──────────────────────────────────────────────────────

function Router() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const path = useHash();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isApproved, isLoading: approvedLoading } = useIsApproved();

  const isLoading =
    isInitializing ||
    (isAuthenticated && (profileLoading || adminLoading || approvedLoading));

  // ── Navigation guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    // Public routes — always accessible
    if (path.startsWith("/validate")) return;

    if (!isAuthenticated) {
      // Not logged in: only allow landing page
      if (path !== "/") navigate("/");
      return;
    }

    // Logged in but no profile yet
    if (!profile) {
      if (path !== "/register") navigate("/register");
      return;
    }

    // Admin
    if (isAdmin) {
      const adminAllowed = path.startsWith("/admin");
      if (!adminAllowed) navigate("/admin");
      return;
    }

    // Not approved
    if (!isApproved) {
      if (path !== "/pending") navigate("/pending");
      return;
    }

    // Approved student: redirect away from login/register/pending
    const guestOnlyPaths = ["/", "/register", "/pending"];
    if (guestOnlyPaths.includes(path)) {
      navigate("/dashboard");
    }
  }, [isLoading, isAuthenticated, profile, isAdmin, isApproved, path]);

  // ── Loading screen ──────────────────────────────────────────────────────────
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

  // ── Render page based on current path ───────────────────────────────────────

  // /validate/:code
  const validateMatch = matchPath("/validate/:code", path);
  if (validateMatch) {
    return <ValidateCertPage code={validateMatch.code} />;
  }

  if (path === "/" || path === "") {
    return <LandingPage />;
  }

  if (path === "/register") {
    return <RegisterPage />;
  }

  if (path === "/pending") {
    return <PendingPage />;
  }

  if (path === "/dashboard") {
    return <DashboardPage />;
  }

  // /course/:id
  const courseMatch = matchPath("/course/:id", path);
  if (courseMatch) {
    return <CoursePage courseId={courseMatch.id} />;
  }

  // /lesson/:courseId/:lessonId
  const lessonMatch = matchPath("/lesson/:courseId/:lessonId", path);
  if (lessonMatch) {
    return <LessonPage courseId={lessonMatch.courseId} lessonId={lessonMatch.lessonId} />;
  }

  // /certificate/:id
  const certMatch = matchPath("/certificate/:id", path);
  if (certMatch) {
    return <CertificatePage certId={certMatch.id} />;
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    return <AdminPage />;
  }

  // 404 fallback
  return <LandingPage />;
}

export default function App() {
  return (
    <>
      <Router />
      <Toaster richColors position="top-right" />
    </>
  );
}
