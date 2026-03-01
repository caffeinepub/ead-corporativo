import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  Loader2,
  RefreshCw,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useActorState } from "../hooks/useQueries";
import { saveLocalProfile } from "../lib/ead-storage";

export default function RegisterPage() {
  const { identity } = useInternetIdentity();
  const {
    actor,
    isFetching: actorFetching,
    hasError: actorError,
  } = useActorState();
  const principal = identity?.getPrincipal().toString() ?? "";
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.cpf.trim()
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!actor) {
      toast.error(
        actorError
          ? "Não foi possível conectar ao servidor. Recarregue a página."
          : "Aguarde a conexão com a rede ser estabelecida.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Save profile to backend (this also assigns role automatically
      // if the backend is configured to do so, or via _initializeAccessControlWithSecret)
      await actor.saveCallerUserProfile({ name: form.name.trim() });

      // Step 2: Save extended profile to localStorage
      if (principal) {
        saveLocalProfile(principal, {
          email: form.email.trim(),
          cpf: form.cpf.trim(),
          phone: form.phone.trim(),
        });
      }

      // Step 3: Try to request approval (only works for #user role, silently skipped for admins)
      try {
        await actor.requestApproval();
      } catch {
        // Silently ignore — admin users don't have a #user role, so this call will fail for them
      }

      // Step 4: Invalidate all queries so the Router re-evaluates the user's state
      await queryClient.invalidateQueries();

      toast.success("Cadastro realizado com sucesso!");
      // The Router (App.tsx) will automatically redirect based on the new role/approval state
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const message = err instanceof Error ? err.message : "Erro desconhecido.";
      if (message.includes("rejected") || message.includes("Unauthorized")) {
        toast.error("Erro de permissão. Tente fazer logout e login novamente.");
      } else if (
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("connection")
      ) {
        toast.error(
          "Erro de conexão. Verifique sua internet e tente novamente.",
        );
      } else {
        toast.error("Não foi possível salvar o cadastro. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "oklch(0.10 0.04 295)" }}
    >
      {/* Star background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "radial-gradient(1px 1px at 15% 25%, oklch(0.92 0.04 295 / 0.7) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 75% 15%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 40% 80%, oklch(0.92 0.04 295 / 0.4) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 90% 60%, oklch(0.92 0.04 295 / 0.6) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 25% 65%, oklch(0.92 0.04 295 / 0.3) 0%, transparent 100%)",
            "radial-gradient(2px 2px at 60% 35%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 85% 90%, oklch(0.92 0.04 295 / 0.4) 0%, transparent 100%)",
            "radial-gradient(ellipse at 50% 50%, oklch(0.14 0.07 295) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      <div className="w-full max-w-md page-enter relative z-10">
        {/* Header brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4 cosmos-glow"
            style={{ background: "oklch(0.20 0.08 295)" }}
          >
            <GraduationCap
              className="h-7 w-7"
              style={{ color: "oklch(0.72 0.18 295)" }}
            />
          </div>
          <h1
            className="text-2xl font-display font-semibold tracking-tight"
            style={{ color: "oklch(0.93 0.02 295)" }}
          >
            EAD Corporativo
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.58 0.06 295)" }}>
            Crie sua conta para começar
          </p>
        </div>

        <Card
          style={{
            background: "oklch(0.14 0.05 295)",
            border: "1px solid oklch(0.24 0.07 295)",
          }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Sparkles
                className="h-4 w-4"
                style={{ color: "oklch(0.62 0.22 295)" }}
              />
              <CardTitle
                className="text-base"
                style={{ color: "oklch(0.93 0.02 295)" }}
              >
                Ficha de Inscrição
              </CardTitle>
            </div>
            <CardDescription style={{ color: "oklch(0.58 0.06 295)" }}>
              Preencha seus dados para solicitar acesso ao curso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" style={{ color: "oklch(0.82 0.06 295)" }}>
                  Nome completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  required
                  disabled={isSubmitting}
                  style={{
                    background: "oklch(0.18 0.06 295)",
                    borderColor: "oklch(0.28 0.08 295)",
                    color: "oklch(0.93 0.02 295)",
                  }}
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  style={{ color: "oklch(0.82 0.06 295)" }}
                >
                  E-mail <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  disabled={isSubmitting}
                  style={{
                    background: "oklch(0.18 0.06 295)",
                    borderColor: "oklch(0.28 0.08 295)",
                    color: "oklch(0.93 0.02 295)",
                  }}
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  style={{ color: "oklch(0.82 0.06 295)" }}
                >
                  Celular <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  required
                  disabled={isSubmitting}
                  style={{
                    background: "oklch(0.18 0.06 295)",
                    borderColor: "oklch(0.28 0.08 295)",
                    color: "oklch(0.93 0.02 295)",
                  }}
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpf" style={{ color: "oklch(0.82 0.06 295)" }}>
                  CPF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={form.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  required
                  disabled={isSubmitting}
                  style={{
                    background: "oklch(0.18 0.06 295)",
                    borderColor: "oklch(0.28 0.08 295)",
                    color: "oklch(0.93 0.02 295)",
                  }}
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !actor || actorError}
                className="w-full mt-2 font-semibold cosmos-glow"
                style={{
                  background: "oklch(0.62 0.22 295)",
                  color: "white",
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isSubmitting ? "Processando..." : "Solicitar Acesso"}
              </Button>

              {/* Actor error state — offer retry */}
              {actorError && !actorFetching && (
                <div
                  className="rounded-lg p-3 flex flex-col items-center gap-2"
                  style={{
                    background: "oklch(0.18 0.07 27 / 0.25)",
                    border: "1px solid oklch(0.65 0.22 27 / 0.35)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <WifiOff
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: "oklch(0.75 0.20 27)" }}
                    />
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.75 0.20 27)" }}
                    >
                      Não foi possível conectar ao servidor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                    style={{ color: "oklch(0.62 0.22 295)" }}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Actor still loading */}
              {!actor && !actorError && actorFetching && (
                <p
                  className="text-xs text-center flex items-center justify-center gap-1.5"
                  style={{ color: "oklch(0.55 0.08 295)" }}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Conectando à rede...
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "oklch(0.42 0.05 295)" }}
        >
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
