import { useState, useEffect } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import AppHeader from "../components/AppHeader";
import { useUserProfile, useListApprovals, useSetApproval, ApprovalStatus } from "../hooks/useQueries";
import {
  getCourses,
  saveCourses,
  getProgress,
  getLogs,
  getLocalProfile,
  getCertificates,
  calculateCourseProgress,
} from "../lib/ead-storage";
import type { Course, Module, Lesson } from "../lib/ead-types";
import {
  Users,
  BookOpen,
  BarChart3,
  Plus,
  Trash2,
  Check,
  Ban,
  FileText,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Loader2,
} from "lucide-react";
import type { Principal } from "@icp-sdk/core/principal";
import jsPDF from "jspdf";

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
      await setApproval.mutateAsync({ user: principal, status: ApprovalStatus.approved });
      toast.success("Aluno aprovado.");
    } catch {
      toast.error("Erro ao aprovar aluno.");
    }
  };

  const handleBlock = async (principal: Principal) => {
    try {
      await setApproval.mutateAsync({ user: principal, status: ApprovalStatus.rejected });
      toast.success("Aluno bloqueado.");
    } catch {
      toast.error("Erro ao bloquear aluno.");
    }
  };

  const counts = {
    all: approvals?.length ?? 0,
    pending: approvals?.filter((a) => a.status === ApprovalStatus.pending).length ?? 0,
    approved: approvals?.filter((a) => a.status === ApprovalStatus.approved).length ?? 0,
    rejected: approvals?.filter((a) => a.status === ApprovalStatus.rejected).length ?? 0,
  };

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", ApprovalStatus.pending, ApprovalStatus.approved, ApprovalStatus.rejected] as const).map((f) => {
          const labels: Record<string, string> = {
            all: "Todos",
            pending: "Aguardando",
            approved: "Aprovados",
            rejected: "Bloqueados",
          };
          const countVal = counts[f === "all" ? "all" : f];
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "text-white"
                  : "border border-border bg-card hover:bg-muted text-foreground"
              }`}
              style={
                filter === f
                  ? { background: "oklch(var(--navy-deep))" }
                  : {}
              }
            >
              {labels[f]}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  filter === f ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
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
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Nenhum aluno neste filtro.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow style={{ background: "oklch(var(--navy-pale))" }}>
                <TableHead className="font-semibold text-xs" style={{ color: "oklch(var(--navy-deep))" }}>
                  Principal ID
                </TableHead>
                <TableHead className="font-semibold text-xs" style={{ color: "oklch(var(--navy-deep))" }}>
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs text-right" style={{ color: "oklch(var(--navy-deep))" }}>
                  Acoes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((approval) => {
                const pid = approval.principal.toString();
                return (
                  <TableRow key={pid} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
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
                            style={{ borderColor: "oklch(0.52 0.14 165)", color: "oklch(0.38 0.14 165)" }}
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
                            className="h-7 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/5"
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
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // New course form
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [addCourseOpen, setAddCourseOpen] = useState(false);

  // New module form state
  const [newModuleTitle, setNewModuleTitle] = useState<Record<string, string>>({});

  // New lesson form state
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
        modules: [
          ...c.modules,
          { id: generateId(), title, lessons: [] },
        ],
      };
    });
    persist(updated);
    setNewModuleTitle((prev) => ({ ...prev, [courseId]: "" }));
    toast.success("Modulo adicionado.");
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
      toast.error("Preencha titulo e URL do video.");
      return;
    }
    const dur = parseInt(state.duration) || 60;
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
    setNewLessonState((prev) => ({ ...prev, [key]: { title: "", url: "", duration: "" } }));
    toast.success("Aula adicionada.");
  };

  const deleteLesson = (courseId: string, moduleId: string, lessonId: string) => {
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
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
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
              style={{ background: "oklch(var(--navy-deep))", color: "white" }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo curso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo curso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Titulo</Label>
                <Input
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="Titulo do curso"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descricao</Label>
                <Textarea
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Descricao breve"
                  rows={3}
                />
              </div>
              <Button
                onClick={addCourse}
                disabled={!newCourseTitle.trim()}
                className="w-full"
                style={{ background: "oklch(var(--navy-deep))", color: "white" }}
              >
                Criar curso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum curso criado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const isExpanded = expandedCourses.has(course.id);
            return (
              <div
                key={course.id}
                className="rounded-lg border border-border overflow-hidden"
                style={{ boxShadow: "0 1px 3px oklch(0.22 0.065 258 / 0.06)" }}
              >
                {/* Course header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: "oklch(var(--navy-pale))" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCourse(course.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{course.title}</p>
                      {course.description && (
                        <p className="text-xs text-muted-foreground">{course.description}</p>
                      )}
                    </div>
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acao nao pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCourse(course.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Modules */}
                    {course.modules.map((mod: Module) => {
                      const modExpanded = expandedModules.has(mod.id);
                      return (
                        <div key={mod.id} className="border border-border rounded-md overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                            <button
                              type="button"
                              onClick={() => toggleModule(mod.id)}
                              className="flex items-center gap-2 flex-1 text-left"
                            >
                              {modExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium">{mod.title}</span>
                              <Badge variant="secondary" className="text-xs">
                                {mod.lessons.length} aulas
                              </Badge>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteModule(course.id, mod.id)}
                              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {modExpanded && (
                            <div className="p-3 space-y-2">
                              {/* Lessons list */}
                              {mod.lessons.map((lesson: Lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between gap-2 rounded px-2 py-1.5 bg-muted/20"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm truncate">{lesson.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDuration(lesson.duration)} &bull; {lesson.videoUrl.substring(0, 40)}...
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => deleteLesson(course.id, mod.id, lesson.id)}
                                    className="h-6 w-6 flex shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}

                              {/* Add lesson form */}
                              <div
                                className="rounded border border-dashed border-border p-3 space-y-2"
                              >
                                <p className="text-xs font-medium text-muted-foreground mb-2">Adicionar aula</p>
                                <Input
                                  placeholder="Titulo da aula"
                                  value={newLessonState[`${course.id}_${mod.id}`]?.title ?? ""}
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
                                />
                                <Input
                                  placeholder="URL do YouTube"
                                  value={newLessonState[`${course.id}_${mod.id}`]?.url ?? ""}
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
                                />
                                <Input
                                  placeholder="Duracao em segundos (ex: 300)"
                                  type="number"
                                  value={newLessonState[`${course.id}_${mod.id}`]?.duration ?? ""}
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
                                />
                                <Button
                                  size="sm"
                                  onClick={() => addLesson(course.id, mod.id)}
                                  className="h-7 text-xs gap-1"
                                  style={{ background: "oklch(var(--navy-deep))", color: "white" }}
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
                        placeholder="Nome do novo modulo"
                        value={newModuleTitle[course.id] ?? ""}
                        onChange={(e) =>
                          setNewModuleTitle((prev) => ({
                            ...prev,
                            [course.id]: e.target.value,
                          }))
                        }
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => addModule(course.id)}
                        disabled={!newModuleTitle[course.id]?.trim()}
                        className="h-8 text-xs gap-1 shrink-0"
                        style={{ background: "oklch(var(--navy-deep))", color: "white" }}
                      >
                        <Plus className="h-3 w-3" />
                        Modulo
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
    const doc = new jsPDF();
    const localProf = getLocalProfile(principalId);
    const certs = certificates.filter((c) => c.principalId === principalId);
    const logs = getLogs(principalId);

    doc.setFontSize(18);
    doc.setTextColor(13, 43, 85);
    doc.text("Relatorio de Aluno - EAD Corporativo", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Principal ID: ${principalId}`, 14, 34);

    if (localProf) {
      doc.text(`CPF: ${localProf.cpf}`, 14, 42);
      doc.text(`Telefone: ${localProf.phone}`, 14, 50);
      if (localProf.company) doc.text(`Empresa: ${localProf.company}`, 14, 58);
    }

    let y = 70;
    doc.setFontSize(13);
    doc.setTextColor(13, 43, 85);
    doc.text("Progresso nos Cursos", 14, y);
    y += 8;

    for (const course of courses) {
      const prog = calculateCourseProgress(principalId, course);
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(
        `${course.title}: ${prog.completed}/${prog.total} aulas (${prog.percentage}%)`,
        14,
        y
      );
      y += 7;
    }

    y += 6;
    doc.setFontSize(13);
    doc.setTextColor(13, 43, 85);
    doc.text("Certificados Emitidos", 14, y);
    y += 8;

    if (certs.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Nenhum certificado emitido.", 14, y);
      y += 7;
    } else {
      for (const cert of certs) {
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text(
          `${cert.courseName} - ${new Date(cert.completionDate).toLocaleDateString("pt-BR")} (Cod: ${cert.code})`,
          14,
          y
        );
        y += 7;
      }
    }

    y += 6;
    doc.setFontSize(13);
    doc.setTextColor(13, 43, 85);
    doc.text("Logs de Acesso", 14, y);
    y += 8;

    if (logs.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Nenhum log registrado.", 14, y);
    } else {
      for (const log of logs.slice(-10)) {
        const start = new Date(log.sessionStart).toLocaleString("pt-BR");
        const end = log.sessionEnd
          ? new Date(log.sessionEnd).toLocaleString("pt-BR")
          : "Em andamento";
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.text(`Entrada: ${start} | Saida: ${end}`, 14, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      }
    }

    doc.save(`relatorio_${principalId.substring(0, 8)}.pdf`);
    toast.success("PDF exportado.");
  };

  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const approved = (approvals ?? []).filter(
    (a) => a.status === ApprovalStatus.approved
  );

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        {approved.length} aluno(s) aprovado(s)
      </p>

      {approved.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Nenhum aluno aprovado para exibir relatorios.
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
                className="rounded-lg border border-border overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 text-left"
                  onClick={() => setExpandedStudent(isExpanded ? null : pid)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {localProf?.cpf ? `CPF: ${localProf.cpf}` : pid.substring(0, 16) + "..."}
                      </p>
                      {localProf?.company && (
                        <p className="text-xs text-muted-foreground">{localProf.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {certs.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-none"
                        style={{ background: "oklch(0.94 0.05 165)", color: "oklch(0.38 0.14 165)" }}
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
                    >
                      <FileText className="h-3 w-3" />
                      PDF
                    </Button>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border space-y-4 pt-4">
                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-lg font-semibold" style={{ color: "oklch(var(--navy-deep))" }}>
                          {logs.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Sessoes</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-lg font-semibold" style={{ color: "oklch(var(--navy-deep))" }}>
                          {Math.round(totalLogTime / 60000)}m
                        </p>
                        <p className="text-xs text-muted-foreground">Tempo total</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-lg font-semibold" style={{ color: "oklch(var(--navy-deep))" }}>
                          {certs.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Certificados</p>
                      </div>
                    </div>

                    {/* Per-course progress */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Progresso por curso
                      </p>
                      <div className="space-y-2">
                        {courses.map((c) => {
                          const prog = calculateCourseProgress(pid, c);
                          return (
                            <div key={c.id} className="flex items-center gap-3">
                              <p className="text-sm flex-1 truncate">{c.title}</p>
                              <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${prog.percentage}%`,
                                    background: prog.percentage === 100
                                      ? "oklch(0.52 0.14 165)"
                                      : "oklch(var(--navy-mid))",
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium w-10 text-right">
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
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Ultimas sessoes
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {logs.slice(-5).reverse().map((log) => (
                            <div key={log.sessionStart} className="flex items-center justify-between text-xs py-1 border-b border-border/50">
                              <span className="text-muted-foreground">{formatDate(log.sessionStart)}</span>
                              {log.sessionEnd && (
                                <span className="text-muted-foreground">
                                  {Math.round((log.sessionEnd - log.sessionStart) / 60000)}m
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
                style={{ background: "oklch(var(--navy-pale))" }}
              >
                <GraduationCap className="h-3.5 w-3.5" style={{ color: "oklch(var(--navy-deep))" }} />
              </div>
              <h1
                className="text-xl font-semibold tracking-tight"
                style={{ color: "oklch(var(--navy-deep))" }}
              >
                Painel Administrativo
              </h1>
            </div>
            <p className="text-sm text-muted-foreground ml-8">
              Gerencie alunos, cursos e relatórios
            </p>
          </div>
        </div>

        <Separator className="mb-6" />

        <Tabs defaultValue="students">
          <TabsList className="mb-6 h-9">
            <TabsTrigger value="students" className="gap-2 text-xs">
              <Users className="h-3.5 w-3.5" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Cursos
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Relatorios
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
