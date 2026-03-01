import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, BookOpen, ChevronRight, PlayCircle } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import { navigate } from "../App";
import AppHeader from "../components/AppHeader";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import {
  calculateCourseProgress,
  getCertificateForStudent,
  getCourses,
  startSession,
} from "../lib/ead-storage";
import type { Course } from "../lib/ead-types";

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const { data: profile, isLoading } = useUserProfile();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loaded = getCourses();
    setCourses(loaded);
    startSession(principal);
  }, [principal]);

  const stats = courses.map((course) => ({
    course,
    progress: calculateCourseProgress(principal, course),
    certificate: getCertificateForStudent(principal, course.id),
  }));

  const completedCount = stats.filter(
    (s) => s.progress.percentage === 100,
  ).length;
  const inProgressCount = stats.filter(
    (s) => s.progress.percentage > 0 && s.progress.percentage < 100,
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton
              className="h-8 w-64"
              style={{ background: "oklch(0.18 0.06 295)" }}
            />
            <Skeleton
              className="h-4 w-48"
              style={{ background: "oklch(0.16 0.05 295)" }}
            />
            <div className="grid gap-4 mt-8">
              <Skeleton
                className="h-32 w-full"
                style={{ background: "oklch(0.16 0.05 295)" }}
              />
              <Skeleton
                className="h-32 w-full"
                style={{ background: "oklch(0.14 0.05 295)" }}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={profile?.name} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome header */}
        <div className="mb-8 page-enter">
          <h1
            className="text-2xl font-display font-semibold tracking-tight mb-1"
            style={{ color: "oklch(0.93 0.02 295)" }}
          >
            Bem-vindo, {profile?.name?.split(" ")[0] ?? "Aluno"}
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.58 0.06 295)" }}>
            Seus cursos disponíveis
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Cursos disponíveis",
              value: courses.length,
              icon: BookOpen,
            },
            { label: "Em andamento", value: inProgressCount, icon: PlayCircle },
            { label: "Concluídos", value: completedCount, icon: Award },
          ].map(({ label, value, icon: Icon }, i) => (
            <div
              key={label}
              className={`rounded-xl p-4 slide-up stagger-${i + 1}`}
              style={{
                background: "oklch(0.14 0.05 295)",
                border: "1px solid oklch(0.24 0.07 295)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  className="h-4 w-4"
                  style={{ color: "oklch(0.62 0.22 295)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "oklch(0.58 0.06 295)" }}
                >
                  {label}
                </span>
              </div>
              <p
                className="text-2xl font-display font-semibold"
                style={{ color: "oklch(0.93 0.02 295)" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Courses list */}
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: "oklch(0.52 0.08 295)" }}
          >
            Cursos
          </h2>

          {courses.length === 0 ? (
            <div
              className="rounded-xl p-12 text-center"
              style={{
                background: "oklch(0.14 0.05 295)",
                border: "1px dashed oklch(0.28 0.08 295)",
              }}
            >
              <BookOpen
                className="h-8 w-8 mx-auto mb-3"
                style={{ color: "oklch(0.38 0.06 295)" }}
              />
              <p className="text-sm" style={{ color: "oklch(0.58 0.06 295)" }}>
                Nenhum curso disponível no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.map(({ course, progress, certificate }, i) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => navigate(`/course/${course.id}`)}
                  className={`w-full rounded-xl p-5 text-left transition-all duration-200 group slide-up stagger-${Math.min(i + 2, 5)}`}
                  style={{
                    background: "oklch(0.14 0.05 295)",
                    border: "1px solid oklch(0.24 0.07 295)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "oklch(0.40 0.14 295)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 4px 12px oklch(0 0 0 / 0.4), 0 0 20px oklch(0.62 0.22 295 / 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "oklch(0.24 0.07 295)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: "oklch(0.20 0.08 295)" }}
                        >
                          <BookOpen
                            className="h-4 w-4"
                            style={{ color: "oklch(0.72 0.18 295)" }}
                          />
                        </div>
                        <div>
                          <h3
                            className="font-medium text-sm leading-tight"
                            style={{ color: "oklch(0.93 0.02 295)" }}
                          >
                            {course.title}
                          </h3>
                        </div>
                      </div>
                      <p
                        className="text-xs ml-10 line-clamp-1 mb-3"
                        style={{ color: "oklch(0.58 0.06 295)" }}
                      >
                        {course.description}
                      </p>

                      {/* Progress */}
                      <div className="ml-10">
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="text-xs"
                            style={{ color: "oklch(0.52 0.06 295)" }}
                          >
                            {progress.completed}/{progress.total} aulas
                          </span>
                          <span
                            className="text-xs font-medium"
                            style={{
                              color:
                                progress.percentage === 100
                                  ? "oklch(0.60 0.18 155)"
                                  : "oklch(0.72 0.18 295)",
                            }}
                          >
                            {progress.percentage}%
                          </span>
                        </div>
                        <Progress
                          value={progress.percentage}
                          className="h-1.5"
                          style={{
                            background: "oklch(0.22 0.07 295)",
                          }}
                        />
                      </div>

                      {/* Certificate badge */}
                      {certificate && (
                        <div className="mt-2 ml-10">
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 border-none"
                            style={{
                              background: "oklch(0.22 0.08 155)",
                              color: "oklch(0.72 0.18 155)",
                            }}
                          >
                            <Award className="h-3 w-3" />
                            Certificado emitido
                          </Badge>
                        </div>
                      )}
                    </div>

                    <ChevronRight
                      className="h-5 w-5 shrink-0 mt-1 transition-colors"
                      style={{ color: "oklch(0.40 0.06 295)" }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer
        className="py-6 mt-16"
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
