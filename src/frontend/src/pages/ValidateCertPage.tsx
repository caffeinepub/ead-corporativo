import { Award, CheckCircle, GraduationCap, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getCertificateByCode } from "../lib/ead-storage";
import type { Certificate } from "../lib/ead-types";

interface ValidateCertPageProps {
  code: string;
}

export default function ValidateCertPage({ code }: ValidateCertPageProps) {
  const [cert, setCert] = useState<Certificate | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    const found = getCertificateByCode(code);
    if (found) {
      setCert(found);
    } else {
      setNotFound(true);
    }
  }, [code]);

  const completionDate = cert
    ? new Date(cert.completionDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: [
          "radial-gradient(1px 1px at 10% 20%, oklch(0.92 0.04 295 / 0.6) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 80% 10%, oklch(0.92 0.04 295 / 0.5) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 55% 75%, oklch(0.92 0.04 295 / 0.4) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 90% 60%, oklch(0.92 0.04 295 / 0.6) 0%, transparent 100%)",
          "radial-gradient(ellipse at 50% 30%, oklch(0.16 0.08 295) 0%, transparent 50%)",
          "radial-gradient(oklch(0.10 0.04 295), oklch(0.08 0.03 295))",
        ].join(", "),
      }}
    >
      {/* Header */}
      <header
        className="flex h-14 items-center px-6"
        style={{ borderBottom: "1px solid oklch(0.24 0.07 295)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: "oklch(0.62 0.22 295)" }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span
            className="font-display font-semibold text-sm"
            style={{ color: "oklch(0.93 0.02 295)" }}
          >
            EAD Corporativo — Validação de Certificado
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md page-enter">
          {cert ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: "oklch(0.14 0.05 295)",
                border: "2px solid oklch(0.40 0.18 295)",
                boxShadow: "0 0 40px oklch(0.62 0.22 295 / 0.2)",
              }}
            >
              <div className="flex justify-center mb-4">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.22 0.08 155)" }}
                >
                  <CheckCircle
                    className="h-7 w-7"
                    style={{ color: "oklch(0.60 0.18 155)" }}
                  />
                </div>
              </div>

              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: "oklch(0.60 0.18 155)" }}
              >
                Certificado Válido
              </p>

              <h1
                className="text-xl font-display font-semibold mb-1"
                style={{ color: "oklch(0.93 0.02 295)" }}
              >
                {cert.studentName}
              </h1>
              {cert.cpf && (
                <p
                  className="text-sm mb-4"
                  style={{ color: "oklch(0.60 0.06 295)" }}
                >
                  CPF: {cert.cpf}
                </p>
              )}

              <div
                className="rounded-xl p-4 mb-4 text-left space-y-2"
                style={{
                  background: "oklch(0.18 0.06 295)",
                  border: "1px solid oklch(0.28 0.08 295)",
                }}
              >
                <div className="flex gap-2 text-sm">
                  <span
                    className="w-20 shrink-0"
                    style={{ color: "oklch(0.55 0.06 295)" }}
                  >
                    Curso
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: "oklch(0.85 0.04 295)" }}
                  >
                    {cert.courseName}
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span
                    className="w-20 shrink-0"
                    style={{ color: "oklch(0.55 0.06 295)" }}
                  >
                    Concluído
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: "oklch(0.85 0.04 295)" }}
                  >
                    {completionDate}
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span
                    className="w-20 shrink-0"
                    style={{ color: "oklch(0.55 0.06 295)" }}
                  >
                    Código
                  </span>
                  <span
                    className="font-mono text-xs font-medium"
                    style={{ color: "oklch(0.72 0.18 295)" }}
                  >
                    {cert.code}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center">
                <Award
                  className="h-4 w-4"
                  style={{ color: "oklch(0.62 0.22 295)" }}
                />
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.55 0.06 295)" }}
                >
                  Certificado emitido pela plataforma EAD Corporativo
                </p>
              </div>
            </div>
          ) : notFound ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: "oklch(0.14 0.05 295)",
                border: "2px solid oklch(0.38 0.14 27)",
              }}
            >
              <div className="flex justify-center mb-4">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.22 0.08 27)" }}
                >
                  <XCircle
                    className="h-7 w-7"
                    style={{ color: "oklch(0.65 0.22 27)" }}
                  />
                </div>
              </div>
              <h1
                className="text-xl font-display font-semibold mb-2"
                style={{ color: "oklch(0.93 0.02 295)" }}
              >
                Certificado não encontrado
              </h1>
              <p className="text-sm" style={{ color: "oklch(0.60 0.06 295)" }}>
                O código{" "}
                <span
                  className="font-mono font-medium"
                  style={{ color: "oklch(0.75 0.14 295)" }}
                >
                  {code}
                </span>{" "}
                não corresponde a nenhum certificado emitido.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div
                className="w-8 h-8 border-4 rounded-full animate-spin mx-auto"
                style={{
                  borderColor: "oklch(0.62 0.22 295 / 0.2)",
                  borderTopColor: "oklch(0.62 0.22 295)",
                }}
              />
            </div>
          )}
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
