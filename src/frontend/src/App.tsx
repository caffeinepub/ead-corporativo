import { Toaster } from "@/components/ui/sonner";
import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useActorState,
  useIsAdmin,
  useIsApproved,
  useUserProfile,
} from "./hooks/useQueries";

import AdminPage from "./pages/AdminPage";
import CertificatePage from "./pages/CertificatePage";
import CoursePage from "./pages/CoursePage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LessonPage from "./pages/LessonPage";
import PendingPage from "./pages/PendingPage";
import RegisterPage from "./pages/RegisterPage";
import ValidateCertPage from "./pages/ValidateCertPage";

// ── Simple hash-based router (no library) ──────────────────────────────────

function getHash(): string {
  return window.location.hash.replace(/^#/, "") || "/";
}

export function navigate(path: string) {
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

// ── Network error screen ──────────────────────────────────────────────────────

function NetworkErrorScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "oklch(0.10 0.04 295)" }}
    >
      {/* Star field background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "radial-gradient(1px 1px at 20% 30%, oklch(0.92 0.04 295 / 0.6) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 70% 20%, oklch(0.92 0.04 295 / 0.4) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 45% 75%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 88% 55%, oklch(0.92 0.04 295 / 0.3) 0%, transparent 100%)",
            "radial-gradient(2px 2px at 55% 40%, oklch(0.72 0.18 295 / 0.4) 0%, transparent 100%)",
            "radial-gradient(ellipse at 50% 50%, oklch(0.14 0.07 295) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center">
        {/* Icon */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{
            background: "oklch(0.18 0.07 27 / 0.3)",
            border: "1px solid oklch(0.65 0.22 27 / 0.4)",
          }}
        >
          <WifiOff
            className="h-9 w-9"
            style={{ color: "oklch(0.75 0.20 27)" }}
          />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2
            className="text-2xl font-display font-semibold tracking-tight"
            style={{ color: "oklch(0.93 0.02 295)" }}
          >
            Erro de Conexão
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "oklch(0.58 0.06 295)" }}
          >
            Não foi possível conectar à plataforma. Isso pode ser causado por
            instabilidade na rede ou manutenção no servidor. Aguarde alguns
            instantes e tente novamente.
          </p>
        </div>

        {/* Retry button */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80 active:opacity-60"
          style={{
            background: "oklch(0.62 0.22 295)",
            color: "white",
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>

        <p className="text-xs" style={{ color: "oklch(0.38 0.04 295)" }}>
          &copy; {new Date().getFullYear()}. Built with{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

// ── Loading screen ──────────────────────────────────────────────────────────

function LoadingScreen({ message }: { message: string }) {
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
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
// Uses pure conditional rendering — NO navigate() calls inside effects.
// This eliminates the insertBefore DOM crash entirely.

function Router() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const path = useHash();

  const {
    actor,
    isFetching: actorFetching,
    hasError: actorError,
  } = useActorState();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isApproved, isLoading: approvedLoading } = useIsApproved();

  // Public route — always accessible
  const validateMatch = matchPath("/validate/:code", path);
  if (validateMatch) {
    return <ValidateCertPage code={validateMatch.code} />;
  }

  // Still initializing identity
  if (isInitializing) {
    return <LoadingScreen message="Inicializando..." />;
  }

  // Not logged in — show landing
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Actor failed to initialize (network error or backend crash)
  if (actorError && !actorFetching && !actor) {
    return <NetworkErrorScreen />;
  }

  // Actor still loading
  if (actorFetching) {
    return <LoadingScreen message="Conectando à rede..." />;
  }

  // Logged in but waiting for profile/role queries
  if (profileLoading || adminLoading || approvedLoading) {
    return <LoadingScreen message="Verificando acesso..." />;
  }

  // ── Authenticated routing (pure conditional, no navigate) ──────────────────

  // No profile yet — must register
  if (!profile) {
    return <RegisterPage />;
  }

  // Admin — show admin panel
  if (isAdmin) {
    // Allow sub-routes within admin
    if (path.startsWith("/admin")) {
      return <AdminPage />;
    }
    // Redirect by rendering AdminPage directly (no hash mutation needed)
    return <AdminPage />;
  }

  // Approved user routes
  if (isApproved) {
    if (path === "/dashboard") return <DashboardPage />;

    const courseMatch = matchPath("/course/:id", path);
    if (courseMatch) return <CoursePage courseId={courseMatch.id} />;

    const lessonMatch = matchPath("/lesson/:courseId/:lessonId", path);
    if (lessonMatch)
      return (
        <LessonPage
          courseId={lessonMatch.courseId}
          lessonId={lessonMatch.lessonId}
        />
      );

    const certMatch = matchPath("/certificate/:id", path);
    if (certMatch) return <CertificatePage certId={certMatch.id} />;

    return <DashboardPage />;
  }

  // Waiting for approval
  return <PendingPage />;
}

export default function App() {
  return (
    <>
      <Router />
      <Toaster richColors position="top-right" />
    </>
  );
}
