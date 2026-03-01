import { Button } from "@/components/ui/button";
import {
  Award,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Pause,
  Play,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { navigate } from "../App";
import AppHeader from "../components/AppHeader";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import {
  generateCertCode,
  getCertificateForStudent,
  getCourse,
  getProgress,
  isCourseComplete,
  saveCertificate,
  updateLessonProgress,
} from "../lib/ead-storage";
import type { Course, Lesson } from "../lib/ead-types";

interface LessonPageProps {
  courseId: string;
  lessonId: string;
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LessonPage({ courseId, lessonId }: LessonPageProps) {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const { data: profile } = useUserProfile();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    const c = getCourse(courseId);
    if (!c) return;
    setCourse(c);

    let found: Lesson | null = null;
    let next: Lesson | null = null;
    let foundIt = false;

    for (const mod of c.modules) {
      for (let i = 0; i < mod.lessons.length; i++) {
        if (foundIt && !next) {
          next = mod.lessons[i];
        }
        if (mod.lessons[i].id === lessonId) {
          found = mod.lessons[i];
          foundIt = true;
          if (i + 1 < mod.lessons.length) {
            next = mod.lessons[i + 1];
            foundIt = false;
          }
        }
      }
    }

    setLesson(found);
    setNextLesson(next);

    if (found) {
      const progress = getProgress(principal);
      const lp = progress[lessonId];
      if (lp) {
        setSecondsWatched(lp.secondsWatched);
        setIsCompleted(lp.completed);
      }
    }
  }, [courseId, lessonId, principal]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsWatched((prev) => {
        if (!lesson) return prev;
        const newVal = prev + 1;
        updateLessonProgress(principal, lessonId, newVal, lesson.duration);
        if (newVal >= lesson.duration) {
          setIsCompleted(true);
          setIsPlaying(false);
          stopTimer();
          if (
            course &&
            profile?.name &&
            !getCertificateForStudent(principal, course.id)
          ) {
            const freshCourse = getCourse(course.id);
            if (freshCourse && isCourseComplete(principal, freshCourse)) {
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
              toast.success("Curso concluído! Certificado emitido.");
            }
          }
        }
        return newVal;
      });
    }, 1000);
  }, [lesson, principal, lessonId, course, profile, stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  const handlePlayPause = () => {
    if (isCompleted) return;
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        startTimer();
      } else {
        stopTimer();
      }
      return next;
    });
  };

  if (!course || !lesson) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader userName={profile?.name} />
        <main
          className="container mx-auto px-4 py-8 text-center"
          style={{ color: "oklch(0.58 0.06 295)" }}
        >
          Aula não encontrada.
        </main>
      </div>
    );
  }

  const videoId = getYouTubeVideoId(lesson.videoUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&autoplay=${isPlaying ? 1 : 0}`
    : null;

  const watchedPct = Math.min(
    Math.round((secondsWatched / lesson.duration) * 100),
    100,
  );
  const remaining = Math.max(lesson.duration - secondsWatched, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={profile?.name} />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Breadcrumb */}
        <button
          type="button"
          onClick={() => navigate(`/course/${courseId}`)}
          className="flex items-center gap-1.5 text-sm mb-4 transition-opacity hover:opacity-70"
          style={{ color: "oklch(0.58 0.06 295)" }}
        >
          <ChevronLeft className="h-4 w-4" />
          {course.title}
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main: video */}
          <div className="lg:col-span-2">
            <h1
              className="text-xl font-display font-semibold mb-4 tracking-tight"
              style={{ color: "oklch(0.93 0.02 295)" }}
            >
              {lesson.title}
            </h1>

            {/* Video container */}
            <div
              className="relative rounded-xl overflow-hidden bg-black"
              style={{ aspectRatio: "16/9" }}
            >
              {embedUrl ? (
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen={false}
                  title={lesson.title}
                  style={{ pointerEvents: "none" }}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-sm"
                  style={{ color: "oklch(0.50 0.06 295)" }}
                >
                  URL de vídeo inválida
                </div>
              )}

              {/* Control overlay */}
              <div
                className="absolute inset-0 flex flex-col justify-end"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 40%, oklch(0.06 0.04 295 / 0.92) 100%)",
                }}
              >
                <div className="p-4">
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div
                      className="flex justify-between text-xs mb-1.5"
                      style={{ color: "oklch(0.65 0.04 295)" }}
                    >
                      <span>{formatTime(secondsWatched)}</span>
                      <span
                        className="font-medium"
                        style={{ color: "oklch(0.85 0.02 295)" }}
                      >
                        {watchedPct}% assistido
                      </span>
                      <span>{formatTime(lesson.duration)}</span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden cursor-not-allowed"
                      style={{ background: "oklch(0.30 0.06 295 / 0.5)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{
                          width: `${watchedPct}%`,
                          background: "oklch(0.72 0.22 295)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={handlePlayPause}
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-all cosmos-glow"
                        style={{
                          background: "oklch(0.62 0.22 295)",
                          color: "white",
                        }}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4 ml-0.5" />
                        )}
                      </button>
                    ) : (
                      <div
                        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                        style={{
                          background: "oklch(0.22 0.08 155)",
                          color: "oklch(0.72 0.18 155)",
                        }}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Aula concluída
                      </div>
                    )}

                    {!isCompleted && (
                      <div
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: "oklch(0.55 0.06 295)" }}
                      >
                        <Lock className="h-3 w-3" />
                        Avanço desabilitado
                      </div>
                    )}

                    <div
                      className="ml-auto flex items-center gap-1 text-xs"
                      style={{ color: "oklch(0.55 0.06 295)" }}
                    >
                      <Clock className="h-3 w-3" />
                      {formatTime(remaining)} restante
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note about playback */}
            {!isCompleted && (
              <p
                className="text-xs mt-2 text-center"
                style={{ color: "oklch(0.48 0.06 295)" }}
              >
                Clique em reproduzir e assista sem fechar esta janela para
                registrar o progresso.
              </p>
            )}

            {/* Next lesson button */}
            {isCompleted && nextLesson && (
              <div
                className="mt-4 rounded-xl p-4 flex items-center justify-between gap-4"
                style={{
                  background: "oklch(0.16 0.06 295)",
                  border: "1px solid oklch(0.28 0.09 295)",
                }}
              >
                <div>
                  <p
                    className="text-xs mb-0.5"
                    style={{ color: "oklch(0.55 0.06 295)" }}
                  >
                    Próxima aula
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.90 0.02 295)" }}
                  >
                    {nextLesson.title}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    navigate(`/lesson/${courseId}/${nextLesson.id}`)
                  }
                  className="gap-2 shrink-0 cosmos-glow"
                  style={{ background: "oklch(0.62 0.22 295)", color: "white" }}
                >
                  Continuar
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Certificate issued */}
            {isCompleted &&
              !nextLesson &&
              getCertificateForStudent(principal, course.id) && (
                <div
                  className="mt-4 rounded-xl p-4 flex items-center justify-between gap-4"
                  style={{
                    background: "oklch(0.20 0.08 155)",
                    border: "1px solid oklch(0.32 0.12 155)",
                  }}
                >
                  <div>
                    <p
                      className="text-xs font-medium mb-0.5"
                      style={{ color: "oklch(0.60 0.18 155)" }}
                    >
                      Curso concluído!
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "oklch(0.75 0.14 155)" }}
                    >
                      Seu certificado foi emitido.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/certificate/${courseId}`)}
                    className="gap-2 shrink-0 border-none"
                    style={{
                      background: "oklch(0.40 0.14 155)",
                      color: "white",
                    }}
                  >
                    <Award className="h-4 w-4" />
                    Ver certificado
                  </Button>
                </div>
              )}
          </div>

          {/* Sidebar: lesson list */}
          <aside>
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "oklch(0.52 0.08 295)" }}
            >
              Conteúdo do curso
            </h2>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {course.modules.map((mod) => (
                <div key={mod.id}>
                  <p
                    className="text-xs font-medium px-2 py-1.5 uppercase tracking-wide"
                    style={{ color: "oklch(0.52 0.08 295)" }}
                  >
                    {mod.title}
                  </p>
                  {mod.lessons.map((l) => {
                    const lp = getProgress(principal)[l.id];
                    const done = lp?.completed ?? false;
                    const current = l.id === lessonId;

                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => navigate(`/lesson/${courseId}/${l.id}`)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left text-sm transition-colors"
                        style={
                          current
                            ? {
                                background: "oklch(0.20 0.09 295)",
                                color: "oklch(0.82 0.18 295)",
                              }
                            : {
                                background: "transparent",
                                color: "oklch(0.72 0.04 295)",
                              }
                        }
                        onMouseEnter={(e) => {
                          if (!current)
                            (e.currentTarget as HTMLElement).style.background =
                              "oklch(0.16 0.06 295)";
                        }}
                        onMouseLeave={(e) => {
                          if (!current)
                            (e.currentTarget as HTMLElement).style.background =
                              "transparent";
                        }}
                      >
                        {done ? (
                          <CheckCircle
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: "oklch(0.60 0.18 155)" }}
                          />
                        ) : (
                          <div
                            className="h-3.5 w-3.5 shrink-0 rounded-full border-2"
                            style={{
                              borderColor: current
                                ? "oklch(0.72 0.22 295)"
                                : "oklch(0.38 0.06 295)",
                            }}
                          />
                        )}
                        <span className="truncate text-xs">{l.title}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      <footer
        className="py-6 mt-8"
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
