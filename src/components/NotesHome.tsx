"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyNotesState } from "@/components/EmptyNotesState";
import { api, Category, formatNoteDate, Note } from "@/lib/api";

export function NotesHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.me();
        const [cats, ns] = await Promise.all([api.categories(), api.notes(filter ?? undefined)]);
        if (!cancelled) {
          setCategories(cats);
          setNotes(ns);
        }
      } catch {
        if (!cancelled) window.location.href = "/login";
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const title = useMemo(() => "All Categories", []);

  async function onNewNote() {
    const cat = filter ? categories.find((c) => c.id === filter) : categories[0];
    if (!cat) return;
    const note = await api.createNote({ title: "Note Title", body: "", category: cat.id });
    window.location.href = `/notes/edit/?id=${note.id}`;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-8 px-6 py-8">
      <aside className="w-48 shrink-0">
        <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
        <ul className="space-y-3">
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setFilter((f) => (f === c.id ? null : c.id))}
                className={`flex w-full items-center gap-2 text-left ${
                  filter === c.id ? "font-bold" : ""
                }`}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: c.color }}
                />
                <span className="flex-1">{c.name}</span>
                <span className="text-[var(--muted)]">{c.note_count}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex-1">
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={onNewNote}
            className="rounded-full border border-[var(--ink)] px-4 py-2 font-display"
          >
            + New Note
          </button>
        </div>
        {notes.length === 0 ? (
          <EmptyNotesState />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((n) => (
              <Link
                key={n.id}
                href={`/notes/edit/?id=${n.id}`}
                className="block min-h-40 rounded-2xl p-4 shadow-sm transition hover:scale-[1.01]"
                style={{ background: n.category_color }}
              >
                <div className="mb-2 flex justify-between text-xs font-semibold">
                  <span>{formatNoteDate(n.updated_at)}</span>
                  <span>{n.category_name}</span>
                </div>
                <h3 className="font-display text-xl font-bold">{n.title || "Note Title"}</h3>
                <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm opacity-90">
                  {n.body || "Note content..."}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
