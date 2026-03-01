import {
  type AccessLog,
  type Certificate,
  type Course,
  DEMO_COURSE,
  type LocalProfile,
  type Progress,
} from "./ead-types";

// ─── Keys ──────────────────────────────────────────────────────────────────────

const coursesKey = () => "ead_courses";
const profileKey = (principal: string) => `ead_profile_${principal}`;
const progressKey = (principal: string) => `ead_progress_${principal}`;
const logsKey = (principal: string) => `ead_logs_${principal}`;
const certificatesKey = () => "ead_certificates";
const currentSessionKey = (principal: string) => `ead_session_${principal}`;

// ─── Courses ───────────────────────────────────────────────────────────────────

export function getCourses(): Course[] {
  try {
    const raw = localStorage.getItem(coursesKey());
    if (!raw) {
      const initial = [DEMO_COURSE];
      localStorage.setItem(coursesKey(), JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as Course[];
  } catch {
    return [DEMO_COURSE];
  }
}

export function saveCourses(courses: Course[]): void {
  localStorage.setItem(coursesKey(), JSON.stringify(courses));
}

export function getCourse(id: string): Course | null {
  return getCourses().find((c) => c.id === id) ?? null;
}

// ─── Local Profile ─────────────────────────────────────────────────────────────

export function getLocalProfile(principal: string): LocalProfile | null {
  try {
    const raw = localStorage.getItem(profileKey(principal));
    if (!raw) return null;
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return null;
  }
}

export function saveLocalProfile(
  principal: string,
  profile: LocalProfile,
): void {
  localStorage.setItem(profileKey(principal), JSON.stringify(profile));
}

// ─── Progress ──────────────────────────────────────────────────────────────────

export function getProgress(principal: string): Progress {
  try {
    const raw = localStorage.getItem(progressKey(principal));
    if (!raw) return {};
    return JSON.parse(raw) as Progress;
  } catch {
    return {};
  }
}

export function saveProgress(principal: string, progress: Progress): void {
  localStorage.setItem(progressKey(principal), JSON.stringify(progress));
}

export function updateLessonProgress(
  principal: string,
  lessonId: string,
  secondsWatched: number,
  duration: number,
): void {
  const progress = getProgress(principal);
  progress[lessonId] = {
    secondsWatched,
    completed: secondsWatched >= duration,
    lastWatched: Date.now(),
  };
  saveProgress(principal, progress);
}

// ─── Access Logs ───────────────────────────────────────────────────────────────

export function getLogs(principal: string): AccessLog[] {
  try {
    const raw = localStorage.getItem(logsKey(principal));
    if (!raw) return [];
    return JSON.parse(raw) as AccessLog[];
  } catch {
    return [];
  }
}

export function startSession(principal: string): void {
  const session: AccessLog = {
    sessionStart: Date.now(),
    device: navigator.userAgent.substring(0, 80),
  };
  localStorage.setItem(currentSessionKey(principal), JSON.stringify(session));
}

export function endSession(principal: string): void {
  const raw = localStorage.getItem(currentSessionKey(principal));
  if (!raw) return;
  const session = JSON.parse(raw) as AccessLog;
  session.sessionEnd = Date.now();
  const logs = getLogs(principal);
  logs.push(session);
  localStorage.setItem(logsKey(principal), JSON.stringify(logs));
  localStorage.removeItem(currentSessionKey(principal));
}

// ─── Certificates ──────────────────────────────────────────────────────────────

export function getCertificates(): Certificate[] {
  try {
    const raw = localStorage.getItem(certificatesKey());
    if (!raw) return [];
    return JSON.parse(raw) as Certificate[];
  } catch {
    return [];
  }
}

export function saveCertificate(cert: Certificate): void {
  const certs = getCertificates();
  const existing = certs.findIndex(
    (c) => c.courseId === cert.courseId && c.principalId === cert.principalId,
  );
  if (existing >= 0) {
    certs[existing] = cert;
  } else {
    certs.push(cert);
  }
  localStorage.setItem(certificatesKey(), JSON.stringify(certs));
}

export function getCertificateByCode(code: string): Certificate | null {
  return getCertificates().find((c) => c.code === code) ?? null;
}

export function getCertificateForStudent(
  principalId: string,
  courseId: string,
): Certificate | null {
  return (
    getCertificates().find(
      (c) => c.principalId === principalId && c.courseId === courseId,
    ) ?? null
  );
}

// ─── Course Progress Helpers ───────────────────────────────────────────────────

export function calculateCourseProgress(
  principal: string,
  course: Course,
): { completed: number; total: number; percentage: number } {
  const progress = getProgress(principal);
  let total = 0;
  let completed = 0;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      total++;
      if (progress[lesson.id]?.completed) completed++;
    }
  }
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function isCourseComplete(principal: string, course: Course): boolean {
  const { completed, total } = calculateCourseProgress(principal, course);
  return total > 0 && completed === total;
}

// ─── Generate certificate code ─────────────────────────────────────────────────

export function generateCertCode(
  principalId: string,
  courseId: string,
): string {
  const hash = btoa(`${principalId}-${courseId}-${Date.now()}`)
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .substring(0, 12);
  return hash;
}
