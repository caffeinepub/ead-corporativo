import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCertificateByCode } from "../lib/ead-storage";
import type { Certificate } from "../lib/ead-types";
import { CheckCircle, XCircle, Award, GraduationCap } from "lucide-react";

export default function ValidateCertPage() {
  const { code } = useParams<{ code: string }>();
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
      style={{ background: "oklch(var(--navy-deep))" }}
    >
      {/* Header */}
      <header
        className="flex h-14 items-center px-6"
        style={{ borderBottom: "1px solid oklch(0.32 0.07 258)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: "oklch(0.32 0.09 258)" }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-white">
            EAD Corporativo — Validacao de Certificado
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md page-enter">
          {cert ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: "oklch(0.96 0.012 245)" }}
            >
              <div className="flex justify-center mb-4">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.94 0.05 165)" }}
                >
                  <CheckCircle
                    className="h-7 w-7"
                    style={{ color: "oklch(0.38 0.14 165)" }}
                  />
                </div>
              </div>

              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: "oklch(0.38 0.14 165)" }}
              >
                Certificado Valido
              </p>

              <h1
                className="text-xl font-semibold mb-1"
                style={{ color: "oklch(var(--navy-deep))" }}
              >
                {cert.studentName}
              </h1>
              {cert.cpf && (
                <p className="text-sm text-muted-foreground mb-4">
                  CPF: {cert.cpf}
                </p>
              )}

              <div
                className="rounded-lg p-4 mb-4 text-left space-y-2"
                style={{ background: "white" }}
              >
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">Curso</span>
                  <span className="font-medium">{cert.courseName}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">Concluido</span>
                  <span className="font-medium">{completionDate}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">Codigo</span>
                  <span
                    className="font-mono text-xs font-medium"
                    style={{ color: "oklch(var(--navy-mid))" }}
                  >
                    {cert.code}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center">
                <Award className="h-4 w-4" style={{ color: "oklch(var(--navy-mid))" }} />
                <p className="text-xs text-muted-foreground">
                  Certificado emitido pela plataforma EAD Corporativo
                </p>
              </div>
            </div>
          ) : notFound ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: "oklch(0.96 0.012 245)" }}
            >
              <div className="flex justify-center mb-4">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.95 0.04 27)" }}
                >
                  <XCircle
                    className="h-7 w-7"
                    style={{ color: "oklch(0.45 0.18 27)" }}
                  />
                </div>
              </div>
              <h1
                className="text-xl font-semibold mb-2"
                style={{ color: "oklch(var(--navy-deep))" }}
              >
                Certificado nao encontrado
              </h1>
              <p className="text-sm text-muted-foreground">
                O codigo <span className="font-mono font-medium">{code}</span> nao
                corresponde a nenhum certificado emitido.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
            </div>
          )}
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
