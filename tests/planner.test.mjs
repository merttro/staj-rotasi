import test from "node:test";
import assert from "node:assert/strict";
import {
  makeDemo,
  emptyWorkspace,
  validateWorkspace,
  removeProject,
  progress,
  isOverdue,
  plusDays,
  validDate,
  matches,
  sortTasks,
} from "../lib/planner.ts";

test("demo ve boş alan JSON dönüşümünden geçer", () => {
  const demo = makeDemo("2026-11-09");
  assert.deepEqual(validateWorkspace(JSON.parse(JSON.stringify(demo))), demo);
  assert.equal(demo.projects.length, 3);
  assert.equal(demo.tasks.length, 12);
  assert.equal(progress(demo.tasks), 33);
  assert.deepEqual(validateWorkspace(emptyWorkspace()), emptyWorkspace());
  assert.equal(progress([]), 0);
});
test("proje silme yalnız ilgili görev ve notları kaldırır", () => {
  const demo = makeDemo("2026-11-09");
  const result = removeProject(demo, "p-portfolio");
  assert.equal(result.projects.length, 2);
  assert.equal(result.tasks.length, 7);
  assert.equal(result.notes.length, 1);
  assert.ok(result.tasks.every((t) => t.projectId !== "p-portfolio"));
  assert.equal(demo.projects.length, 3);
  validateWorkspace(result);
});
test("bozuk ilişkiler, yinelenen kimlikler ve geçersiz alanlar reddedilir", () => {
  const demo = makeDemo("2026-11-09");
  for (const mutate of [
    (w) => (w.tasks[0].projectId = "missing"),
    (w) => (w.tasks[0].status = "unknown"),
    (w) => (w.tasks[0].due = "2026-02-30"),
    (w) => (w.projects[0].title = "   "),
    (w) => (w.tasks[0].id = w.projects[0].id),
    (w) => (w.notes[0].updatedAt = "bad"),
    (w) => (w.version = 2),
  ]) {
    const clone = structuredClone(demo);
    mutate(clone);
    assert.throws(() => validateWorkspace(clone));
  }
  assert.throws(() => validateWorkspace(null));
  assert.throws(() => validateWorkspace({}));
});
test("alan uzunluğu ve toplam kayıt sınırı uygulanır", () => {
  const demo = makeDemo("2026-11-09");
  demo.notes[0].body = "x".repeat(3001);
  assert.throws(() => validateWorkspace(demo));
  const crowded = makeDemo("2026-11-09");
  crowded.projects = Array.from({ length: 101 }, (_, i) => ({
    ...crowded.projects[0],
    id: "p-" + i,
  }));
  assert.throws(() => validateWorkspace(crowded));
});
test("tarih ve gecikme hesabı ay sonunu ve tamamlanan görevi doğru ele alır", () => {
  assert.equal(plusDays("2026-01-31", 1), "2026-02-01");
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2024-02-29"), true);
  assert.equal(validDate("2026-02-29"), false);
  const task = makeDemo("2026-11-09").tasks[0];
  assert.equal(isOverdue(task, "2026-11-09"), false);
  assert.equal(isOverdue({ ...task, status: "todo" }, "2026-11-09"), true);
  assert.equal(
    isOverdue({ ...task, status: "todo", due: "2026-11-09" }, "2026-11-09"),
    false,
  );
});
test("Türkçe arama ve tarih-öncelik sıralaması", () => {
  assert.ok(matches("İLK GRAFİKLER", "ilk"));
  assert.ok(matches("Çalışma Notları", "notları"));
  const tasks = makeDemo("2026-11-09").tasks;
  const sorted = sortTasks(tasks);
  assert.ok(sorted[0].due <= sorted[1].due);
  assert.equal(tasks[0].id, "t-1");
});
