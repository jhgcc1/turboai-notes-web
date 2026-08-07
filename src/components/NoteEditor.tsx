"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, Category, formatLastEdited, Note } from "@/lib/api";

export function NoteEditor({ noteId }: { noteId: number }) {
  const [note, setNote] = useState<Note | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [n, cats] = await Promise.all([api.getNote(noteId), api.categories()]);
        if (cancelled) return;
        setNote(n);
        setCategories(cats);
        setTitle(n.title);
        setBody(n.body);
        setCategory(n.category);
      } catch {
        window.location.href = "/login";
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  async function save(next?: Partial<{ title: string; body: string; category: number }>) {
    if (!note || category == null) return;
    setSaving(true);
    try {
      const updated = await api.updateNote(note.id, {
        title,
        body,
        category,
        ...next,
      });
      setNote(updated);
    } finally {
      setSaving(false);
    }
  }

  async function onCategoryChange(id: number) {
    setCategory(id);
    await save({ category: id });
  }

  async function onBlurSave() {
    await save();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void save();
  }

  if (!note || category == null) {
    return <main className="p-8">Loading…</main>;
  }

  const color = categories.find((c) => c.id === category)?.color ?? note.category_color;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 rounded-full border border-[var(--ink)] px-3 py-1">
          <span className="h-3 w-3 rounded-full" style={{ background: color }} />
          <select
            className="bg-transparent outline-none"
            value={category}
            onChange={(e) => void onCategoryChange(Number(e.target.value))}
            aria-label="Category"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Link href="/" className="text-2xl leading-none" aria-label="Close">
          ×
        </Link>
      </div>
      <form onSubmit={onSubmit} className="rounded-3xl p-8" style={{ background: color }}>
        <p className="mb-4 text-right text-sm text-[var(--ink)]">
          Last Edited: {formatLastEdited(note.updated_at)}
          {saving ? " (saving…)" : ""}
        </p>
        <input
          className="mb-4 w-full bg-transparent font-display text-3xl font-bold outline-none placeholder:opacity-50"
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => void onBlurSave()}
        />
        <textarea
          className="min-h-80 w-full resize-y bg-transparent text-lg outline-none placeholder:opacity-50"
          placeholder="Pour your heart out…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => void onBlurSave()}
        />
      </form>
    </main>
  );
}
