"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/server/auth/actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--text-muted)]">Usuario de Felicity</span>
        <input
          name="userName"
          type="text"
          autoComplete="username"
          autoFocus
          required
          className="rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-[var(--text)] ring-1 ring-[var(--border)] outline-none transition focus:ring-2 focus:ring-amber-400/50"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--text-muted)]">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-[var(--text)] ring-1 ring-[var(--border)] outline-none transition focus:ring-2 focus:ring-amber-400/50"
        />
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-amber-400 px-4 py-2.5 font-semibold text-neutral-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Conectando con Felicity…" : "Entrar"}
      </button>
    </form>
  );
}
