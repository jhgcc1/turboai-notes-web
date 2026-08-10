"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { reportUnexpected } from "@/lib/reportUnexpected";
import { AuthDecorations } from "@/components/AuthDecorations";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.csrf();
      if (mode === "signup") {
        await api.register(email, password);
      } else {
        await api.login(email, password);
      }
      window.location.href = "/";
    } catch (err) {
      reportUnexpected(err, "AuthForm.submit");
      if (err instanceof ApiError) {
        setError("Something went wrong. Check your email and password.");
      } else {
        setError("Network error.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <AuthDecorations />
      <form onSubmit={onSubmit} className="z-10 flex w-full max-w-md flex-col gap-4 text-center">
        <h1 className="font-display text-4xl font-bold text-[var(--ink)]">
          {mode === "signup" ? "Yay, New Friend!" : "Yay, You're Back!"}
        </h1>
        <input
          className="rounded-lg border border-[var(--ink)] bg-transparent px-4 py-3 text-left outline-none"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <div className="relative">
          <input
            className="w-full rounded-lg border border-[var(--ink)] bg-transparent px-4 py-3 text-left outline-none"
            type={show ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]"
            onClick={() => setShow((s) => !s)}
            aria-label="Toggle password visibility"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--btn)] px-6 py-3 font-semibold text-[var(--ink)] disabled:opacity-60"
        >
          {mode === "signup" ? "Sign Up" : "Login"}
        </button>
        {mode === "signup" ? (
          <Link href="/login" className="underline">
            We&apos;re already friends!
          </Link>
        ) : (
          <Link href="/signup" className="underline">
            Oops! I&apos;ve never been here before
          </Link>
        )}
      </form>
    </main>
  );
}
