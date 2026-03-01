import { Button } from "@/components/ui/button";
import { Clock, GraduationCap, LogOut, RefreshCw } from "lucide-react";
import { navigate } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";

export default function PendingPage() {
  const { clear } = useInternetIdentity();
  const { data: profile } = useUserProfile();

  const handleLogout = () => {
    clear();
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: [
          "radial-gradient(1px 1px at 10% 20%, oklch(0.92 0.04 295 / 0.6) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 80% 10%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 55% 75%, oklch(0.92 0.04 295 / 0.4) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 90% 60%, oklch(0.92 0.04 295 / 0.6) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 25% 65%, oklch(0.92 0.04 295 / 0.3) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 70% 30%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
          "radial-gradient(ellipse at 50% 30%, oklch(0.16 0.08 295) 0%, transparent 50%)",
          "radial-gradient(oklch(0.10 0.04 295), oklch(0.08 0.03 295))",
        ].join(", "),
      }}
    >
      {/* Header */}
      <header
        className="flex h-14 items-center justify-between px-6"
        style={{ borderBottom: "1px solid oklch(0.24 0.07 295)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: "oklch(0.20 0.08 295)" }}
          >
            <GraduationCap
              className="h-4 w-4"
              style={{ color: "oklch(0.72 0.18 295)" }}
            />
          </div>
          <span
            className="font-semibold text-sm font-display"
            style={{ color: "oklch(0.93 0.02 295)" }}
          >
            EAD Corporativo
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          style={{ color: "oklch(0.58 0.06 295)" }}
          className="hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center page-enter">
          {/* Icon with glow */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div
              className="h-24 w-24 rounded-full animate-pulse-ring absolute"
              style={{ background: "oklch(0.22 0.10 295 / 0.5)" }}
            />
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center cosmos-glow"
              style={{ background: "oklch(0.20 0.08 295)" }}
            >
              <Clock
                className="h-9 w-9"
                style={{ color: "oklch(0.72 0.22 295)" }}
              />
            </div>
          </div>

          <h1
            className="text-2xl font-display font-semibold mb-3 tracking-tight"
            style={{ color: "oklch(0.93 0.02 295)" }}
          >
            Aguardando aprovação
          </h1>

          {profile?.name && (
            <p
              className="text-sm mb-2"
              style={{ color: "oklch(0.65 0.06 295)" }}
            >
              Olá,{" "}
              <strong style={{ color: "oklch(0.93 0.02 295)" }}>
                {profile.name}
              </strong>
            </p>
          )}

          <p
            className="text-base mb-8 leading-relaxed"
            style={{ color: "oklch(0.58 0.06 295)" }}
          >
            Seu cadastro foi recebido e está em análise. Assim que um
            administrador liberar seu acesso, você poderá iniciar o curso.
          </p>

          <div
            className="rounded-xl p-5 mb-8 text-left"
            style={{
              background: "oklch(0.14 0.05 295)",
              border: "1px solid oklch(0.24 0.07 295)",
            }}
          >
            <p
              className="text-xs font-semibold mb-3 uppercase tracking-wider"
              style={{ color: "oklch(0.62 0.22 295)" }}
            >
              O que acontece agora?
            </p>
            <ol
              className="space-y-2 text-sm"
              style={{ color: "oklch(0.65 0.06 295)" }}
            >
              <li className="flex items-start gap-2">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                  style={{
                    background: "oklch(0.22 0.10 295)",
                    color: "oklch(0.72 0.18 295)",
                  }}
                >
                  1
                </span>
                Seu cadastro foi enviado para o administrador
              </li>
              <li className="flex items-start gap-2">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                  style={{
                    background: "oklch(0.22 0.10 295)",
                    color: "oklch(0.72 0.18 295)",
                  }}
                >
                  2
                </span>
                O administrador analisará suas informações
              </li>
              <li className="flex items-start gap-2">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                  style={{
                    background: "oklch(0.22 0.10 295)",
                    color: "oklch(0.72 0.18 295)",
                  }}
                >
                  3
                </span>
                Você receberá acesso ao curso após aprovação
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              style={{
                borderColor: "oklch(0.32 0.10 295)",
                color: "oklch(0.72 0.18 295)",
                background: "transparent",
              }}
              className="hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar status
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              style={{ color: "oklch(0.58 0.06 295)" }}
              className="hover:bg-white/5"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs" style={{ color: "oklch(0.38 0.04 295)" }}>
          &copy; {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
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
