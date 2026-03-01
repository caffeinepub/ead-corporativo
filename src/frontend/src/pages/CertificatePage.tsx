import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigate } from "../App";
import AppHeader from "../components/AppHeader";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import { getCertificateForStudent, getLocalProfile } from "../lib/ead-storage";
import type { Certificate } from "../lib/ead-types";

interface CertificatePageProps {
  certId: string;
}

export default function CertificatePage({
  certId: courseId,
}: CertificatePageProps) {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const { data: profile } = useUserProfile();
  const printRef = useRef<HTMLDivElement>(null);

  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    if (!courseId || !principal) return;
    const c = getCertificateForStudent(principal, courseId);
    if (c) {
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
          <div
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-6"
            style={{ background: "oklch(0.18 0.06 295)" }}
          >
            <Award
              className="h-8 w-8"
              style={{ color: "oklch(0.42 0.08 295)" }}
            />
          </div>
          <p className="mb-4" style={{ color: "oklch(0.58 0.06 295)" }}>
            Certificado não encontrado. Conclua o curso primeiro.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate(`/course/${courseId}`)}
            style={{
              borderColor: "oklch(0.32 0.10 295)",
              color: "oklch(0.72 0.18 295)",
              background: "transparent",
            }}
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
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.58 0.06 295)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao curso
          </button>
          <Button
            onClick={handlePrint}
            className="gap-2 cosmos-glow"
            style={{ background: "oklch(0.62 0.22 295)", color: "white" }}
          >
            <Printer className="h-4 w-4" />
            Imprimir certificado
          </Button>
        </div>

        {/* Certificate */}
        <div
          ref={printRef}
          className="certificate-page rounded-2xl p-12 md:p-16 text-center relative overflow-hidden print:rounded-none print:border-0 print:p-8"
          style={{
            border: "2px solid oklch(0.40 0.18 295)",
            minHeight: "600px",
            boxShadow:
              "0 0 40px oklch(0.62 0.22 295 / 0.2), 0 0 100px oklch(0.62 0.22 295 / 0.05)",
          }}
        >
          {/* Star particles decoration */}
          <div
            className="absolute inset-0 pointer-events-none star-1"
            style={{
              backgroundImage: [
                "radial-gradient(1px 1px at 8% 15%, oklch(0.92 0.04 295 / 0.8) 0%, transparent 100%)",
                "radial-gradient(1px 1px at 92% 12%, oklch(0.92 0.04 295 / 0.6) 0%, transparent 100%)",
                "radial-gradient(1px 1px at 15% 85%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
                "radial-gradient(1px 1px at 88% 80%, oklch(0.92 0.04 295 / 0.7) 0%, transparent 100%)",
                "radial-gradient(2px 2px at 50% 5%, oklch(0.92 0.04 295 / 0.4) 0%, transparent 100%)",
                "radial-gradient(1px 1px at 25% 50%, oklch(0.92 0.04 295 / 0.3) 0%, transparent 100%)",
                "radial-gradient(1px 1px at 75% 45%, oklch(0.92 0.04 295 / 0.4) 0%, transparent 100%)",
              ].join(", "),
            }}
          />

          {/* Decorative glow corners */}
          <div
            className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top left, oklch(0.62 0.22 295 / 0.15), transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at bottom right, oklch(0.55 0.25 310 / 0.12), transparent 70%)",
            }}
          />

          {/* Inner border */}
          <div
            className="absolute inset-4 rounded-xl pointer-events-none"
            style={{
              border: "1px solid oklch(0.40 0.14 295 / 0.3)",
            }}
          />

          <div className="relative">
            {/* Logo / Header */}
            <div className="flex justify-center mb-6">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl cosmos-glow"
                style={{ background: "oklch(0.62 0.22 295)" }}
              >
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>

            <p
              className="text-xs font-semibold uppercase tracking-[0.3em] mb-2"
              style={{ color: "oklch(0.72 0.18 295)" }}
            >
              EAD Corporativo
            </p>

            <h1
              className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight"
              style={{ color: "oklch(0.93 0.02 295)" }}
            >
              Certificado de Conclusão
            </h1>

            <div
              className="w-16 h-0.5 mx-auto mb-6"
              style={{ background: "oklch(0.62 0.22 295)" }}
            />

            <p
              className="text-sm mb-2"
              style={{ color: "oklch(0.65 0.06 295)" }}
            >
              Certificamos que
            </p>

            <h2
              className="text-2xl md:text-3xl font-display font-semibold mb-1 tracking-tight"
              style={{ color: "oklch(0.93 0.02 295)" }}
            >
              {cert.studentName}
            </h2>

            {cert.cpf && (
              <p
                className="text-sm mb-4"
                style={{ color: "oklch(0.60 0.06 295)" }}
              >
                CPF: {cert.cpf}
              </p>
            )}

            <p
              className="text-sm mb-2"
              style={{ color: "oklch(0.65 0.06 295)" }}
            >
              concluiu com êxito o curso
            </p>

            <h3
              className="text-lg md:text-xl font-semibold mb-4"
              style={{ color: "oklch(0.82 0.18 295)" }}
            >
              {cert.courseName}
            </h3>

            <p
              className="text-sm mb-8"
              style={{ color: "oklch(0.60 0.06 295)" }}
            >
              em {completionDate}
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div
                className="h-px flex-1 max-w-[80px]"
                style={{ background: "oklch(0.32 0.10 295)" }}
              />
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: "oklch(0.62 0.22 295)" }}
              />
              <div
                className="h-px flex-1 max-w-[80px]"
                style={{ background: "oklch(0.32 0.10 295)" }}
              />
            </div>

            {/* QR Code + validation */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  background: "white",
                  border: "1px solid oklch(0.30 0.10 295)",
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(validationUrl)}&bgcolor=ffffff&color=000000`}
                  alt="QR Code de validação"
                  width={96}
                  height={96}
                />
              </div>
              <div className="text-center">
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "oklch(0.55 0.06 295)" }}
                >
                  Código de validação
                </p>
                <p
                  className="font-mono text-xs font-medium tracking-widest"
                  style={{ color: "oklch(0.82 0.18 295)" }}
                >
                  {cert.code}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "oklch(0.50 0.06 295)" }}
                >
                  Escaneie para verificar autenticidade
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer
        className="py-6 mt-8 print:hidden"
        style={{ borderTop: "1px solid oklch(0.20 0.06 295)" }}
      >
        <div
          className="container mx-auto px-4 text-center text-xs"
          style={{ color: "oklch(0.40 0.05 295)" }}
        >
          &copy; {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
