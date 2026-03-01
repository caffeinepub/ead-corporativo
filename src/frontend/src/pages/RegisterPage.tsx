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
import { GraduationCap, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRequestApproval, useSaveProfile } from "../hooks/useQueries";
import { saveLocalProfile } from "../lib/ead-storage";

export default function RegisterPage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const { actor, isFetching: actorFetching } = useActor();
  const saveProfile = useSaveProfile();
  const requestApproval = useRequestApproval();
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

    // Check actor availability before attempting to save
    if (!actor || actorFetching) {
      toast.error("Conectando à rede, aguarde um momento e tente novamente.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save profile to backend (name only)
      try {
        await saveProfile.mutateAsync(form.name.trim());
      } catch (err) {
        console.error("Erro ao salvar perfil:", err);
        toast.error(
          "Não foi possível salvar o cadastro. Verifique sua conexão e tente novamente.",
        );
        setIsSubmitting(false);
        return;
      }

      // Save extended profile to localStorage
      saveLocalProfile(principal, {
        email: form.email.trim(),
        cpf: form.cpf.trim(),
        phone: form.phone.trim(),
      });

      // Request approval for non-admin users (backend determines if admin)
      // useRequestApproval already swallows errors internally
      await requestApproval.mutateAsync();

      // Give backend a moment to process before invalidating queries
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Invalidate all relevant queries so the navigation guard detects the new state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["isAdmin"] }),
        queryClient.invalidateQueries({ queryKey: ["isApproved"] }),
      ]);

      // Explicitly refetch so the navigation guard sees updated values immediately
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["userProfile"] }),
        queryClient.refetchQueries({ queryKey: ["isAdmin"] }),
        queryClient.refetchQueries({ queryKey: ["isApproved"] }),
      ]);

      toast.success("Cadastro realizado com sucesso!");
    } catch (err) {
      console.error("Erro no cadastro:", err);
      toast.error(
        "Não foi possível salvar o cadastro. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading =
    isSubmitting || saveProfile.isPending || requestApproval.isPending;

  // If actor is still initializing on mount, show a reconnecting state
  if (actorFetching && !actor) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.10 0.04 295)" }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-10 h-10 border-4 rounded-full animate-spin"
            style={{
              borderColor: "oklch(0.62 0.22 295 / 0.2)",
              borderTopColor: "oklch(0.62 0.22 295)",
            }}
          />
          <p className="text-sm" style={{ color: "oklch(0.65 0.06 295)" }}>
            Reconectando à rede...
          </p>
        </div>
      </div>
    );
  }

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
                disabled={isLoading || actorFetching}
                className="w-full mt-2 font-semibold cosmos-glow"
                style={{
                  background: "oklch(0.62 0.22 295)",
                  color: "white",
                }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isLoading
                  ? "Processando..."
                  : actorFetching
                    ? "Aguardando conexão..."
                    : "Solicitar Acesso"}
              </Button>
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
