import { Button } from "@/components/ui/button";
import {
  Award,
  BarChart3,
  GraduationCap,
  Loader2,
  Play,
  Shield,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LandingPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  const features = [
    {
      icon: Play,
      title: "Player Controlado",
      desc: "Vídeo sem avanço para garantir 100% do conteúdo assistido.",
    },
    {
      icon: Shield,
      title: "Controle de Acesso",
      desc: "Aprovação administrativa antes de liberar o acesso ao aluno.",
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      desc: "Rastreamento completo de tempo, progresso e acessos.",
    },
    {
      icon: Award,
      title: "Certificado Digital",
      desc: "Certificado automático com QR Code para validação.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header
        className="border-b sticky top-0 z-40 backdrop-blur-sm"
        style={{
          background: "oklch(0.12 0.05 295 / 0.9)",
          borderColor: "oklch(0.24 0.07 295)",
        }}
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: "oklch(0.62 0.22 295)" }}
            >
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span
              className="font-semibold tracking-tight text-sm font-display"
              style={{ color: "oklch(0.93 0.02 295)" }}
            >
              EAD Corporativo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              size="sm"
              variant="outline"
              className="hover:opacity-90 transition-opacity gap-1.5"
              style={{
                borderColor: "oklch(0.40 0.14 295)",
                color: "oklch(0.72 0.18 295)",
                background: "oklch(0.16 0.06 295 / 0.6)",
              }}
            >
              {isLoggingIn ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Shield className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Painel Admin</span>
              <span className="sm:hidden">Admin</span>
            </Button>
            <Button
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              size="sm"
              style={{
                background: "oklch(0.62 0.22 295)",
                color: "white",
              }}
              className="hover:opacity-90 transition-opacity"
            >
              {isLoggingIn ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section
          className="py-24 md:py-36 relative overflow-hidden"
          style={{
            backgroundImage: [
              "radial-gradient(1px 1px at 10% 20%, oklch(0.92 0.04 295 / 0.8) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 80% 10%, oklch(0.92 0.04 295 / 0.6) 0%, transparent 100%)",
              "radial-gradient(2px 2px at 50% 70%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 30% 50%, oklch(0.92 0.04 295 / 0.4) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 65% 85%, oklch(0.92 0.04 295 / 0.7) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 20% 90%, oklch(0.92 0.04 295 / 0.3) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 90% 40%, oklch(0.92 0.04 295 / 0.6) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 45% 15%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 70% 55%, oklch(0.92 0.04 295 / 0.4) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 5% 60%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
              "radial-gradient(ellipse at 30% 40%, oklch(0.18 0.10 295) 0%, transparent 50%)",
              "radial-gradient(ellipse at 70% 70%, oklch(0.14 0.08 310) 0%, transparent 40%)",
              "radial-gradient(oklch(0.12 0.05 295), oklch(0.08 0.03 295))",
            ].join(", "),
          }}
        >
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center page-enter">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-6"
                style={{
                  background: "oklch(0.22 0.08 295)",
                  color: "oklch(0.72 0.18 295)",
                  border: "1px solid oklch(0.32 0.10 295)",
                }}
              >
                <Shield className="h-3 w-3" />
                Plataforma Corporativa de Treinamento
              </div>
              <h1
                className="text-4xl md:text-6xl font-display font-semibold tracking-tight mb-6 leading-tight"
                style={{ color: "oklch(0.93 0.02 295)" }}
              >
                Gestão completa de{" "}
                <span style={{ color: "oklch(0.72 0.22 295)" }}>
                  treinamentos EAD
                </span>{" "}
                para sua empresa
              </h1>
              <p
                className="text-lg mb-10 leading-relaxed"
                style={{ color: "oklch(0.65 0.06 295)" }}
              >
                Controle de acesso, progresso de alunos, relatórios detalhados e
                certificados digitais em uma plataforma segura e auditável.
              </p>
              <Button
                onClick={login}
                disabled={isLoggingIn || isInitializing}
                size="lg"
                className="px-8 h-12 text-base font-semibold cosmos-glow"
                style={{
                  background: "oklch(0.62 0.22 295)",
                  color: "white",
                }}
              >
                {isLoggingIn ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                {isLoggingIn ? "Conectando..." : "Acessar Plataforma"}
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          className="py-16 md:py-24"
          style={{ background: "oklch(0.10 0.04 295)" }}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 slide-up">
              <h2
                className="text-2xl md:text-3xl font-display font-semibold mb-4"
                style={{ color: "oklch(0.93 0.02 295)" }}
              >
                Tudo que sua empresa precisa
              </h2>
              <p
                className="max-w-xl mx-auto"
                style={{ color: "oklch(0.58 0.06 295)" }}
              >
                Controle total desde o cadastro até a emissão do certificado.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feat, i) => (
                <div
                  key={feat.title}
                  className={`rounded-xl p-6 slide-up stagger-${i + 1} group hover:cosmos-glow transition-all duration-300`}
                  style={{
                    background: "oklch(0.14 0.05 295)",
                    border: "1px solid oklch(0.24 0.07 295)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "oklch(0.40 0.14 295)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "oklch(0.24 0.07 295)";
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg mb-4"
                    style={{ background: "oklch(0.20 0.08 295)" }}
                  >
                    <feat.icon
                      className="h-5 w-5"
                      style={{ color: "oklch(0.72 0.18 295)" }}
                    />
                  </div>
                  <h3
                    className="font-semibold mb-2 text-sm"
                    style={{ color: "oklch(0.93 0.02 295)" }}
                  >
                    {feat.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "oklch(0.58 0.06 295)" }}
                  >
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="py-8"
        style={{
          borderTop: "1px solid oklch(0.24 0.07 295)",
          background: "oklch(0.10 0.04 295)",
        }}
      >
        <div
          className="container mx-auto px-4 text-center text-sm"
          style={{ color: "oklch(0.42 0.05 295)" }}
        >
          &copy; {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
