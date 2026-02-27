import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import AppHeader from "../components/AppHeader";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import {
  getCertificateForStudent,
  getLocalProfile,
} from "../lib/ead-storage";
import { navigate } from "../App";
import type { Certificate } from "../lib/ead-types";
import { Printer, ArrowLeft, Award } from "lucide-react";

interface CertificatePageProps {
  certId: string;
}

export default function CertificatePage({ certId: courseId }: CertificatePageProps) {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const { data: profile } = useUserProfile();
  const printRef = useRef<HTMLDivElement>(null);

  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    if (!courseId || !principal) return;
    const c = getCertificateForStudent(principal, courseId);
    if (c) {
      // Patch CPF from localStorage if missing
      const localProf = getLocalProfile(principal);
      if (localProf && !c.cpf) {
        c.cpf = localProf.cpf;
      }
      setCert(c);
    }
  }, [courseId, principal]);

  const handlePrint = () => {
    window.print();
  };

  const validationUrl = cert
    ? `${window.location.origin}/#/validate/${cert.code}`
    : "";

  const completionDate = cert
    ? new Date(cert.completionDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  if (!cert) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader userName={profile?.name} />
        <main className="container mx-auto px-4 py-16 text-center">
          <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Certificado não encontrado. Conclua o curso primeiro.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(`/course/${courseId}`)}
          >
            Voltar ao curso
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <AppHeader userName={profile?.name} />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Actions - hidden on print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            type="button"
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao curso
          </button>
          <Button
            onClick={handlePrint}
            style={{ background: "oklch(var(--navy-deep))", color: "white" }}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir certificado
          </Button>
        </div>

        {/* Certificate */}
        <div
          ref={printRef}
          className="certificate-page rounded-xl border-2 p-12 md:p-16 text-center relative overflow-hidden print:rounded-none print:border-0 print:p-8"
          style={{
            borderColor: "oklch(var(--navy-deep))",
            minHeight: "600px",
          }}
        >
          {/* Decorative corner elements */}
          <div
            className="absolute top-0 left-0 w-24 h-24 opacity-10"
            style={{
              background:
                "radial-gradient(circle at top left, oklch(var(--navy-deep)), transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-24 h-24 opacity-10"
            style={{
              background:
                "radial-gradient(circle at bottom right, oklch(var(--navy-deep)), transparent 70%)",
            }}
          />

          {/* Inner border */}
          <div
            className="absolute inset-4 rounded-lg pointer-events-none"
            style={{
              border: "1px solid oklch(var(--navy-deep) / 0.15)",
            }}
          />

          <div className="relative">
            {/* Logo / Header */}
            <div className="flex justify-center mb-6">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl"
                style={{ background: "oklch(var(--navy-deep))" }}
              >
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>

            <p
              className="text-xs font-semibold uppercase tracking-[0.3em] mb-2"
              style={{ color: "oklch(var(--navy-light))" }}
            >
              EAD Corporativo
            </p>

            <h1
              className="font-serif text-3xl md:text-4xl font-semibold mb-6 tracking-tight"
              style={{ color: "oklch(var(--navy-deep))" }}
            >
              Certificado de Conclusao
            </h1>

            <div
              className="w-16 h-px mx-auto mb-6"
              style={{ background: "oklch(var(--navy-deep))" }}
            />

            <p className="text-sm text-muted-foreground mb-2">
              Certificamos que
            </p>

            <h2
              className="text-2xl md:text-3xl font-semibold mb-1 tracking-tight"
              style={{ color: "oklch(var(--navy-deep))" }}
            >
              {cert.studentName}
            </h2>

            {cert.cpf && (
              <p className="text-sm text-muted-foreground mb-4">
                CPF: {cert.cpf}
              </p>
            )}

            <p className="text-sm text-muted-foreground mb-2">
              concluiu com exito o curso
            </p>

            <h3
              className="text-lg md:text-xl font-semibold mb-4"
              style={{ color: "oklch(var(--navy-mid))" }}
            >
              {cert.courseName}
            </h3>

            <p className="text-sm text-muted-foreground mb-8">
              em {completionDate}
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px flex-1 max-w-[80px]" style={{ background: "oklch(var(--border))" }} />
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(var(--navy-mid))" }} />
              <div className="h-px flex-1 max-w-[80px]" style={{ background: "oklch(var(--border))" }} />
            </div>

            {/* QR Code + validation */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="rounded-lg p-3 border"
                style={{ borderColor: "oklch(var(--border))", background: "white" }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(validationUrl)}&bgcolor=ffffff&color=000000`}
                  alt="QR Code de validação"
                  width={96}
                  height={96}
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Codigo de validacao
                </p>
                <p
                  className="font-mono text-xs font-medium tracking-widest"
                  style={{ color: "oklch(var(--navy-deep))" }}
                >
                  {cert.code}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Escaneie para verificar autenticidade
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-8 print:hidden">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          &copy; 2026. Built with love using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
