// ─── EAD Data Types ───────────────────────────────────────────────────────────

export interface LocalProfile {
  email: string;
  cpf: string;
  phone: string;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string; // YouTube URL
  duration: number; // seconds
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  modules: Module[];
}

export interface LessonProgress {
  secondsWatched: number;
  completed: boolean;
  lastWatched: number;
}

export type Progress = Record<string, LessonProgress>;

export interface AccessLog {
  sessionStart: number;
  sessionEnd?: number;
  device: string;
}

export interface Certificate {
  code: string;
  studentName: string;
  cpf: string;
  courseName: string;
  courseId: string;
  completionDate: number;
  principalId: string;
}

// ─── Demo data ─────────────────────────────────────────────────────────────────

export const DEMO_COURSE: Course = {
  id: "course-demo",
  title: "Treinamento Corporativo - Segurança no Trabalho",
  description:
    "Curso completo sobre normas de segurança e boas práticas no ambiente de trabalho.",
  createdAt: Date.now(),
  modules: [
    {
      id: "mod-1",
      title: "Módulo 1: Introdução à Segurança",
      lessons: [
        {
          id: "les-1",
          title: "Aula 1: Conceitos Básicos",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 60,
        },
        {
          id: "les-2",
          title: "Aula 2: Equipamentos de Proteção",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 90,
        },
      ],
    },
    {
      id: "mod-2",
      title: "Módulo 2: Procedimentos de Emergência",
      lessons: [
        {
          id: "les-3",
          title: "Aula 3: Evacuação",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 75,
        },
      ],
    },
  ],
};
