export type Status = "todo" | "doing" | "done";
export type Priority = "low" | "medium" | "high";
export type Tone = "green" | "orange" | "purple" | "blue";
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  tone: Tone;
}
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: Status;
  priority: Priority;
  due: string;
}
export interface Note {
  id: string;
  title: string;
  body: string;
  projectId: string;
  updatedAt: string;
}
export interface Workspace {
  app: "staj-rotasi";
  version: 1;
  demo: boolean;
  projects: Project[];
  tasks: Task[];
  notes: Note[];
}
export const STORAGE_KEY = "staj-rotasi.workspace.v1";
export const STATUSES: { value: Status; label: string }[] = [
  { value: "todo", label: "Yapılacak" },
  { value: "doing", label: "Devam ediyor" },
  { value: "done", label: "Tamamlandı" },
];
export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
];
export const TONES: Tone[] = ["green", "orange", "purple", "blue"];
export const emptyWorkspace = (): Workspace => ({
  app: "staj-rotasi",
  version: 1,
  demo: false,
  projects: [],
  tasks: [],
  notes: [],
});
export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function plusDays(day: string, count: number): string {
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() + count);
  return todayKey(d);
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00");
  return !Number.isNaN(d.getTime()) && todayKey(d) === value;
}
export const matches = (text: string, query: string) =>
  text
    .toLocaleLowerCase("tr-TR")
    .includes(query.trim().toLocaleLowerCase("tr-TR"));
export const isOverdue = (task: Task, day: string) =>
  task.status !== "done" && task.due !== "" && task.due < day;
export function progress(tasks: Task[]): number {
  return tasks.length
    ? Math.round(
        (tasks.filter((t) => t.status === "done").length / tasks.length) * 100,
      )
    : 0;
}
export function projectTasks(workspace: Workspace, id: string) {
  return workspace.tasks.filter((t) => t.projectId === id);
}
export function removeProject(workspace: Workspace, id: string): Workspace {
  return {
    ...workspace,
    demo: false,
    projects: workspace.projects.filter((p) => p.id !== id),
    tasks: workspace.tasks.filter((t) => t.projectId !== id),
    notes: workspace.notes.filter((n) => n.projectId !== id),
  };
}
export function sortTasks(tasks: Task[]): Task[] {
  const order = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort(
    (a, b) =>
      (a.due || "9999").localeCompare(b.due || "9999") ||
      order[a.priority] - order[b.priority],
  );
}

// LocalStorage ve yüklenen yedek aynı şemadan geçer. Beklenmeyen alanlar alınmaz.
export function validateWorkspace(input: unknown): Workspace {
  const fail = (): never => {
    throw new Error("Bu dosya geçerli bir Staj Rotası yedeği değil.");
  };
  const obj = (v: unknown): Record<string, unknown> =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : fail();
  const str = (v: unknown, max: number, required = false): string =>
    typeof v === "string" &&
    v.length <= max &&
    (!required || v.trim().length > 0)
      ? v
      : fail();
  const id = (v: unknown) => {
    const value = str(v, 80, true);
    return /^[a-zA-Z0-9_-]+$/.test(value) ? value : fail();
  };
  const list = (v: unknown, max: number): unknown[] =>
    Array.isArray(v) && v.length <= max ? v : fail();
  const root = obj(input);
  if (
    root.app !== "staj-rotasi" ||
    root.version !== 1 ||
    typeof root.demo !== "boolean"
  )
    fail();
  const projects: Project[] = list(root.projects, 100).map((v) => {
    const p = obj(v);
    if (!TONES.includes(p.tone as Tone)) fail();
    return {
      id: id(p.id),
      title: str(p.title, 80, true),
      description: str(p.description, 400),
      category: str(p.category, 40, true),
      tone: p.tone as Tone,
    };
  });
  const projectIds = new Set(projects.map((p) => p.id));
  const tasks: Task[] = list(root.tasks, 1000).map((v) => {
    const t = obj(v);
    const due = str(t.due, 10);
    const projectId = id(t.projectId);
    if (
      !projectIds.has(projectId) ||
      !STATUSES.some((s) => s.value === t.status) ||
      !PRIORITIES.some((p) => p.value === t.priority) ||
      (due && !validDate(due))
    )
      fail();
    return {
      id: id(t.id),
      title: str(t.title, 120, true),
      description: str(t.description, 600),
      projectId,
      status: t.status as Status,
      priority: t.priority as Priority,
      due,
    };
  });
  const notes: Note[] = list(root.notes, 500).map((v) => {
    const n = obj(v);
    const projectId = str(n.projectId, 80);
    const updatedAt = str(n.updatedAt, 40, true);
    if (
      (projectId && !projectIds.has(projectId)) ||
      !Number.isFinite(Date.parse(updatedAt))
    )
      fail();
    return {
      id: id(n.id),
      title: str(n.title, 80, true),
      body: str(n.body, 3000, true),
      projectId,
      updatedAt,
    };
  });
  const ids = [...projects, ...tasks, ...notes].map((v) => v.id);
  if (new Set(ids).size !== ids.length) fail();
  return {
    app: "staj-rotasi",
    version: 1,
    demo: root.demo as boolean,
    projects,
    tasks,
    notes,
  };
}

export function makeDemo(day = todayKey()): Workspace {
  const projects: Project[] = [
    {
      id: "p-portfolio",
      title: "Kişisel portfolyo",
      description: "Kendimi ve çalışmalarımı anlatan sade bir web sitesi.",
      category: "Web geliştirme",
      tone: "green",
    },
    {
      id: "p-data",
      title: "Veri keşfi çalışması",
      description: "Bir veri setini incele, bulgularını grafiklerle anlat.",
      category: "Veri analizi",
      tone: "orange",
    },
    {
      id: "p-reading",
      title: "Okuma günlüğü",
      description: "Öğrendiklerimi küçük notlarla kalıcı hâle getir.",
      category: "Kişisel gelişim",
      tone: "purple",
    },
  ];
  const tasks: Task[] = [
    {
      id: "t-1",
      title: "Sayfa yapısını planla",
      description: "Ana sayfa, çalışmalar ve iletişim bölümlerini belirle.",
      projectId: "p-portfolio",
      status: "done",
      priority: "medium",
      due: plusDays(day, -3),
    },
    {
      id: "t-2",
      title: "Renk ve yazı tiplerini belirle",
      description: "Okunabilir, tutarlı bir görsel dil seç.",
      projectId: "p-portfolio",
      status: "done",
      priority: "low",
      due: plusDays(day, -2),
    },
    {
      id: "t-3",
      title: "Ana sayfa taslağını tamamla",
      description: "Mobil görünümü de kontrol et.",
      projectId: "p-portfolio",
      status: "doing",
      priority: "high",
      due: day,
    },
    {
      id: "t-4",
      title: "Proje kartlarını oluştur",
      description: "Her çalışma için kısa bir açıklama ve bağlantı ekle.",
      projectId: "p-portfolio",
      status: "todo",
      priority: "medium",
      due: plusDays(day, 2),
    },
    {
      id: "t-5",
      title: "Siteyi yayına al",
      description: "Kurulum adımlarını README dosyasına yaz.",
      projectId: "p-portfolio",
      status: "todo",
      priority: "medium",
      due: plusDays(day, 5),
    },
    {
      id: "t-6",
      title: "Veri setini seç",
      description: "Kaynak ve lisans bilgilerini kaydet.",
      projectId: "p-data",
      status: "done",
      priority: "high",
      due: plusDays(day, -2),
    },
    {
      id: "t-7",
      title: "Eksik değerleri kontrol et",
      description: "Sütun tiplerini ve boş kayıtları incele.",
      projectId: "p-data",
      status: "doing",
      priority: "high",
      due: plusDays(day, 1),
    },
    {
      id: "t-8",
      title: "İlk grafikleri hazırla",
      description: "Grafiklere başlık ve eksen etiketi ekle.",
      projectId: "p-data",
      status: "todo",
      priority: "medium",
      due: plusDays(day, 3),
    },
    {
      id: "t-9",
      title: "Bulguları yorumla",
      description: "Sayıların ne anlattığını kısa bir paragrafla açıkla.",
      projectId: "p-data",
      status: "todo",
      priority: "low",
      due: plusDays(day, 5),
    },
    {
      id: "t-10",
      title: "Haftalık okuma listesini hazırla",
      description: "İki kısa kaynak seç.",
      projectId: "p-reading",
      status: "done",
      priority: "low",
      due: plusDays(day, -1),
    },
    {
      id: "t-11",
      title: "React state notlarını düzenle",
      description: "useState ve useEffect için kendi örneğini yaz.",
      projectId: "p-reading",
      status: "todo",
      priority: "medium",
      due: day,
    },
    {
      id: "t-12",
      title: "Haftayı değerlendir",
      description: "Neler öğrendim, sırada ne var?",
      projectId: "p-reading",
      status: "todo",
      priority: "low",
      due: plusDays(day, 4),
    },
  ];
  return {
    app: "staj-rotasi",
    version: 1,
    demo: true,
    projects,
    tasks,
    notes: [
      {
        id: "n-1",
        title: "Küçük bir başlangıç notu",
        body: "Büyük bir görevi, tek oturuşta bitebilecek parçalara bölmek işimi kolaylaştırıyor.\n\nBugünkü hedefim: bir küçük adımı tamamlamak.",
        projectId: "",
        updatedAt: new Date(day + "T12:00:00").toISOString(),
      },
      {
        id: "n-2",
        title: "Portfolyo için fikirler",
        body: "Projelerde sadece sonucu değil, süreçte ne öğrendiğimi de anlatacağım.\n\nMobil görünüm ve okunabilirlik öncelikli.",
        projectId: "p-portfolio",
        updatedAt: new Date(day + "T12:00:00").toISOString(),
      },
    ],
  };
}
