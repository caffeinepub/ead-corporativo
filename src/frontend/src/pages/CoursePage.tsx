import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  PlayCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { navigate } from "../App";
import AppHeader from "../components/AppHeader";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import {
  calculateCourseProgress,
  generateCertCode,
  getCertificateForStudent,
  getCourse,
  getProgress,
  isCourseComplete,
  saveCertificate,
} from "../lib/ead-storage";
import type { Course, Module } from "../lib/ead-types";

interface CoursePageProps {
  courseId: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CoursePage({ courseId }: CoursePageProps) {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const { data: profile } = useUserProfile();

  const [course, setCourse] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [certIssued, setCertIssued] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    const c = getCourse(courseId);
    setCourse(c);
    if (c) {
      setExpandedModules(new Set(c.modules.map((m) => m.id)));
    }
  }, [courseId]);

  useEffect(() => {
    if (!course || !principal) return;
    const cert = getCertificateForStudent(principal, course.id);
    setCertIssued(!!cert);

    if (isCourseComplete(principal, course) && !cert && profile?.name) {
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
      toast.success("Parabéns! Seu certificado foi emitido.");
    }
  }, [course, principal, profile]);

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader userName={profile?.name} />
        <main
          className="container mx-auto px-4 py-8 text-center"
          style={{ color: "oklch(0.58 0.06 295)" }}
        >
          Curso não encontrado.
        </main>
      </div>
    );
  }

  const progress = calculateCourseProgress(principal, course);
  const lessonProgress = getProgress(principal);
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
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

  const isLessonUnlocked = (
    moduleIndex: number,
    lessonIndex: number,
  ): boolean => {
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
          className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
          style={{ color: "oklch(0.58 0.06 295)" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Meus cursos
        </button>

        {/* Course header */}
        <div className="mb-8 page-enter">
          <h1
            className="text-2xl font-display font-semibold tracking-tight mb-2"
            style={{ color: "oklch(0.93 0.02 295)" }}
          >
            {course.title}
          </h1>
          <p className="text-sm mb-4" style={{ color: "oklch(0.58 0.06 295)" }}>
            {course.description}
          </p>

          {/* Progress overview */}
          <div
            className="rounded-xl p-4 flex items-center justify-between gap-4"
            style={{
              background: "oklch(0.14 0.05 295)",
              border: "1px solid oklch(0.24 0.07 295)",
            }}
          >
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "oklch(0.58 0.06 295)" }}>
                  {progress.completed} de {totalLessons} aulas concluídas
                </span>
                <span
                  className="font-semibold"
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
              <Progress value={progress.percentage} className="h-2" />
            </div>
            {progress.percentage === 100 && (
              <Badge
                variant="outline"
                className="border-none shrink-0"
                style={{
                  background: "oklch(0.22 0.08 155)",
                  color: "oklch(0.72 0.18 155)",
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
                  `/lesson/${firstIncomplete!.courseId}/${firstIncomplete!.lessonId}`,
                )
              }
              className="gap-2 cosmos-glow"
              style={{ background: "oklch(0.62 0.22 295)", color: "white" }}
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
              style={{
                borderColor: "oklch(0.32 0.10 295)",
                color: "oklch(0.72 0.18 295)",
                background: "transparent",
              }}
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
              (l) => lessonProgress[l.id]?.completed,
            );
            const isExpanded = expandedModules.has(module.id);

            return (
              <div
                key={module.id}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "oklch(0.14 0.05 295)",
                  border: "1px solid oklch(0.24 0.07 295)",
                }}
              >
                {/* Module header */}
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors"
                  style={{
                    background: isExpanded
                      ? "oklch(0.16 0.06 295)"
                      : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {modCompleted ? (
                      <CheckCircle
                        className="h-4 w-4 shrink-0"
                        style={{ color: "oklch(0.60 0.18 155)" }}
                      />
                    ) : (
                      <div
                        className="h-4 w-4 shrink-0 rounded-full border-2"
                        style={{ borderColor: "oklch(0.42 0.12 295)" }}
                      />
                    )}
                    <span
                      className="font-medium text-sm"
                      style={{ color: "oklch(0.90 0.02 295)" }}
                    >
                      {module.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs"
                      style={{ color: "oklch(0.52 0.06 295)" }}
                    >
                      {
                        module.lessons.filter(
                          (l) => lessonProgress[l.id]?.completed,
                        ).length
                      }
                      /{module.lessons.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown
                        className="h-4 w-4"
                        style={{ color: "oklch(0.52 0.06 295)" }}
                      />
                    ) : (
                      <ChevronRight
                        className="h-4 w-4"
                        style={{ color: "oklch(0.52 0.06 295)" }}
                      />
                    )}
                  </div>
                </button>

                {/* Lessons */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid oklch(0.22 0.07 295)" }}>
                    {module.lessons.map((lesson, lesIdx) => {
                      const lp = lessonProgress[lesson.id];
                      const isCompleted = lp?.completed ?? false;
                      const unlocked = isLessonUnlocked(modIdx, lesIdx);
                      const pct = lp
                        ? Math.round(
                            (lp.secondsWatched / lesson.duration) * 100,
                          )
                        : 0;

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          disabled={!unlocked}
                          onClick={() =>
                            navigate(`/lesson/${course.id}/${lesson.id}`)
                          }
                          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            borderTop:
                              lesIdx > 0
                                ? "1px solid oklch(0.20 0.06 295)"
                                : undefined,
                          }}
                          onMouseEnter={(e) => {
                            if (unlocked)
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = "oklch(0.18 0.07 295)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "transparent";
                          }}
                        >
                          {/* Status icon */}
                          <div className="shrink-0">
                            {!unlocked ? (
                              <Lock
                                className="h-4 w-4"
                                style={{ color: "oklch(0.40 0.06 295)" }}
                              />
                            ) : isCompleted ? (
                              <CheckCircle
                                className="h-4 w-4"
                                style={{ color: "oklch(0.60 0.18 155)" }}
                              />
                            ) : (
                              <PlayCircle
                                className="h-4 w-4"
                                style={{ color: "oklch(0.62 0.22 295)" }}
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "oklch(0.85 0.04 295)" }}
                            >
                              {lesson.title}
                            </p>
                            {lp && !isCompleted && (
                              <div className="mt-1">
                                <div className="lesson-progress-track">
                                  <div
                                    className="lesson-progress-fill"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ color: "oklch(0.52 0.06 295)" }}
                                >
                                  {pct}% assistido
                                </p>
                              </div>
                            )}
                          </div>

                          <div
                            className="shrink-0 flex items-center gap-1 text-xs"
                            style={{ color: "oklch(0.48 0.06 295)" }}
                          >
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
