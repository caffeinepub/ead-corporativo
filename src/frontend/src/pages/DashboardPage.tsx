import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "../components/AppHeader";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import { getCourses, calculateCourseProgress, getCertificateForStudent, startSession } from "../lib/ead-storage";
import { BookOpen, ChevronRight, Award, PlayCircle } from "lucide-react";
import type { Course } from "../lib/ead-types";
import { useState } from "react";

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const { data: profile, isLoading } = useUserProfile();
  const navigate = useNavigate();
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

  const completedCount = stats.filter((s) => s.progress.percentage === 100).length;
  const inProgressCount = stats.filter((s) => s.progress.percentage > 0 && s.progress.percentage < 100).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="grid gap-4 mt-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
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
          <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: "oklch(var(--navy-deep))" }}>
            Bem-vindo, {profile?.name?.split(" ")[0] ?? "Aluno"}
          </h1>
          <p className="text-muted-foreground text-sm">Seus cursos disponíveis</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Cursos disponíveis", value: courses.length, icon: BookOpen },
            { label: "Em andamento", value: inProgressCount, icon: PlayCircle },
            { label: "Concluídos", value: completedCount, icon: Award },
          ].map(({ label, value, icon: Icon }, i) => (
            <div
              key={label}
              className={`rounded-lg border border-border bg-card p-4 slide-up stagger-${i + 1}`}
              style={{ boxShadow: "0 1px 3px oklch(0.22 0.065 258 / 0.06)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color: "oklch(var(--navy-mid))" }} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p
                className="text-2xl font-semibold"
                style={{ color: "oklch(var(--navy-deep))" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Courses list */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Cursos
          </h2>

          {courses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhum curso disponível no momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.map(({ course, progress, certificate }, i) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => navigate({ to: "/course/$id", params: { id: course.id } })}
                  className={`w-full rounded-lg border border-border bg-card p-5 text-left hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 group slide-up stagger-${Math.min(i + 2, 5)}`}
                  style={{ boxShadow: "0 1px 3px oklch(0.22 0.065 258 / 0.06)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                          style={{ background: "oklch(var(--navy-pale))" }}
                        >
                          <BookOpen className="h-4 w-4" style={{ color: "oklch(var(--navy-deep))" }} />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm leading-tight">{course.title}</h3>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 ml-10 line-clamp-1">
                        {course.description}
                      </p>

                      {/* Progress */}
                      <div className="ml-10">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground">
                            {progress.completed}/{progress.total} aulas
                          </span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: progress.percentage === 100 ? "oklch(0.52 0.14 165)" : "oklch(var(--navy-mid))" }}
                          >
                            {progress.percentage}%
                          </span>
                        </div>
                        <Progress value={progress.percentage} className="h-1.5" />
                      </div>

                      {/* Certificate badge */}
                      {certificate && (
                        <div className="mt-2 ml-10">
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 border-none"
                            style={{
                              background: "oklch(0.94 0.05 165)",
                              color: "oklch(0.38 0.14 165)",
                            }}
                          >
                            <Award className="h-3 w-3" />
                            Certificado emitido
                          </Badge>
                        </div>
                      )}
                    </div>

                    <ChevronRight
                      className="h-5 w-5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border py-6 mt-16">
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
