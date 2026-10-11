"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { adminApi, AdminApiError } from "@/lib/admin-client";
import { Logo } from "@/components/ui/Logo";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return setError("Enter the admin password.");
    setBusy(true);
    setError(null);
    try {
      await adminApi.login(password);
      router.replace("/hc-admin");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Couldn't sign in. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="on-dark tone-emerald grain relative flex min-h-screen items-center justify-center px-5 py-16">
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <form onSubmit={submit} className="mt-12 bg-ivory p-8 shadow-2xl" aria-labelledby="login-title">
          <div className="flex items-center gap-2 text-gold-deep">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <p className="eyebrow text-[0.6rem]">Private</p>
          </div>
          <h1 id="login-title" className="display mt-3 text-4xl">Studio sign in</h1>
          <p className="mt-2 text-sm text-stone">For the Homies Choice team only.</p>
          {adminApi.isPreview && (
            <p className="mt-4 border-l-2 border-gold pl-3 text-xs text-stone">Preview demo — use the password <strong>preview</strong>. Changes are saved in this browser only.</p>
          )}
          <label htmlFor="admin-password" className="eyebrow mt-8 block text-[0.6rem] text-stone">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "admin-password-error" : undefined}
            className="field"
          />
          {error && (
            <p id="admin-password-error" role="alert" className="mt-2 text-xs text-[#9b2c2c]">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn btn-dark mt-8 w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
