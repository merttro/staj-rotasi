"use client";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  FileText,
  FolderKanban,
  FolderPlus,
  MoreHorizontal,
  NotebookPen,
  Plus,
} from "lucide-react";
import {
  isOverdue,
  PRIORITIES,
  progress,
  projectTasks,
  todayKey,
  type Project,
  type Task,
  type Workspace,
} from "@/lib/planner";
export const formatDay = (day: string) =>
  day
    ? new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "short",
      }).format(new Date(day + "T12:00:00"))
    : "Tarih yok";
export function Empty({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <FolderPlus size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button className="button primary" onClick={onAction}>
          <Plus size={16} />
          {action}
        </button>
      )}
    </div>
  );
}
export function ProjectCard({
  project,
  workspace,
  onEdit,
  onOpen,
  onTask,
}: {
  project: Project;
  workspace: Workspace;
  onEdit: () => void;
  onOpen: () => void;
  onTask: () => void;
}) {
  const tasks = projectTasks(workspace, project.id);
  const completed = tasks.filter((t) => t.status === "done").length;
  const Icon =
    project.tone === "orange"
      ? BookOpen
      : project.tone === "purple"
        ? NotebookPen
        : project.tone === "blue"
          ? FileText
          : FolderKanban;
  return (
    <article className={`project-card ${project.tone}`}>
      <div className="project-card-top">
        <span className="project-symbol">
          <Icon size={23} />
        </span>
        <button
          className="icon-button"
          aria-label={`${project.title} projesini düzenle`}
          onClick={onEdit}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
      <span className="category">{project.category}</span>
      <h3>
        <button className="plain-button" onClick={onOpen}>
          {project.title}
        </button>
      </h3>
      <p>
        {project.description ||
          "Bu proje için küçük görevler oluştur ve ilerlemeni takip et."}
      </p>
      <div className="progress-label">
        <span>
          {completed}/{tasks.length} görev tamamlandı
        </span>
        <strong>%{progress(tasks)}</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={`${project.title} ilerlemesi`}
        aria-valuenow={progress(tasks)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${progress(tasks)}%` }} />
      </div>
      <div className="project-footer">
        <span>
          <span className="tiny-dot" />
          {tasks.some((t) => t.status === "doing")
            ? "Devam ediyor"
            : tasks.length && completed === tasks.length
              ? "Tamamlandı"
              : "Planlanıyor"}
        </span>
        <button className="small-link" onClick={onTask}>
          Görev ekle <Plus size={14} />
        </button>
      </div>
    </article>
  );
}
export function TaskRow({
  task,
  workspace,
  onEdit,
  onToggle,
}: {
  task: Task;
  workspace: Workspace;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const project = workspace.projects.find((p) => p.id === task.projectId)!;
  const today = todayKey();
  return (
    <div className={`task-row ${task.status === "done" ? "completed" : ""}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.status === "done"}
        aria-label={`${task.title} görevini ${task.status === "done" ? "yeniden aç" : "tamamla"}`}
        onChange={onToggle}
      />
      <button className="task-row-content plain-button" onClick={onEdit}>
        <strong>{task.title}</strong>
        <span>
          <i className={`project-dot ${project.tone}`} />
          {project.title}
        </span>
      </button>
      <span className={`priority ${task.priority}`}>
        {PRIORITIES.find((p) => p.value === task.priority)?.label}
      </span>
      <span className={`due ${isOverdue(task, today) ? "overdue" : ""}`}>
        <Clock3 size={13} />
        {task.due === today ? "Bugün" : formatDay(task.due)}
      </span>
    </div>
  );
}
