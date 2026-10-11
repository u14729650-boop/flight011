"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { adminApi, AdminApiError } from "@/lib/admin-client";
import { Logo } from "@/components/ui/Logo";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return setError("Enter your username and password.");
    setBusy(true);
    setError(null);
    try {
      await adminApi.login(username, password);
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
        <form onSubmit={submit} className="glass-light mt-12 rounded-[2rem] !bg-ivory/[0.95] p-8" aria-labelledby="login-title">
          <div className="flex items-center gap-2 text-gold-deep">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <p className="eyebrow text-[0.6rem]">Private</p>
          </div>
          <h1 id="login-title" className="display mt-3 text-4xl">Studio sign in</h1>
          <p className="mt-2 text-sm text-stone">For the Homies Choice team only.</p>
          {adminApi.isPreview && (
            <p className="mt-4 rounded-xl bg-gold/10 px-3 py-2 text-xs text-stone">Preview demo — changes are saved in this browser only.</p>
          )}
          <label htmlFor="admin-username" className="eyebrow mt-8 block text-[0.6rem] text-stone">Username</label>
          <input
            id="admin-username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-invalid={!!error}
            className="field"
          />
          <label htmlFor="admin-password" className="eyebrow mt-5 block text-[0.6rem] text-stone">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
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
