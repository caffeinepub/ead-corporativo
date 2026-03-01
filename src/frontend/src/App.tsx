import { Toaster } from "@/components/ui/sonner";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin, useIsApproved, useUserProfile } from "./hooks/useQueries";

import AdminPage from "./pages/AdminPage";
import CertificatePage from "./pages/CertificatePage";
import CoursePage from "./pages/CoursePage";
import DashboardPage from "./pages/DashboardPage";
// Pages
import LandingPage from "./pages/LandingPage";
import LessonPage from "./pages/LessonPage";
import PendingPage from "./pages/PendingPage";
import RegisterPage from "./pages/RegisterPage";
import ValidateCertPage from "./pages/ValidateCertPage";

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

function matchPath(
  pattern: string,
  path: string,
): Record<string, string> | null {
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

  const {
    data: profile,
    isLoading: profileLoading,
    isFetching: profileFetching,
  } = useUserProfile();
  const {
    data: isAdmin,
    isLoading: adminLoading,
    isFetching: adminFetching,
  } = useIsAdmin();
  const {
    data: isApproved,
    isLoading: approvedLoading,
    isFetching: approvedFetching,
  } = useIsApproved();

  const isLoading =
    isInitializing ||
    (isAuthenticated &&
      (profileLoading ||
        adminLoading ||
        approvedLoading ||
        profileFetching ||
        adminFetching ||
        approvedFetching));

  // ── Navigation guard ────────────────────────────────────────────────────────
  const navigatingRef = useRef(false);
  const pendingNavRef = useRef<string | null>(null);

  // Reset navigation locks when path actually changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on path change
  useEffect(() => {
    navigatingRef.current = false;
    pendingNavRef.current = null;
  }, [path]);

  // Phase 1: Compute the desired destination (pure logic, no DOM side-effects)
  useEffect(() => {
    if (isLoading) return;
    if (navigatingRef.current) return;

    // Public routes — always accessible
    if (path.startsWith("/validate")) return;

    if (!isAuthenticated) {
      if (path !== "/") pendingNavRef.current = "/";
      return;
    }

    // profile === undefined means the query hasn't resolved yet — wait
    if (profile === undefined) return;

    // profile === null means loaded but user has no profile yet → register
    if (profile === null) {
      if (path !== "/register") pendingNavRef.current = "/register";
      return;
    }

    // Admin
    if (isAdmin) {
      if (!path.startsWith("/admin")) pendingNavRef.current = "/admin";
      return;
    }

    // Not approved
    if (!isApproved) {
      if (path !== "/pending") pendingNavRef.current = "/pending";
      return;
    }

    // Approved student: redirect away from landing/register/pending
    const guestOnlyPaths = ["/", "/register", "/pending"];
    if (guestOnlyPaths.includes(path)) {
      pendingNavRef.current = "/dashboard";
    }
  }, [isLoading, isAuthenticated, profile, isAdmin, isApproved, path]);

  // Phase 2: Execute navigation AFTER React has finished rendering (post-paint)
  // Using useLayoutEffect + setTimeout(0) defers the hash change until after
  // React completes its reconciliation, preventing the insertBefore DOM crash.
  useLayoutEffect(() => {
    const dest = pendingNavRef.current;
    if (!dest || navigatingRef.current) return;

    const timer = setTimeout(() => {
      const current = pendingNavRef.current;
      if (!current || navigatingRef.current) return;
      navigatingRef.current = true;
      pendingNavRef.current = null;
      navigate(current);
    }, 0);

    return () => clearTimeout(timer);
  });

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-4 rounded-full animate-spin"
            style={{
              borderColor: "oklch(0.62 0.22 295 / 0.2)",
              borderTopColor: "oklch(0.62 0.22 295)",
            }}
          />
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
    return (
      <LessonPage
        courseId={lessonMatch.courseId}
        lessonId={lessonMatch.lessonId}
      />
    );
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
