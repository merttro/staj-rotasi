"use client";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Check, X } from "lucide-react";
import {
  PRIORITIES,
  STATUSES,
  todayKey,
  TONES,
  type Note,
  type Priority,
  type Project,
  type Status,
  type Task,
  type Tone,
} from "@/lib/planner";

export function ModalFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Pencereyi kapat"
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function ProjectForm({
  value,
  onSave,
  onClose,
}: {
  value?: Project;
  onSave: (p: Project) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(value?.title || "");
  const [description, setDescription] = useState(value?.description || "");
  const [category, setCategory] = useState(value?.category || "Web geliştirme");
  const [tone, setTone] = useState<Tone>(value?.tone || "green");
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !category.trim()) {
      setError("Proje adı ve alanı boş olamaz.");
      return;
    }
    onSave({
      id: value?.id || crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      tone,
    });
  }
  return (
    <form onSubmit={submit} className="edit-form">
      <label>
        Proje adı
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. Kişisel portfolyo"
          required
          maxLength={80}
        />
      </label>
      <label>
        Kısa açıklama
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Bu projede ne yapmak istiyorsun?"
          rows={3}
          maxLength={400}
        />
      </label>
      <label>
        Çalışma alanı
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          list="categories"
          required
          maxLength={40}
        />
        <datalist id="categories">
          <option>Web geliştirme</option>
          <option>Veri analizi</option>
          <option>Tasarım</option>
          <option>Kişisel gelişim</option>
        </datalist>
      </label>
      <fieldset>
        <legend>Proje rengi</legend>
        <div className="tone-picker">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              className={`tone-button ${t} ${tone === t ? "selected" : ""}`}
              aria-label={
                {
                  green: "Yeşil",
                  orange: "Turuncu",
                  purple: "Mor",
                  blue: "Mavi",
                }[t]
              }
              aria-pressed={tone === t}
              onClick={() => setTone(t)}
            >
              {tone === t && <Check size={18} />}
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Vazgeç
        </button>
        <button className="button primary" type="submit">
          {value ? "Değişiklikleri kaydet" : "Projeyi oluştur"}
        </button>
      </div>
    </form>
  );
}

export function TaskForm({
  value,
  projectId,
  projects,
  onSave,
  onClose,
}: {
  value?: Task;
  projectId?: string;
  projects: Project[];
  onSave: (t: Task) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(value?.title || "");
  const [description, setDescription] = useState(value?.description || "");
  const [project, setProject] = useState(
    value?.projectId || projectId || projects[0]?.id || "",
  );
  const [status, setStatus] = useState<Status>(value?.status || "todo");
  const [priority, setPriority] = useState<Priority>(
    value?.priority || "medium",
  );
  const [due, setDue] = useState(value?.due || todayKey());
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !projects.some((p) => p.id === project)) {
      setError("Görev adını ve projesini kontrol et.");
      return;
    }
    onSave({
      id: value?.id || crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      projectId: project,
      status,
      priority,
      due,
    });
  }
  return (
    <form onSubmit={submit} className="edit-form">
      <label>
        Görev adı
        <input
          autoFocus
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sıradaki küçük adımın ne?"
        />
      </label>
      <label>
        Proje
        <select
          value={project}
          onChange={(e) => setProject(e.target.value)}
          required
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Açıklama
        <textarea
          rows={3}
          maxLength={600}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Hatırlamak istediğin detaylar..."
        />
      </label>
      <div className="form-grid">
        <label>
          Durum
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Öncelik
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Hedef tarih
        <input
          type="date"
          min="1900-01-01"
          max="9999-12-31"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Vazgeç
        </button>
        <button className="button primary" type="submit">
          {value ? "Değişiklikleri kaydet" : "Görevi ekle"}
        </button>
      </div>
    </form>
  );
}

export function NoteForm({
  value,
  projects,
  onSave,
  onClose,
}: {
  value?: Note;
  projects: Project[];
  onSave: (n: Note) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(value?.title || "");
  const [body, setBody] = useState(value?.body || "");
  const [projectId, setProject] = useState(value?.projectId || "");
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Notun başlığı ve içeriği boş olamaz.");
      return;
    }
    onSave({
      id: value?.id || crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      projectId,
      updatedAt: new Date().toISOString(),
    });
  }
  return (
    <form className="edit-form" onSubmit={submit}>
      <label>
        Not başlığı
        <input
          autoFocus
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bugün ne öğrendin?"
        />
      </label>
      <label>
        İlgili proje
        <select value={projectId} onChange={(e) => setProject(e.target.value)}>
          <option value="">Genel not</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Notun
        <textarea
          required
          rows={8}
          maxLength={3000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Fikirlerini, öğrendiklerini ve hatırlatmalarını buraya yaz."
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button secondary" type="button" onClick={onClose}>
          Vazgeç
        </button>
        <button className="button primary" type="submit">
          Notu kaydet
        </button>
      </div>
    </form>
  );
}
