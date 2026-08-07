"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { NoteEditor } from "@/components/NoteEditor";

function EditorInner() {
  const params = useSearchParams();
  const id = Number(params.get("id"));
  if (!id) {
    return <main className="p-8">Missing note id.</main>;
  }
  return <NoteEditor noteId={id} />;
}

export default function NoteEditPage() {
  return (
    <Suspense fallback={<main className="p-8">Loading…</main>}>
      <EditorInner />
    </Suspense>
  );
}
