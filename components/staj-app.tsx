"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  Clock3,
  Compass,
  Download,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  NotebookPen,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { Empty, formatDay, ProjectCard, TaskRow } from "./planner-cards";
import { ModalFrame, NoteForm, ProjectForm, TaskForm } from "./planner-forms";
import {
  emptyWorkspace,
  isOverdue,
  makeDemo,
  matches,
  plusDays,
  PRIORITIES,
  progress,
  removeProject,
  sortTasks,
  STATUSES,
  STORAGE_KEY,
  todayKey,
  validateWorkspace,
  type Note,
  type Project,
  type Status,
  type Task,
  type Workspace,
} from "@/lib/planner";

type View = "overview" | "projects" | "tasks" | "notes";
type Modal =
  | { kind: "project"; value?: Project }
  | { kind: "task"; value?: Task; projectId?: string }
  | { kind: "note"; value?: Note }
  | { kind: "data" }
  | { kind: "about" }
  | {
      kind: "delete";
      entity: "project" | "task" | "note";
      id: string;
      title: string;
    }
  | null;
const NAV: { key: View; label: string; icon: typeof Compass }[] = [
  { key: "overview", label: "Genel bakış", icon: LayoutDashboard },
  { key: "projects", label: "Projelerim", icon: FolderKanban },
  { key: "tasks", label: "Görev panosu", icon: ListTodo },
  { key: "notes", label: "Çalışma notları", icon: NotebookPen },
];

export default function StajApp() {
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDay, setFilterDay] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [importName, setImportName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingImport = useRef<Workspace | null>(null);
  const today = todayKey();

  // Tarayıcı API'si sadece istemcide okunur. İlk ziyaret örnek alanla başlar.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setWorkspace(stored ? validateWorkspace(JSON.parse(stored)) : makeDemo());
    } catch {
      setBlocked(true);
      setStorageError(
        "Kaydedilen veriler okunamadı. Mevcut kayıt korunuyor. Veri yönetiminden geçerli bir yedek yükleyebilir veya yeni bir alan açabilirsin.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || blocked) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
      setStorageError("");
    } catch {
      setStorageError(
        "Tarayıcıya kayıt yapılamadı. Veri yönetiminden yedek indirerek çalışmalarını koru.",
      );
    }
  }, [workspace, ready, blocked]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timeout);
  }, [toast]);
  function change(next: Workspace, message?: string) {
    if (blocked) {
      setToast("Önce veri yönetiminden kayıt sorununu çöz.");
      return;
    }
    try {
      setWorkspace(validateWorkspace(next));
      if (message) setToast(message);
    } catch {
      setToast(
        "Bu işlem kaydedilemedi. Alan sınırlarını ve ilişkileri kontrol et.",
      );
    }
  }
  function openTask(projectId?: string) {
    if (!workspace.projects.length) {
      setToast("Görev eklemek için önce bir proje oluştur.");
      setModal({ kind: "project" });
      return;
    }
    setModal({ kind: "task", projectId });
  }
  function navigate(next: View) {
    setView(next);
    setQuery("");
    setFilterProject("all");
    setFilterPriority("all");
    setFilterDay("");
  }
  function saveProject(p: Project) {
    change(
      {
        ...workspace,
        demo: false,
        projects: workspace.projects.some((v) => v.id === p.id)
          ? workspace.projects.map((v) => (v.id === p.id ? p : v))
          : [...workspace.projects, p],
      },
      "Proje kaydedildi.",
    );
    setModal(null);
  }
  function saveTask(t: Task) {
    change(
      {
        ...workspace,
        demo: false,
        tasks: workspace.tasks.some((v) => v.id === t.id)
          ? workspace.tasks.map((v) => (v.id === t.id ? t : v))
          : [...workspace.tasks, t],
      },
      "Görev kaydedildi.",
    );
    setModal(null);
  }
  function saveNote(n: Note) {
    change(
      {
        ...workspace,
        demo: false,
        notes: workspace.notes.some((v) => v.id === n.id)
          ? workspace.notes.map((v) => (v.id === n.id ? n : v))
          : [n, ...workspace.notes],
      },
      "Not kaydedildi.",
    );
    setModal(null);
  }
  function setStatus(id: string, status: Status) {
    change(
      {
        ...workspace,
        demo: false,
        tasks: workspace.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
      },
      status === "done"
        ? "Bir adım daha tamamlandı!"
        : "Görev durumu güncellendi.",
    );
  }
  function deleteItem() {
    if (modal?.kind !== "delete") return;
    let next = workspace;
    if (modal.entity === "project") next = removeProject(workspace, modal.id);
    if (modal.entity === "task")
      next = {
        ...workspace,
        demo: false,
        tasks: workspace.tasks.filter((t) => t.id !== modal.id),
      };
    if (modal.entity === "note")
      next = {
        ...workspace,
        demo: false,
        notes: workspace.notes.filter((n) => n.id !== modal.id),
      };
    change(next, "Kayıt silindi.");
    setModal(null);
  }
  function downloadBackup() {
    const blob = new Blob(
      [
        JSON.stringify(
          { ...workspace, exportedAt: new Date().toISOString() },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staj-rotasi-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Yedek dosyası indirildi.");
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      if (file.size > 600_000)
        throw new Error("Dosya çok büyük. En fazla 600 KB yükleyebilirsin.");
      pendingImport.current = validateWorkspace(JSON.parse(await file.text()));
      setImportName(file.name);
      setModal({ kind: "data" });
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Yedek okunamadı.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  function replaceData(next: Workspace) {
    setBlocked(false);
    setWorkspace(next);
    setImportName("");
    pendingImport.current = null;
    setModal(null);
    setFilterProject("all");
    setFilterDay("");
    setToast("Çalışma alanı hazır.");
  }

  const filteredTasks = useMemo(
    () =>
      sortTasks(
        workspace.tasks.filter(
          (t) =>
            matches(
              t.title +
                " " +
                t.description +
                " " +
                (workspace.projects.find((p) => p.id === t.projectId)?.title ||
                  ""),
              query,
            ) &&
            (filterProject === "all" || t.projectId === filterProject) &&
            (filterPriority === "all" || t.priority === filterPriority) &&
            (!filterDay || t.due === filterDay),
        ),
      ),
    [workspace, query, filterProject, filterPriority, filterDay],
  );
  const filteredProjects = workspace.projects.filter((p) =>
    matches(p.title + " " + p.description + " " + p.category, query),
  );
  const filteredNotes = workspace.notes
    .filter(
      (n) =>
        matches(n.title + " " + n.body, query) &&
        (filterProject === "all" || n.projectId === filterProject),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const done = workspace.tasks.filter((t) => t.status === "done").length;
  const doing = workspace.tasks.filter((t) => t.status === "doing").length;
  const percent = progress(workspace.tasks);
  const pending = sortTasks(workspace.tasks.filter((t) => t.status !== "done"));
  const overdue = workspace.tasks.filter((t) => isOverdue(t, today)).length;
  const selectedNav = NAV.find((n) => n.key === view)!;
  const card = (p: Project) => (
    <ProjectCard
      key={p.id}
      project={p}
      workspace={workspace}
      onEdit={() => setModal({ kind: "project", value: p })}
      onOpen={() => {
        navigate("tasks");
        setFilterProject(p.id);
      }}
      onTask={() => openTask(p.id)}
    />
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("overview");
          }}
          aria-label="Staj Rotası ana sayfa"
        >
          <span className="brand-icon">
            <Compass size={27} />
          </span>
          <span>
            staj<span className="brand-light">rotası</span>
            <small>KENDİ YOLUNU ÇİZ</small>
          </span>
        </a>
        <p className="nav-label">ÇALIŞMA ALANIN</p>
        <nav aria-label="Ana gezinme">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${view === n.key ? "active" : ""}`}
              disabled={!ready}
              onClick={() => navigate(n.key)}
              aria-current={view === n.key ? "page" : undefined}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.key === "tasks" && workspace.tasks.length > 0 && (
                <span className="nav-count">
                  {workspace.tasks.length - done}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">
              <Sparkles size={20} />
            </span>
            <strong>Küçük adımlar da ilerlemedir.</strong>
            <p>Bugün bir görev tamamlamakla başla.</p>
            <button onClick={() => openTask()}>
              Bir görev ekle <ArrowRight size={15} />
            </button>
          </div>
          <button
            className="sidebar-utility"
            onClick={() => {
              setImportName("");
              pendingImport.current = null;
              setModal({ kind: "data" });
            }}
          >
            <Settings2 size={17} />
            Veri yönetimi
          </button>
          <button
            className="sidebar-utility"
            onClick={() => setModal({ kind: "about" })}
          >
            <BookOpen size={17} />
            Uygulama hakkında
          </button>
          <div className="user-profile">
            <span className="avatar">MK</span>
            <div>
              <strong>Mert Ali Korkmaz</strong>
              <span>Kişisel çalışma alanı</span>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Çalışma alanı</span>
            <ChevronRight size={14} />
            <strong>{selectedNav.label}</strong>
          </div>
          <div className="topbar-right">
            <button
              className="icon-button mobile-data"
              aria-label="Veri yönetimini aç"
              disabled={!ready}
              onClick={() => setModal({ kind: "data" })}
            >
              <Settings2 size={18} />
            </button>
            <span className={`save-status ${storageError ? "warning" : ""}`}>
              <span />
              {!ready
                ? "Yükleniyor"
                : storageError
                  ? "Kayıt uyarısı"
                  : "Bu tarayıcıda kayıtlı"}
            </span>
            <button
              className="icon-button"
              title="Yedek indir"
              aria-label="JSON yedeği indir"
              onClick={downloadBackup}
              disabled={!ready}
            >
              <Download size={18} />
            </button>
            <span className="avatar small">MK</span>
          </div>
        </header>
        <main id="main" className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {ready
                  ? new Intl.DateTimeFormat("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date())
                  : "Çalışma alanın"}
                <span className="date-separator">/</span>
                {ready
                  ? new Intl.DateTimeFormat("tr-TR", {
                      weekday: "long",
                    }).format(new Date())
                  : ""}
                {ready && workspace.demo && (
                  <span className="demo-tag">Örnek çalışma alanı</span>
                )}
              </div>
              <h1>{view === "overview" ? "Genel bakış" : selectedNav.label}</h1>
              <p>
                {view === "overview"
                  ? "Merhaba Mert, bugün güzel bir başlangıç yapalım."
                  : view === "projects"
                    ? "Fikirlerini projelere, projelerini küçük adımlara dönüştür."
                    : view === "tasks"
                      ? "Sıradaki adımını seç, odaklan ve tamamla."
                      : "Fikirlerin ve öğrendiklerin burada biriksin."}
              </p>
            </div>
            <button
              className="button primary"
              onClick={() =>
                view === "projects"
                  ? setModal({ kind: "project" })
                  : view === "notes"
                    ? setModal({ kind: "note" })
                    : openTask()
              }
            >
              <Plus size={18} />
              {view === "projects"
                ? "Yeni proje"
                : view === "notes"
                  ? "Yeni not"
                  : "Yeni görev"}
            </button>
          </div>
          {storageError && (
            <div role="alert" className="storage-alert">
              {storageError}
              <button onClick={() => setModal({ kind: "data" })}>
                Veri yönetimi
              </button>
            </div>
          )}
          {!ready ? (
            <div className="loading-state" role="status">
              Çalışma alanın hazırlanıyor...
            </div>
          ) : (
            <>
              {view === "overview" ? (
                <>
                  <section className="welcome-banner">
                    <div className="welcome-copy">
                      <span className="welcome-kicker">
                        <span />
                        KENDİ TEMPONDA, KENDİ YOLUNDA
                      </span>
                      <h2>
                        Her proje için
                        <br />
                        bir sonraki adım.
                      </h2>
                      <p>
                        Planlarını sadeleştir, ilerlemeni görünür kıl.
                        <br className="desktop-break" /> Tüm çalışmaların, tek
                        bir yerde.
                      </p>
                      <button
                        className="button hero-button"
                        onClick={() => navigate("tasks")}
                      >
                        Görevlerime göz at <ArrowRight size={17} />
                      </button>
                    </div>
                    <div className="banner-visual" aria-hidden="true">
                      <div className="orbit orbit-one" />
                      <div className="orbit orbit-two" />
                      <div className="banner-compass">
                        <Compass size={124} strokeWidth={0.9} />
                      </div>
                      <span className="float-tag tag-one">
                        <Check size={16} />
                        Bir adım daha!
                      </span>
                      <span className="float-tag tag-two">
                        <Target size={17} />
                        Hedefine odaklan
                      </span>
                      <span className="visual-star star-one">✦</span>
                      <span className="visual-star star-two">✧</span>
                    </div>
                  </section>
                  <section className="stats-grid" aria-label="Çalışma özeti">
                    {[
                      {
                        icon: FolderKanban,
                        label: "Toplam proje",
                        value: workspace.projects.length,
                        detail: "Fikirden uygulamaya",
                        tone: "green",
                      },
                      {
                        icon: ListTodo,
                        label: "Devam eden görev",
                        value: doing,
                        detail: "Bir adım daha yakındasın",
                        tone: "orange",
                      },
                      {
                        icon: CircleCheck,
                        label: "Tamamlanan görev",
                        value: done,
                        detail: `Toplam ${workspace.tasks.length} görev içinden`,
                        tone: "blue",
                      },
                      {
                        icon: NotebookPen,
                        label: "Çalışma notu",
                        value: workspace.notes.length,
                        detail: "Öğrendiklerin hep yanında",
                        tone: "purple",
                      },
                    ].map((s) => (
                      <article className="stat-card" key={s.label}>
                        <div>
                          <span>{s.label}</span>
                          <strong>{s.value}</strong>
                          <small>{s.detail}</small>
                        </div>
                        <span className={`stat-icon ${s.tone}`}>
                          <s.icon size={22} />
                        </span>
                      </article>
                    ))}
                  </section>
                  <div className="dashboard-columns">
                    <div className="dashboard-main">
                      <section>
                        <div className="section-heading">
                          <h2>
                            Projelerim{" "}
                            <span className="count-badge">
                              {workspace.projects.length}
                            </span>
                          </h2>
                          <button
                            className="text-link"
                            onClick={() => navigate("projects")}
                          >
                            Tüm projeler <ArrowRight size={15} />
                          </button>
                        </div>
                        {workspace.projects.length ? (
                          <div className="project-grid compact">
                            {workspace.projects.slice(0, 3).map(card)}
                          </div>
                        ) : (
                          <Empty
                            title="İlk projenle başla"
                            description="Bir fikir, birkaç küçük görev. İhtiyacın olan bu kadar."
                            action="Proje oluştur"
                            onAction={() => setModal({ kind: "project" })}
                          />
                        )}
                      </section>
                      <section className="tasks-section">
                        <div className="section-heading">
                          <h2>Sıradaki görevler</h2>
                          <button
                            className="text-link"
                            onClick={() => navigate("tasks")}
                          >
                            Panoya git <ArrowRight size={15} />
                          </button>
                        </div>
                        <div className="task-list">
                          {pending.length ? (
                            pending
                              .slice(0, 4)
                              .map((t) => (
                                <TaskRow
                                  key={t.id}
                                  task={t}
                                  workspace={workspace}
                                  onEdit={() =>
                                    setModal({ kind: "task", value: t })
                                  }
                                  onToggle={() =>
                                    setStatus(
                                      t.id,
                                      t.status === "done" ? "todo" : "done",
                                    )
                                  }
                                />
                              ))
                          ) : (
                            <Empty
                              title="Sırada bekleyen görev yok"
                              description="Yeni bir adım planlayabilir veya tamamladıklarının keyfini çıkarabilirsin."
                              action="Görev ekle"
                              onAction={() => openTask()}
                            />
                          )}
                        </div>
                      </section>
                    </div>
                    <aside className="dashboard-aside">
                      <section className="week-panel">
                        <div className="section-heading">
                          <h2>Haftalık plan</h2>
                          <div className="week-buttons">
                            <button
                              className="icon-button"
                              aria-label="Önceki hafta"
                              onClick={() => setWeekOffset((v) => v - 7)}
                            >
                              <ChevronRight className="rotate" size={15} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label="Sonraki hafta"
                              onClick={() => setWeekOffset((v) => v + 7)}
                            >
                              <ChevronRight size={15} />
                            </button>
                          </div>
                        </div>
                        <p className="panel-subtitle">
                          {formatDay(plusDays(today, weekOffset))} –{" "}
                          {formatDay(plusDays(today, weekOffset + 6))}
                        </p>
                        <div className="week-strip">
                          {Array.from({ length: 7 }, (_, i) => {
                            const day = plusDays(today, weekOffset + i);
                            const hasTask = workspace.tasks.some(
                              (t) => t.due === day && t.status !== "done",
                            );
                            return (
                              <button
                                key={day}
                                className={day === today ? "today" : ""}
                                aria-label={`${formatDay(day)} görevlerini göster`}
                                onClick={() => {
                                  navigate("tasks");
                                  setFilterDay(day);
                                }}
                              >
                                <span>
                                  {new Intl.DateTimeFormat("tr-TR", {
                                    weekday: "short",
                                  })
                                    .format(new Date(day + "T12:00:00"))
                                    .slice(0, 2)}
                                </span>
                                <strong>{Number(day.slice(-2))}</strong>
                                <i className={hasTask ? "has-task" : ""} />
                              </button>
                            );
                          })}
                        </div>
                        <div className="week-task">
                          <span className="soft-icon">
                            <Clock3 size={18} />
                          </span>
                          <div>
                            <strong>
                              {
                                workspace.tasks.filter(
                                  (t) => t.due === today && t.status !== "done",
                                ).length
                              }{" "}
                              görev bugün seni bekliyor
                            </strong>
                            <p>
                              {overdue
                                ? `${overdue} görevin hedef tarihi geçmiş.`
                                : "Küçük bir adımla başlayabilirsin."}
                            </p>
                          </div>
                        </div>
                      </section>
                      <section className="progress-panel">
                        <div className="section-heading">
                          <h2>Genel ilerleme</h2>
                          <span className="soft-icon">
                            <Target size={18} />
                          </span>
                        </div>
                        <div
                          className="progress-ring"
                          style={{
                            background: `conic-gradient(var(--forest) ${percent}%, #eaf0e8 0)`,
                          }}
                          role="img"
                          aria-label={`Görevlerin yüzde ${percent} kadarı tamamlandı`}
                        >
                          <div>
                            <strong>%{percent}</strong>
                            <span>tamamlandı</span>
                          </div>
                        </div>
                        <div className="progress-legend">
                          <span>
                            <i />
                            {done} tamamlanan
                          </span>
                          <span>
                            <i />
                            {workspace.tasks.length - done} bekleyen
                          </span>
                        </div>
                        <p>Her tamamlanan görev, yolunun bir parçası.</p>
                      </section>
                      <div className="local-note">
                        <span className="local-symbol">
                          <CheckCheck size={18} />
                        </span>
                        <p>
                          Çalışmaların bu tarayıcıda saklanır. Yedek alarak
                          yanında taşıyabilirsin.
                        </p>
                      </div>
                    </aside>
                  </div>
                </>
              ) : (
                <>
                  <div className="filterbar">
                    <div className="search-field">
                      <Search size={18} />
                      <label className="sr-only" htmlFor="search">
                        {selectedNav.label} içinde ara
                      </label>
                      <input
                        id="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                          view === "tasks"
                            ? "Görev veya proje ara..."
                            : view === "notes"
                              ? "Notlarında ara..."
                              : "Projelerinde ara..."
                        }
                      />
                      {query && (
                        <button
                          className="icon-button"
                          aria-label="Aramayı temizle"
                          onClick={() => setQuery("")}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    {view !== "projects" && (
                      <>
                        <label className="sr-only" htmlFor="project-filter">
                          Projeye göre filtrele
                        </label>
                        <select
                          id="project-filter"
                          value={filterProject}
                          onChange={(e) => setFilterProject(e.target.value)}
                        >
                          <option value="all">Tüm projeler</option>
                          {workspace.projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    {view === "tasks" && (
                      <>
                        <label className="sr-only" htmlFor="priority-filter">
                          Önceliğe göre filtrele
                        </label>
                        <select
                          id="priority-filter"
                          value={filterPriority}
                          onChange={(e) => setFilterPriority(e.target.value)}
                        >
                          <option value="all">Tüm öncelikler</option>
                          {PRIORITIES.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    {filterDay && (
                      <button
                        className="date-filter"
                        onClick={() => setFilterDay("")}
                      >
                        {formatDay(filterDay)}
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {view === "projects" &&
                    (filteredProjects.length ? (
                      <div className="project-grid">
                        {filteredProjects.map((p) => (
                          <div key={p.id}>
                            {card(p)}
                            <button
                              className="delete-project text-link"
                              onClick={() =>
                                setModal({
                                  kind: "delete",
                                  entity: "project",
                                  id: p.id,
                                  title: p.title,
                                })
                              }
                            >
                              <Trash2 size={13} />
                              Projeyi sil
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        title={
                          query ? "Eşleşen proje yok" : "İlk projenle başla"
                        }
                        description={
                          query
                            ? "Başka bir kelimeyle aramayı deneyebilirsin."
                            : "Yeni bir proje oluştur ve ilk görevini ekle."
                        }
                        action={query ? undefined : "Yeni proje"}
                        onAction={() => setModal({ kind: "project" })}
                      />
                    ))}
                  {view === "tasks" &&
                    (workspace.projects.length ? (
                      <div className="kanban">
                        {STATUSES.map((status) => (
                          <section
                            className={`kanban-column ${status.value}`}
                            key={status.value}
                          >
                            <div className="kanban-heading">
                              <h2>
                                <i />
                                {status.label}
                              </h2>
                              <span>
                                {
                                  filteredTasks.filter(
                                    (t) => t.status === status.value,
                                  ).length
                                }
                              </span>
                            </div>
                            <div className="kanban-cards">
                              {filteredTasks
                                .filter((t) => t.status === status.value)
                                .map((t) => {
                                  const p = workspace.projects.find(
                                    (p) => p.id === t.projectId,
                                  )!;
                                  return (
                                    <article className="kanban-card" key={t.id}>
                                      <div className="kanban-card-top">
                                        <span
                                          className={`project-pill ${p.tone}`}
                                        >
                                          {p.title}
                                        </span>
                                        <button
                                          className="icon-button"
                                          aria-label={`${t.title} görevini sil`}
                                          onClick={() =>
                                            setModal({
                                              kind: "delete",
                                              entity: "task",
                                              id: t.id,
                                              title: t.title,
                                            })
                                          }
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                      <h3>
                                        <button
                                          className="plain-button"
                                          onClick={() =>
                                            setModal({ kind: "task", value: t })
                                          }
                                        >
                                          {t.title}
                                        </button>
                                      </h3>
                                      {t.description && <p>{t.description}</p>}
                                      <div className="kanban-card-meta">
                                        <span
                                          className={`priority ${t.priority}`}
                                        >
                                          {
                                            PRIORITIES.find(
                                              (p) => p.value === t.priority,
                                            )?.label
                                          }
                                        </span>
                                        <span
                                          className={`due ${isOverdue(t, today) ? "overdue" : ""}`}
                                        >
                                          <Clock3 size={12} />
                                          {t.due === today
                                            ? "Bugün"
                                            : formatDay(t.due)}
                                        </span>
                                      </div>
                                      <label
                                        className="sr-only"
                                        htmlFor={`status-${t.id}`}
                                      >
                                        {t.title} durumu
                                      </label>
                                      <select
                                        id={`status-${t.id}`}
                                        value={t.status}
                                        onChange={(e) =>
                                          setStatus(
                                            t.id,
                                            e.target.value as Status,
                                          )
                                        }
                                      >
                                        {STATUSES.map((s) => (
                                          <option key={s.value} value={s.value}>
                                            {s.label}
                                          </option>
                                        ))}
                                      </select>
                                    </article>
                                  );
                                })}
                              {!filteredTasks.some(
                                (t) => t.status === status.value,
                              ) && (
                                <div className="column-empty">
                                  {query ||
                                  filterDay ||
                                  filterPriority !== "all" ||
                                  filterProject !== "all"
                                    ? "Bu filtrelerde görev yok."
                                    : "Bu sütun yeni adımlar için hazır."}
                                </div>
                              )}
                            </div>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        title="Önce bir proje oluşturalım"
                        description="Görevlerin bir projeye ait olur. İlk projeni ekleyerek başla."
                        action="Proje oluştur"
                        onAction={() => setModal({ kind: "project" })}
                      />
                    ))}
                  {view === "notes" &&
                    (filteredNotes.length ? (
                      <div className="notes-grid">
                        {filteredNotes.map((n) => (
                          <article className="note-card" key={n.id}>
                            <div className="note-card-top">
                              <span>
                                <NotebookPen size={16} />
                                {workspace.projects.find(
                                  (p) => p.id === n.projectId,
                                )?.title || "Genel not"}
                              </span>
                              <button
                                className="icon-button"
                                aria-label={`${n.title} notunu sil`}
                                onClick={() =>
                                  setModal({
                                    kind: "delete",
                                    entity: "note",
                                    id: n.id,
                                    title: n.title,
                                  })
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <h2>
                              <button
                                className="plain-button"
                                onClick={() =>
                                  setModal({ kind: "note", value: n })
                                }
                              >
                                {n.title}
                              </button>
                            </h2>
                            <p>{n.body}</p>
                            <div className="note-footer">
                              <span>
                                {new Intl.DateTimeFormat("tr-TR", {
                                  day: "numeric",
                                  month: "long",
                                }).format(new Date(n.updatedAt))}
                              </span>
                              <button
                                className="text-link"
                                onClick={() =>
                                  setModal({ kind: "note", value: n })
                                }
                              >
                                Düzenle <ArrowRight size={14} />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        title={
                          query ? "Aradığın not bulunamadı" : "İlk notunu ekle"
                        }
                        description="Öğrendiğin bir şey, yeni bir fikir veya küçük bir hatırlatma."
                        action={!query ? "Yeni not" : undefined}
                        onAction={() => setModal({ kind: "note" })}
                      />
                    ))}
                </>
              )}
              <footer className="app-footer">
                <span>
                  <Compass size={14} /> Staj Rotası{" "}
                  <span className="footer-divider">/</span> Öğrenirken ilerle.
                </span>
                {workspace.demo ? (
                  <span className="demo-label">
                    Örnek verilerle oluşturulmuş çalışma alanı
                  </span>
                ) : (
                  <span>Yalnızca bu cihazda, senin kontrolünde.</span>
                )}
              </footer>
            </>
          )}
        </main>
      </div>
      {modal?.kind === "project" && (
        <ModalFrame
          title={modal.value ? "Projeyi düzenle" : "Yeni bir proje"}
          onClose={() => setModal(null)}
        >
          <ProjectForm
            value={modal.value}
            onSave={saveProject}
            onClose={() => setModal(null)}
          />
        </ModalFrame>
      )}
      {modal?.kind === "task" && (
        <ModalFrame
          title={modal.value ? "Görevi düzenle" : "Yeni bir görev"}
          onClose={() => setModal(null)}
        >
          <TaskForm
            value={modal.value}
            projectId={modal.projectId}
            projects={workspace.projects}
            onSave={saveTask}
            onClose={() => setModal(null)}
          />
        </ModalFrame>
      )}
      {modal?.kind === "note" && (
        <ModalFrame
          title={modal.value ? "Notu düzenle" : "Yeni bir not"}
          onClose={() => setModal(null)}
        >
          <NoteForm
            value={modal.value}
            projects={workspace.projects}
            onSave={saveNote}
            onClose={() => setModal(null)}
          />
        </ModalFrame>
      )}
      {modal?.kind === "delete" && (
        <ModalFrame
          title="Bu kaydı silmek istiyor musun?"
          onClose={() => setModal(null)}
        >
          <p className="dialog-description">
            <strong>{modal.title}</strong> kalıcı olarak silinecek.
            {modal.entity === "project" &&
              ` Bu projeye bağlı ${workspace.tasks.filter((t) => t.projectId === modal.id).length} görev ve ${workspace.notes.filter((n) => n.projectId === modal.id).length} not da silinecek.`}
          </p>
          <div className="form-actions">
            <button className="button secondary" onClick={() => setModal(null)}>
              Vazgeç
            </button>
            <button className="button danger" onClick={deleteItem}>
              <Trash2 size={16} />
              Sil
            </button>
          </div>
        </ModalFrame>
      )}
      {modal?.kind === "data" && (
        <ModalFrame title="Veri yönetimi" onClose={() => setModal(null)}>
          <p className="dialog-description">
            Projelerin, görevlerin ve notların bu tarayıcıda saklanır. Başka bir
            cihazda devam etmek için JSON yedeğini indirip orada
            yükleyebilirsin.
          </p>
          <div className="data-actions">
            <button className="button secondary" onClick={downloadBackup}>
              <ArrowDownToLine size={17} />
              Yedeği indir
            </button>
            <button
              className="button secondary"
              onClick={() => fileRef.current?.click()}
            >
              <ArrowUpFromLine size={17} />
              Yedek yükle
            </button>
          </div>
          {importName && (
            <div className="import-confirm">
              <strong>{importName}</strong>
              <p>
                Bu yedek, mevcut çalışma alanının tamamının yerine geçecek. Önce
                mevcut verilerinin yedeğini almanı öneririz.
              </p>
              <button
                className="button primary"
                onClick={() =>
                  pendingImport.current && replaceData(pendingImport.current)
                }
              >
                Yedeği uygula
              </button>
            </div>
          )}
          <div className="reset-area">
            <h3>Yeni bir başlangıç</h3>
            <p>Aşağıdaki işlemler mevcut verilerin tamamını değiştirir.</p>
            <button
              className="button secondary"
              onClick={() => {
                if (
                  window.confirm(
                    "Tüm proje, görev ve notları silip boş bir çalışma alanı açmak istiyor musun?",
                  )
                )
                  replaceData(emptyWorkspace());
              }}
            >
              Boş çalışma alanı aç
            </button>
            <button
              className="text-link"
              onClick={() => {
                if (
                  window.confirm(
                    "Mevcut veriler silinip örnek veriler yüklenecek. Devam edilsin mi?",
                  )
                )
                  replaceData(makeDemo());
              }}
            >
              Örnek verileri yeniden yükle
            </button>
          </div>
          <button
            className="text-link about-from-data"
            onClick={() => setModal({ kind: "about" })}
          >
            Uygulama hakkında
          </button>
        </ModalFrame>
      )}
      {modal?.kind === "about" && (
        <ModalFrame title="Staj Rotası hakkında" onClose={() => setModal(null)}>
          <div className="about-content">
            <span className="about-mark">
              <Compass size={36} />
            </span>
            <h3>Öğrendiklerin biriksin, projelerin ilerlesin.</h3>
            <p>
              Staj Rotası; projelerini, görevlerini ve öğrenme notlarını tek
              yerde tutman için hazırlanmış bir kişisel takip uygulamasıdır.
            </p>
            <p>
              Giriş hesabı gerekmez. Veriler LocalStorage ile bu tarayıcıda
              tutulur ve başka cihazlarla otomatik eşitlenmez. Tarayıcı
              verilerini temizlemeden önce yedek alabilirsin.
            </p>
            <div className="about-credit">
              <strong>Mert Ali Korkmaz</strong>
              <span>Software Persona · Web geliştirme eğitim projesi</span>
              <span>
                React, TypeScript, Vinext/Vite ve saf CSS ile geliştirildi.
              </span>
              <span>
                Planlama, geliştirme, test ve dokümantasyonda OpenAI Codex
                desteği kullanıldı.
              </span>
            </div>
          </div>
        </ModalFrame>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="JSON yedek dosyası"
        onChange={(e) => importBackup(e.target.files?.[0])}
      />
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={19} />
          {toast}
          <button
            className="icon-button"
            aria-label="Bildirimi kapat"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
