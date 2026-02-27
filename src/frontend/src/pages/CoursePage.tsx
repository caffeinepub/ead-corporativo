import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppHeader from "../components/AppHeader";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import {
  getCourse,
  calculateCourseProgress,
  getProgress,
  getCertificateForStudent,
  saveCertificate,
  generateCertCode,
  isCourseComplete,
} from "../lib/ead-storage";
import type { Course, Module } from "../lib/ead-types";
import {
  ChevronLeft,
  Lock,
  CheckCircle,
  PlayCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const { data: profile } = useUserProfile();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [certIssued, setCertIssued] = useState(false);

  useEffect(() => {
    if (!id) return;
    const c = getCourse(id);
    setCourse(c);
    if (c) {
      // Expand all modules by default
      setExpandedModules(new Set(c.modules.map((m) => m.id)));
    }
  }, [id]);

  useEffect(() => {
    if (!course || !principal) return;
    const cert = getCertificateForStudent(principal, course.id);
    setCertIssued(!!cert);

    // Auto-issue certificate if course complete and not yet issued
    if (isCourseComplete(principal, course) && !cert && profile?.name) {
      const localProfile = getProgress(principal); // just to check
      void localProfile;
      const code = generateCertCode(principal, course.id);
      saveCertificate({
        code,
        studentName: profile.name,
        cpf: "",
        courseName: course.title,
        courseId: course.id,
        completionDate: Date.now(),
        principalId: principal,
      });
      setCertIssued(true);
      toast.success("Parabens! Seu certificado foi emitido.");
    }
  }, [course, principal, profile]);

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader userName={profile?.name} />
        <main className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          Curso não encontrado.
        </main>
      </div>
    );
  }

  const progress = calculateCourseProgress(principal, course);
  const lessonProgress = getProgress(principal);
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Find first incomplete lesson
  let firstIncomplete: { courseId: string; lessonId: string } | null = null;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (!lessonProgress[lesson.id]?.completed) {
        firstIncomplete = { courseId: course.id, lessonId: lesson.id };
        break;
      }
    }
    if (firstIncomplete) break;
  }

  // Check sequential unlock
  const isLessonUnlocked = (moduleIndex: number, lessonIndex: number): boolean => {
    if (moduleIndex === 0 && lessonIndex === 0) return true;
    let prevLesson: { id: string } | null = null;
    if (lessonIndex > 0) {
      prevLesson = course.modules[moduleIndex].lessons[lessonIndex - 1];
    } else if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1];
      prevLesson = prevModule.lessons[prevModule.lessons.length - 1];
    }
    return prevLesson ? !!lessonProgress[prevLesson.id]?.completed : true;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={profile?.name} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Meus cursos
        </button>

        {/* Course header */}
        <div className="mb-8 page-enter">
          <h1
            className="text-2xl font-semibold tracking-tight mb-2"
            style={{ color: "oklch(var(--navy-deep))" }}
          >
            {course.title}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">{course.description}</p>

          {/* Progress overview */}
          <div
            className="rounded-lg p-4 flex items-center justify-between gap-4"
            style={{ background: "oklch(var(--navy-pale))" }}
          >
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {progress.completed} de {totalLessons} aulas concluídas
                </span>
                <span
                  className="font-semibold"
                  style={{
                    color:
                      progress.percentage === 100
                        ? "oklch(0.52 0.14 165)"
                        : "oklch(var(--navy-mid))",
                  }}
                >
                  {progress.percentage}%
                </span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
            {progress.percentage === 100 && (
              <Badge
                variant="outline"
                className="border-none shrink-0"
                style={{
                  background: "oklch(0.94 0.05 165)",
                  color: "oklch(0.38 0.14 165)",
                }}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Concluído
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          {firstIncomplete && (
            <Button
              onClick={() =>
                navigate(
                  `/lesson/${firstIncomplete!.courseId}/${firstIncomplete!.lessonId}`
                )
              }
              style={{ background: "oklch(var(--navy-deep))", color: "white" }}
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              {progress.completed === 0 ? "Iniciar curso" : "Continuar"}
            </Button>
          )}
          {certIssued && (
            <Button
              variant="outline"
              onClick={() => navigate(`/certificate/${course.id}`)}
              className="gap-2"
            >
              <Award className="h-4 w-4" />
              Ver certificado
            </Button>
          )}
        </div>

        {/* Modules & lessons */}
        <div className="space-y-3">
          {course.modules.map((module: Module, modIdx: number) => {
            const modCompleted = module.lessons.every(
              (l) => lessonProgress[l.id]?.completed
            );
            const isExpanded = expandedModules.has(module.id);

            return (
              <div
                key={module.id}
                className="rounded-lg border border-border overflow-hidden bg-card"
                style={{ boxShadow: "0 1px 3px oklch(0.22 0.065 258 / 0.06)" }}
              >
                {/* Module header */}
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {modCompleted ? (
                      <CheckCircle className="h-4 w-4 shrink-0 text-success-DEFAULT" style={{ color: "oklch(0.52 0.14 165)" }} />
                    ) : (
                      <div
                        className="h-4 w-4 shrink-0 rounded-full border-2"
                        style={{ borderColor: "oklch(var(--navy-mid))" }}
                      />
                    )}
                    <span className="font-medium text-sm">{module.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {module.lessons.filter((l) => lessonProgress[l.id]?.completed).length}/
                      {module.lessons.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Lessons */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {module.lessons.map((lesson, lesIdx) => {
                      const lp = lessonProgress[lesson.id];
                      const isCompleted = lp?.completed ?? false;
                      const unlocked = isLessonUnlocked(modIdx, lesIdx);
                      const pct = lp
                        ? Math.round((lp.secondsWatched / lesson.duration) * 100)
                        : 0;

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          disabled={!unlocked}
                          onClick={() =>
                            navigate(`/lesson/${course.id}/${lesson.id}`)
                          }
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {/* Status icon */}
                          <div className="shrink-0">
                            {!unlocked ? (
                              <Lock className="h-4 w-4 text-muted-foreground/50" />
                            ) : isCompleted ? (
                              <CheckCircle className="h-4 w-4" style={{ color: "oklch(0.52 0.14 165)" }} />
                            ) : (
                              <PlayCircle className="h-4 w-4" style={{ color: "oklch(var(--navy-mid))" }} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{lesson.title}</p>
                            {lp && !isCompleted && (
                              <div className="mt-1">
                                <div className="lesson-progress-track">
                                  <div
                                    className="lesson-progress-fill"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {pct}% assistido
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDuration(lesson.duration)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
