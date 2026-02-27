import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Loader2, GraduationCap, Shield, BarChart3, Award, Play } from "lucide-react";

export default function LandingPage() {
  const { login, isLoggingIn, identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate({ to: "/dashboard" });
    }
  }, [identity, navigate]);

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
      <header className="border-b border-border/60 bg-card">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: "oklch(var(--navy-deep))" }}
            >
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span
              className="font-semibold tracking-tight text-sm"
              style={{ color: "oklch(var(--navy-deep))" }}
            >
              EAD Corporativo
            </span>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            size="sm"
            style={{
              background: "oklch(var(--navy-deep))",
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
      </header>

      {/* Hero */}
      <main>
        <section
          className="py-20 md:py-32 relative overflow-hidden"
          style={{ background: "oklch(var(--navy-deep))" }}
        >
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, oklch(0.6 0.15 255) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(0.5 0.12 265) 0%, transparent 40%)",
            }}
          />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center page-enter">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-6"
                style={{
                  background: "oklch(0.35 0.09 258)",
                  color: "oklch(0.75 0.08 258)",
                }}
              >
                <Shield className="h-3 w-3" />
                Plataforma Corporativa de Treinamento
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-6 leading-tight">
                Gestão completa de{" "}
                <span style={{ color: "oklch(0.75 0.12 255)" }}>
                  treinamentos EAD
                </span>{" "}
                para sua empresa
              </h1>
              <p className="text-lg mb-10 leading-relaxed" style={{ color: "oklch(0.72 0.04 258)" }}>
                Controle de acesso, progresso de alunos, relatórios detalhados e
                certificados digitais em uma plataforma segura e auditável.
              </p>
              <Button
                onClick={login}
                disabled={isLoggingIn || isInitializing}
                size="lg"
                className="px-8 h-12 text-base font-medium"
                style={{
                  background: "oklch(0.55 0.18 255)",
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
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 slide-up">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4"
                style={{ color: "oklch(var(--navy-deep))" }}
              >
                Tudo que sua empresa precisa
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Controle total desde o cadastro até a emissão do certificado.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feat, i) => (
                <div
                  key={feat.title}
                  className={`rounded-lg border border-border bg-card p-6 slide-up stagger-${i + 1}`}
                  style={{ boxShadow: "0 1px 3px oklch(0.22 0.065 258 / 0.06)" }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-md mb-4"
                    style={{ background: "oklch(var(--navy-pale))" }}
                  >
                    <feat.icon
                      className="h-5 w-5"
                      style={{ color: "oklch(var(--navy-deep))" }}
                    />
                  </div>
                  <h3 className="font-semibold mb-2 text-sm">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; 2026. Built with love using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
