"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/server/auth/actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="label">Usuario de Felicity</span>
        <input name="userName" type="text" autoComplete="username" autoFocus required className="field !py-2.5" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label">Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required className="field !py-2.5" />
      </label>

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--c-danger)] ring-1 ring-red-500/30">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-1 !min-h-11 !text-sm">
        {pending ? "Conectando con Felicity…" : "Entrar"}
      </button>
    </form>
  );
}
