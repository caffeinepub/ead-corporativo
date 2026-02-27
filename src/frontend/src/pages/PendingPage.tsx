import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Clock, LogOut, GraduationCap, RefreshCw } from "lucide-react";
import { useUserProfile } from "../hooks/useQueries";
import { navigate } from "../App";

export default function PendingPage() {
  const { clear } = useInternetIdentity();
  const { data: profile } = useUserProfile();

  const handleLogout = () => {
    clear();
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(var(--navy-deep))" }}
    >
      {/* Header */}
      <header className="flex h-14 items-center justify-between px-6" style={{ borderBottom: "1px solid oklch(0.32 0.07 258)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: "oklch(0.32 0.09 258)" }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-white">EAD Corporativo</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center page-enter">
          {/* Icon */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div
              className="h-24 w-24 rounded-full animate-pulse-ring"
              style={{ background: "oklch(0.32 0.09 258)" }}
            />
            <div
              className="absolute h-20 w-20 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.38 0.12 258)" }}
            >
              <Clock className="h-9 w-9" style={{ color: "oklch(0.75 0.12 255)" }} />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-white mb-3 tracking-tight">
            Aguardando aprovação
          </h1>

          {profile?.name && (
            <p className="text-sm mb-2" style={{ color: "oklch(0.72 0.08 258)" }}>
              Olá, <strong className="text-white">{profile.name}</strong>
            </p>
          )}

          <p className="text-base mb-8 leading-relaxed" style={{ color: "oklch(0.65 0.06 258)" }}>
            Seu cadastro foi recebido e está em análise. Assim que um administrador liberar seu acesso, você poderá iniciar o curso.
          </p>

          <div
            className="rounded-lg p-4 mb-8 text-left"
            style={{ background: "oklch(0.28 0.07 258)" }}
          >
            <p
              className="text-xs font-medium mb-2"
              style={{ color: "oklch(0.65 0.08 255)" }}
            >
              O que acontece agora?
            </p>
            <ol className="space-y-1.5 text-sm" style={{ color: "oklch(0.68 0.05 258)" }}>
              <li>1. Seu cadastro foi enviado para o administrador</li>
              <li>2. O administrador analisará suas informações</li>
              <li>3. Você receberá acesso ao curso após aprovação</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar status
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs" style={{ color: "oklch(0.45 0.04 258)" }}>
          &copy; 2026. Built with love using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
