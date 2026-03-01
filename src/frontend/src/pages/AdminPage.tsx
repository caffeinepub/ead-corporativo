import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Ban,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import AppHeader from "../components/AppHeader";
import {
  ApprovalStatus,
  useListApprovals,
  useSetApproval,
  useUserProfile,
} from "../hooks/useQueries";
import {
  calculateCourseProgress,
  getCertificates,
  getCourses,
  getLocalProfile,
  getLogs,
  getProgress,
  saveCourses,
} from "../lib/ead-storage";
import type { Course, Lesson, Module } from "../lib/ead-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: ApprovalStatus;
}
function StatusBadge({ status }: StatusBadgeProps) {
  if (status === ApprovalStatus.approved) {
    return <span className="status-badge-approved">Aprovado</span>;
  }
  if (status === ApprovalStatus.rejected) {
    return <span className="status-badge-rejected">Bloqueado</span>;
  }
  return <span className="status-badge-pending">Aguardando</span>;
}

// ── Students Tab ─────────────────────────────────────────────────────────────

function StudentsTab() {
  const { data: approvals, isLoading } = useListApprovals();
  const setApproval = useSetApproval();
  const [filter, setFilter] = useState<"all" | ApprovalStatus>("all");

  const filtered =
    filter === "all"
      ? (approvals ?? [])
      : (approvals ?? []).filter((a) => a.status === filter);

  const handleApprove = async (principal: Principal) => {
    try {
      await setApproval.mutateAsync({
        user: principal,
        status: ApprovalStatus.approved,
      });
      toast.success("Aluno aprovado.");
    } catch {
      toast.error("Erro ao aprovar aluno.");
    }
  };

  const handleBlock = async (principal: Principal) => {
    try {
      await setApproval.mutateAsync({
        user: principal,
        status: ApprovalStatus.rejected,
      });
      toast.success("Aluno bloqueado.");
    } catch {
      toast.error("Erro ao bloquear aluno.");
    }
  };

  const counts = {
    all: approvals?.length ?? 0,
    pending:
      approvals?.filter((a) => a.status === ApprovalStatus.pending).length ?? 0,
    approved:
      approvals?.filter((a) => a.status === ApprovalStatus.approved).length ??
      0,
    rejected:
      approvals?.filter((a) => a.status === ApprovalStatus.rejected).length ??
      0,
  };

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            "all",
            ApprovalStatus.pending,
            ApprovalStatus.approved,
            ApprovalStatus.rejected,
          ] as const
        ).map((f) => {
          const labels: Record<string, string> = {
            all: "Todos",
            pending: "Aguardando",
            approved: "Aprovados",
            rejected: "Bloqueados",
          };
          const countVal = counts[f === "all" ? "all" : f];
          const isActive = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
              style={
                isActive
                  ? { background: "oklch(0.62 0.22 295)", color: "white" }
                  : {
                      background: "oklch(0.16 0.06 295)",
                      border: "1px solid oklch(0.28 0.08 295)",
                      color: "oklch(0.72 0.06 295)",
                    }
              }
            >
              {labels[f]}
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={
                  isActive
                    ? { background: "oklch(1 0 0 / 0.2)", color: "white" }
                    : {
                        background: "oklch(0.22 0.07 295)",
                        color: "oklch(0.62 0.10 295)",
                      }
                }
              >
                {countVal}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-12 w-full"
              style={{ background: "oklch(0.18 0.06 295)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "oklch(0.14 0.05 295)",
            border: "1px dashed oklch(0.28 0.08 295)",
          }}
        >
          <Users
            className="h-8 w-8 mx-auto mb-3"
            style={{ color: "oklch(0.38 0.06 295)" }}
          />
          <p className="text-sm" style={{ color: "oklch(0.55 0.06 295)" }}>
            Nenhum aluno neste filtro.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid oklch(0.24 0.07 295)" }}
        >
          <Table>
            <TableHeader>
              <TableRow
                style={{
                  background: "oklch(0.16 0.06 295)",
                  borderBottom: "1px solid oklch(0.24 0.07 295)",
                }}
              >
                <TableHead
                  className="font-semibold text-xs"
                  style={{ color: "oklch(0.72 0.18 295)" }}
                >
                  Principal ID
                </TableHead>
                <TableHead
                  className="font-semibold text-xs"
                  style={{ color: "oklch(0.72 0.18 295)" }}
                >
                  Status
                </TableHead>
                <TableHead
                  className="font-semibold text-xs text-right"
                  style={{ color: "oklch(0.72 0.18 295)" }}
                >
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((approval) => {
                const pid = approval.principal.toString();
                return (
                  <TableRow
                    key={pid}
                    className="group"
                    style={{ borderBottom: "1px solid oklch(0.20 0.06 295)" }}
                  >
                    <TableCell
                      className="font-mono text-xs max-w-[200px] truncate"
                      style={{ color: "oklch(0.60 0.06 295)" }}
                    >
                      {pid}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={approval.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {approval.status !== ApprovalStatus.approved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(approval.principal)}
                            disabled={setApproval.isPending}
                            className="h-7 text-xs gap-1"
                            style={{
                              borderColor: "oklch(0.32 0.12 155)",
                              color: "oklch(0.60 0.18 155)",
                              background: "transparent",
                            }}
                          >
                            <Check className="h-3 w-3" />
                            Aprovar
                          </Button>
                        )}
                        {approval.status !== ApprovalStatus.rejected && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBlock(approval.principal)}
                            disabled={setApproval.isPending}
                            className="h-7 text-xs gap-1"
                            style={{
                              borderColor: "oklch(0.32 0.10 27)",
                              color: "oklch(0.65 0.22 27)",
                              background: "transparent",
                            }}
                          >
                            <Ban className="h-3 w-3" />
                            Bloquear
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Courses Tab ───────────────────────────────────────────────────────────────

function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set(),
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );

  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [addCourseOpen, setAddCourseOpen] = useState(false);

  const [newModuleTitle, setNewModuleTitle] = useState<Record<string, string>>(
    {},
  );

  const [newLessonState, setNewLessonState] = useState<
    Record<string, { title: string; url: string; duration: string }>
  >({});

  useEffect(() => {
    setCourses(getCourses());
  }, []);

  const persist = (updated: Course[]) => {
    setCourses(updated);
    saveCourses(updated);
  };

  const addCourse = () => {
    if (!newCourseTitle.trim()) return;
    const updated = [
      ...courses,
      {
        id: generateId(),
        title: newCourseTitle.trim(),
        description: newCourseDesc.trim(),
        createdAt: Date.now(),
        modules: [],
      },
    ];
    persist(updated);
    setNewCourseTitle("");
    setNewCourseDesc("");
    setAddCourseOpen(false);
    toast.success("Curso criado.");
  };

  const deleteCourse = (courseId: string) => {
    persist(courses.filter((c) => c.id !== courseId));
    toast.success("Curso removido.");
  };

  const addModule = (courseId: string) => {
    const title = newModuleTitle[courseId]?.trim();
    if (!title) return;
    const updated = courses.map((c) => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        modules: [...c.modules, { id: generateId(), title, lessons: [] }],
      };
    });
    persist(updated);
    setNewModuleTitle((prev) => ({ ...prev, [courseId]: "" }));
    toast.success("Módulo adicionado.");
  };

  const deleteModule = (courseId: string, moduleId: string) => {
    const updated = courses.map((c) => {
      if (c.id !== courseId) return c;
      return { ...c, modules: c.modules.filter((m) => m.id !== moduleId) };
    });
    persist(updated);
  };

  const addLesson = (courseId: string, moduleId: string) => {
    const key = `${courseId}_${moduleId}`;
    const state = newLessonState[key];
    if (!state?.title.trim() || !state?.url.trim()) {
      toast.error("Preencha título e URL do vídeo.");
      return;
    }
    const dur = Number.parseInt(state.duration) || 60;
    const updated = courses.map((c) => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        modules: c.modules.map((m) => {
          if (m.id !== moduleId) return m;
          return {
            ...m,
            lessons: [
              ...m.lessons,
              {
                id: generateId(),
                title: state.title.trim(),
                videoUrl: state.url.trim(),
                duration: dur,
              },
            ],
          };
        }),
      };
    });
    persist(updated);
    setNewLessonState((prev) => ({
      ...prev,
      [key]: { title: "", url: "", duration: "" },
    }));
    toast.success("Aula adicionada.");
  };

  const deleteLesson = (
    courseId: string,
    moduleId: string,
    lessonId: string,
  ) => {
    const updated = courses.map((c) => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        modules: c.modules.map((m) => {
          if (m.id !== moduleId) return m;
          return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) };
        }),
      };
    });
    persist(updated);
  };

  const toggleCourse = (id: string) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Add course */}
      <div className="mb-6">
        <Dialog open={addCourseOpen} onOpenChange={setAddCourseOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 cosmos-glow"
              style={{ background: "oklch(0.62 0.22 295)", color: "white" }}
            >
              <Plus className="h-4 w-4" />
              Novo curso
            </Button>
          </DialogTrigger>
          <DialogContent
            style={{
              background: "oklch(0.16 0.06 295)",
              border: "1px solid oklch(0.28 0.09 295)",
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: "oklch(0.93 0.02 295)" }}>
                Criar novo curso
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.75 0.06 295)" }}>Título</Label>
                <Input
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="Título do curso"
                  style={{
                    background: "oklch(0.20 0.07 295)",
                    borderColor: "oklch(0.30 0.09 295)",
                    color: "oklch(0.90 0.02 295)",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.75 0.06 295)" }}>
                  Descrição
                </Label>
                <Textarea
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Descrição breve"
                  rows={3}
                  style={{
                    background: "oklch(0.20 0.07 295)",
                    borderColor: "oklch(0.30 0.09 295)",
                    color: "oklch(0.90 0.02 295)",
                  }}
                />
              </div>
              <Button
                onClick={addCourse}
                disabled={!newCourseTitle.trim()}
                className="w-full cosmos-glow"
                style={{ background: "oklch(0.62 0.22 295)", color: "white" }}
              >
                Criar curso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
          <p className="text-sm" style={{ color: "oklch(0.55 0.06 295)" }}>
            Nenhum curso criado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const isExpanded = expandedCourses.has(course.id);
            return (
              <div
                key={course.id}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid oklch(0.24 0.07 295)" }}
              >
                {/* Course header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: "oklch(0.16 0.06 295)" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCourse(course.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown
                        className="h-4 w-4"
                        style={{ color: "oklch(0.55 0.06 295)" }}
                      />
                    ) : (
                      <ChevronRight
                        className="h-4 w-4"
                        style={{ color: "oklch(0.55 0.06 295)" }}
                      />
                    )}
                    <div>
                      <p
                        className="font-medium text-sm"
                        style={{ color: "oklch(0.90 0.02 295)" }}
                      >
                        {course.title}
                      </p>
                      {course.description && (
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.55 0.06 295)" }}
                        >
                          {course.description}
                        </p>
                      )}
                    </div>
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="h-7 w-7 flex items-center justify-center rounded transition-colors"
                        style={{ color: "oklch(0.52 0.06 295)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "oklch(0.65 0.22 27)";
                          (e.currentTarget as HTMLElement).style.background =
                            "oklch(0.22 0.08 27)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "oklch(0.52 0.06 295)";
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      style={{
                        background: "oklch(0.16 0.06 295)",
                        border: "1px solid oklch(0.28 0.09 295)",
                      }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle
                          style={{ color: "oklch(0.93 0.02 295)" }}
                        >
                          Excluir curso?
                        </AlertDialogTitle>
                        <AlertDialogDescription
                          style={{ color: "oklch(0.60 0.06 295)" }}
                        >
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          style={{
                            background: "oklch(0.20 0.07 295)",
                            borderColor: "oklch(0.30 0.09 295)",
                            color: "oklch(0.80 0.04 295)",
                          }}
                        >
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCourse(course.id)}
                          style={{
                            background: "oklch(0.65 0.22 27)",
                            color: "white",
                          }}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {isExpanded && (
                  <div
                    className="p-4 space-y-4"
                    style={{ background: "oklch(0.13 0.05 295)" }}
                  >
                    {/* Modules */}
                    {course.modules.map((mod: Module) => {
                      const modExpanded = expandedModules.has(mod.id);
                      return (
                        <div
                          key={mod.id}
                          className="rounded-lg overflow-hidden"
                          style={{ border: "1px solid oklch(0.24 0.07 295)" }}
                        >
                          <div
                            className="flex items-center justify-between px-3 py-2"
                            style={{ background: "oklch(0.16 0.06 295)" }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleModule(mod.id)}
                              className="flex items-center gap-2 flex-1 text-left"
                            >
                              {modExpanded ? (
                                <ChevronDown
                                  className="h-3.5 w-3.5"
                                  style={{ color: "oklch(0.55 0.06 295)" }}
                                />
                              ) : (
                                <ChevronRight
                                  className="h-3.5 w-3.5"
                                  style={{ color: "oklch(0.55 0.06 295)" }}
                                />
                              )}
                              <span
                                className="text-sm font-medium"
                                style={{ color: "oklch(0.85 0.04 295)" }}
                              >
                                {mod.title}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  background: "oklch(0.22 0.08 295)",
                                  color: "oklch(0.65 0.12 295)",
                                }}
                              >
                                {mod.lessons.length} aulas
                              </Badge>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteModule(course.id, mod.id)}
                              className="h-6 w-6 flex items-center justify-center rounded transition-colors"
                              style={{ color: "oklch(0.50 0.06 295)" }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.color =
                                  "oklch(0.65 0.22 27)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color =
                                  "oklch(0.50 0.06 295)";
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {modExpanded && (
                            <div
                              className="p-3 space-y-2"
                              style={{ background: "oklch(0.12 0.04 295)" }}
                            >
                              {/* Lessons list */}
                              {mod.lessons.map((lesson: Lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between gap-2 rounded px-2 py-1.5"
                                  style={{ background: "oklch(0.16 0.06 295)" }}
                                >
                                  <div className="min-w-0">
                                    <p
                                      className="text-sm truncate"
                                      style={{ color: "oklch(0.82 0.04 295)" }}
                                    >
                                      {lesson.title}
                                    </p>
                                    <p
                                      className="text-xs"
                                      style={{ color: "oklch(0.52 0.06 295)" }}
                                    >
                                      {formatDuration(lesson.duration)} &bull;{" "}
                                      {lesson.videoUrl.substring(0, 40)}...
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteLesson(course.id, mod.id, lesson.id)
                                    }
                                    className="h-6 w-6 flex shrink-0 items-center justify-center rounded transition-colors"
                                    style={{ color: "oklch(0.50 0.06 295)" }}
                                    onMouseEnter={(e) => {
                                      (
                                        e.currentTarget as HTMLElement
                                      ).style.color = "oklch(0.65 0.22 27)";
                                    }}
                                    onMouseLeave={(e) => {
                                      (
                                        e.currentTarget as HTMLElement
                                      ).style.color = "oklch(0.50 0.06 295)";
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}

                              {/* Add lesson form */}
                              <div
                                className="rounded border p-3 space-y-2"
                                style={{
                                  borderColor: "oklch(0.28 0.08 295)",
                                  borderStyle: "dashed",
                                }}
                              >
                                <p
                                  className="text-xs font-medium mb-2"
                                  style={{ color: "oklch(0.58 0.08 295)" }}
                                >
                                  Adicionar aula
                                </p>
                                <Input
                                  placeholder="Título da aula"
                                  value={
                                    newLessonState[`${course.id}_${mod.id}`]
                                      ?.title ?? ""
                                  }
                                  onChange={(e) =>
                                    setNewLessonState((prev) => ({
                                      ...prev,
                                      [`${course.id}_${mod.id}`]: {
                                        ...prev[`${course.id}_${mod.id}`],
                                        title: e.target.value,
                                      },
                                    }))
                                  }
                                  className="h-8 text-sm"
                                  style={{
                                    background: "oklch(0.18 0.06 295)",
                                    borderColor: "oklch(0.28 0.08 295)",
                                    color: "oklch(0.85 0.04 295)",
                                  }}
                                />
                                <Input
                                  placeholder="URL do YouTube"
                                  value={
                                    newLessonState[`${course.id}_${mod.id}`]
                                      ?.url ?? ""
                                  }
                                  onChange={(e) =>
                                    setNewLessonState((prev) => ({
                                      ...prev,
                                      [`${course.id}_${mod.id}`]: {
                                        ...prev[`${course.id}_${mod.id}`],
                                        url: e.target.value,
                                      },
                                    }))
                                  }
                                  className="h-8 text-sm"
                                  style={{
                                    background: "oklch(0.18 0.06 295)",
                                    borderColor: "oklch(0.28 0.08 295)",
                                    color: "oklch(0.85 0.04 295)",
                                  }}
                                />
                                <Input
                                  placeholder="Duração em segundos (ex: 300)"
                                  type="number"
                                  value={
                                    newLessonState[`${course.id}_${mod.id}`]
                                      ?.duration ?? ""
                                  }
                                  onChange={(e) =>
                                    setNewLessonState((prev) => ({
                                      ...prev,
                                      [`${course.id}_${mod.id}`]: {
                                        ...prev[`${course.id}_${mod.id}`],
                                        duration: e.target.value,
                                      },
                                    }))
                                  }
                                  className="h-8 text-sm"
                                  style={{
                                    background: "oklch(0.18 0.06 295)",
                                    borderColor: "oklch(0.28 0.08 295)",
                                    color: "oklch(0.85 0.04 295)",
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => addLesson(course.id, mod.id)}
                                  className="h-7 text-xs gap-1"
                                  style={{
                                    background: "oklch(0.62 0.22 295)",
                                    color: "white",
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                  Adicionar aula
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add module */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome do novo módulo"
                        value={newModuleTitle[course.id] ?? ""}
                        onChange={(e) =>
                          setNewModuleTitle((prev) => ({
                            ...prev,
                            [course.id]: e.target.value,
                          }))
                        }
                        className="h-8 text-sm"
                        style={{
                          background: "oklch(0.18 0.06 295)",
                          borderColor: "oklch(0.28 0.08 295)",
                          color: "oklch(0.85 0.04 295)",
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => addModule(course.id)}
                        disabled={!newModuleTitle[course.id]?.trim()}
                        className="h-8 text-xs gap-1 shrink-0"
                        style={{
                          background: "oklch(0.62 0.22 295)",
                          color: "white",
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Módulo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────

function ReportsTab() {
  const { data: approvals, isLoading } = useListApprovals();
  const courses = getCourses();
  const certificates = getCertificates();

  const exportPDF = (principalId: string) => {
    const localProf = getLocalProfile(principalId);
    const certs = certificates.filter((c) => c.principalId === principalId);
    const logs = getLogs(principalId);

    const lines: string[] = [];
    lines.push("=== Relatório de Aluno - EAD Corporativo ===\n");
    lines.push(`Principal ID: ${principalId}`);

    if (localProf) {
      lines.push(`CPF: ${localProf.cpf}`);
      lines.push(`Telefone: ${localProf.phone}`);
      lines.push(`E-mail: ${localProf.email}`);
    }

    lines.push("\n--- Progresso nos Cursos ---");
    for (const course of courses) {
      const prog = calculateCourseProgress(principalId, course);
      lines.push(
        `${course.title}: ${prog.completed}/${prog.total} aulas (${prog.percentage}%)`,
      );
    }

    lines.push("\n--- Certificados Emitidos ---");
    if (certs.length === 0) {
      lines.push("Nenhum certificado emitido.");
    } else {
      for (const cert of certs) {
        lines.push(
          `${cert.courseName} - ${new Date(cert.completionDate).toLocaleDateString("pt-BR")} (Cód: ${cert.code})`,
        );
      }
    }

    lines.push("\n--- Logs de Acesso (últimos 10) ---");
    if (logs.length === 0) {
      lines.push("Nenhum log registrado.");
    } else {
      for (const log of logs.slice(-10)) {
        const start = new Date(log.sessionStart).toLocaleString("pt-BR");
        const end = log.sessionEnd
          ? new Date(log.sessionEnd).toLocaleString("pt-BR")
          : "Em andamento";
        lines.push(`Entrada: ${start} | Saída: ${end}`);
      }
    }

    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${principalId.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado.");
  };

  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="h-12 w-full"
            style={{ background: "oklch(0.18 0.06 295)" }}
          />
        ))}
      </div>
    );
  }

  const approved = (approvals ?? []).filter(
    (a) => a.status === ApprovalStatus.approved,
  );

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "oklch(0.58 0.06 295)" }}>
        {approved.length} aluno(s) aprovado(s)
      </p>

      {approved.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "oklch(0.14 0.05 295)",
            border: "1px dashed oklch(0.28 0.08 295)",
          }}
        >
          <BarChart3
            className="h-8 w-8 mx-auto mb-3"
            style={{ color: "oklch(0.38 0.06 295)" }}
          />
          <p className="text-sm" style={{ color: "oklch(0.55 0.06 295)" }}>
            Nenhum aluno aprovado para exibir relatórios.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approved.map((a) => {
            const pid = a.principal.toString();
            const localProf = getLocalProfile(pid);
            const isExpanded = expandedStudent === pid;
            const certs = certificates.filter((c) => c.principalId === pid);
            const logs = getLogs(pid);
            const totalLogTime = logs.reduce((sum, l) => {
              if (l.sessionEnd) return sum + (l.sessionEnd - l.sessionStart);
              return sum;
            }, 0);

            return (
              <div
                key={pid}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid oklch(0.24 0.07 295)" }}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                  style={{ background: "oklch(0.14 0.05 295)" }}
                  onClick={() => setExpandedStudent(isExpanded ? null : pid)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "oklch(0.16 0.06 295)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "oklch(0.14 0.05 295)";
                  }}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown
                        className="h-4 w-4"
                        style={{ color: "oklch(0.55 0.06 295)" }}
                      />
                    ) : (
                      <ChevronRight
                        className="h-4 w-4"
                        style={{ color: "oklch(0.55 0.06 295)" }}
                      />
                    )}
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "oklch(0.85 0.04 295)" }}
                      >
                        {localProf?.cpf
                          ? `CPF: ${localProf.cpf}`
                          : `${pid.substring(0, 16)}...`}
                      </p>
                      {localProf?.email && (
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.55 0.06 295)" }}
                        >
                          {localProf.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {certs.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-none"
                        style={{
                          background: "oklch(0.22 0.08 155)",
                          color: "oklch(0.65 0.18 155)",
                        }}
                      >
                        Certificado
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportPDF(pid);
                      }}
                      className="h-7 text-xs gap-1"
                      style={{
                        borderColor: "oklch(0.30 0.09 295)",
                        color: "oklch(0.65 0.14 295)",
                        background: "transparent",
                      }}
                    >
                      <FileText className="h-3 w-3" />
                      PDF
                    </Button>
                  </div>
                </button>

                {isExpanded && (
                  <div
                    className="px-4 pb-4 space-y-4 pt-4"
                    style={{
                      borderTop: "1px solid oklch(0.22 0.07 295)",
                      background: "oklch(0.12 0.04 295)",
                    }}
                  >
                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Sessões", value: logs.length },
                        {
                          label: "Tempo total",
                          value: `${Math.round(totalLogTime / 60000)}m`,
                        },
                        { label: "Certificados", value: certs.length },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="rounded-lg p-3 text-center"
                          style={{ background: "oklch(0.16 0.06 295)" }}
                        >
                          <p
                            className="text-lg font-display font-semibold"
                            style={{ color: "oklch(0.82 0.18 295)" }}
                          >
                            {value}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "oklch(0.52 0.06 295)" }}
                          >
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Per-course progress */}
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "oklch(0.52 0.08 295)" }}
                      >
                        Progresso por curso
                      </p>
                      <div className="space-y-2">
                        {courses.map((c) => {
                          const prog = calculateCourseProgress(pid, c);
                          return (
                            <div key={c.id} className="flex items-center gap-3">
                              <p
                                className="text-sm flex-1 truncate"
                                style={{ color: "oklch(0.72 0.04 295)" }}
                              >
                                {c.title}
                              </p>
                              <div
                                className="w-24 h-1.5 rounded-full overflow-hidden"
                                style={{ background: "oklch(0.22 0.07 295)" }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${prog.percentage}%`,
                                    background:
                                      prog.percentage === 100
                                        ? "oklch(0.60 0.18 155)"
                                        : "oklch(0.62 0.22 295)",
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs font-medium w-10 text-right"
                                style={{ color: "oklch(0.65 0.10 295)" }}
                              >
                                {prog.percentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent logs */}
                    {logs.length > 0 && (
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "oklch(0.52 0.08 295)" }}
                        >
                          Últimas sessões
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {logs
                            .slice(-5)
                            .reverse()
                            .map((log) => (
                              <div
                                key={log.sessionStart}
                                className="flex items-center justify-between text-xs py-1"
                                style={{
                                  borderBottom:
                                    "1px solid oklch(0.20 0.06 295)",
                                }}
                              >
                                <span style={{ color: "oklch(0.55 0.06 295)" }}>
                                  {formatDate(log.sessionStart)}
                                </span>
                                {log.sessionEnd && (
                                  <span
                                    style={{ color: "oklch(0.55 0.06 295)" }}
                                  >
                                    {Math.round(
                                      (log.sessionEnd - log.sessionStart) /
                                        60000,
                                    )}
                                    m
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: profile } = useUserProfile();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={profile?.name} />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8 page-enter">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="flex h-6 w-6 items-center justify-center rounded"
                style={{ background: "oklch(0.20 0.08 295)" }}
              >
                <GraduationCap
                  className="h-3.5 w-3.5"
                  style={{ color: "oklch(0.72 0.18 295)" }}
                />
              </div>
              <h1
                className="text-xl font-display font-semibold tracking-tight"
                style={{ color: "oklch(0.93 0.02 295)" }}
              >
                Painel Administrativo
              </h1>
            </div>
            <p
              className="text-sm ml-8"
              style={{ color: "oklch(0.55 0.06 295)" }}
            >
              Gerencie alunos, cursos e relatórios
            </p>
          </div>
        </div>

        <Separator
          style={{ background: "oklch(0.22 0.07 295)" }}
          className="mb-6"
        />

        <Tabs defaultValue="students">
          <TabsList
            className="mb-6 h-9"
            style={{
              background: "oklch(0.16 0.06 295)",
              border: "1px solid oklch(0.26 0.08 295)",
            }}
          >
            <TabsTrigger
              value="students"
              className="gap-2 text-xs data-[state=active]:text-white"
              style={{ color: "oklch(0.65 0.06 295)" }}
            >
              <Users className="h-3.5 w-3.5" />
              Alunos
            </TabsTrigger>
            <TabsTrigger
              value="courses"
              className="gap-2 text-xs data-[state=active]:text-white"
              style={{ color: "oklch(0.65 0.06 295)" }}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Cursos
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="gap-2 text-xs data-[state=active]:text-white"
              style={{ color: "oklch(0.65 0.06 295)" }}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentsTab />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
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
