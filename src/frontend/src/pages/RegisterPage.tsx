import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveProfile, useRequestApproval } from "../hooks/useQueries";
import { saveLocalProfile } from "../lib/ead-storage";
import { useActor } from "../hooks/useActor";
import { GraduationCap, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const saveProfile = useSaveProfile();
  const requestApproval = useRequestApproval();
  const { actor } = useActor();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    cpf: "",
    phone: "",
    company: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.cpf.trim() || !form.phone.trim()) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    try {
      // Try to initialize access control — if this is the first user,
      // they will be assigned as admin automatically
      if (actor) {
        try {
          await (actor as any)._initializeAccessControlWithSecret("");
        } catch {
          // Silently ignore — may fail if user is already registered
        }
      }

      // Save profile to backend (name only)
      await saveProfile.mutateAsync(form.name.trim());

      // Save extended profile to localStorage
      saveLocalProfile(principal, {
        cpf: form.cpf.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
      });

      // Check if the user became an admin (first user scenario)
      let isAdmin = false;
      if (actor) {
        try {
          isAdmin = await actor.isCallerAdmin();
        } catch {
          // Silently ignore
        }
      }

      if (isAdmin) {
        toast.success("Bem-vindo, Administrador!");
        navigate({ to: "/admin" });
      } else {
        // Request approval for regular users
        await requestApproval.mutateAsync();
        toast.success("Cadastro realizado! Aguardando aprovação.");
        navigate({ to: "/pending" });
      }
    } catch {
      toast.error("Erro ao salvar cadastro. Tente novamente.");
    }
  };

  const isLoading = saveProfile.isPending || requestApproval.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md page-enter">
        {/* Header brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4"
            style={{ background: "oklch(var(--navy-deep))" }}
          >
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "oklch(var(--navy-deep))" }}
          >
            EAD Corporativo
          </h1>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Criar sua conta</CardTitle>
            <CardDescription>
              Preencha seus dados para solicitar acesso ao curso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Nome completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpf">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={form.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Telefone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Nome da empresa (opcional)"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2"
                style={{
                  background: "oklch(var(--navy-deep))",
                  color: "white",
                }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isLoading ? "Enviando..." : "Solicitar Acesso"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; 2026. Built with love using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
