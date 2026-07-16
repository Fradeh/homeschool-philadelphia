"use client";

import { getDefaultPortalPath, type LoginResponse } from "@homeschool/shared";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { saveSession } from "@/lib/session";

export function LoginCard() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const session = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      saveSession(session);
      router.push(getDefaultPortalPath(session.user.roles));
    } catch {
      setError("No pudimos iniciar sesión. Revisa el correo y la contraseña.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="relative w-full max-w-[460px] rounded-2xl border border-[#191970]/10 bg-white px-8 py-8 shadow-[0_24px_70px_rgba(25,25,112,0.12)] sm:px-10">
      <div className="flex flex-col items-center text-center">
        <div className="h-24 w-24 overflow-hidden sm:h-28 sm:w-28" aria-label="Philadelphia International School">
          <img
            src="/logo-philadelphia.png"
            alt=""
            className="h-full w-[330%] max-w-none object-cover object-left"
          />
        </div>
        <h1 className="mt-6 text-[1.7rem] font-bold leading-tight tracking-tight [font-family:Merta,Arial,sans-serif]">
          Portal Escolar
        </h1>
        <p className="mt-2 text-sm text-[#191970]/55 [font-family:Merta,Arial,sans-serif]">
          Philadelphia International School
        </p>
      </div>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">Correo institucional</span>
          <div className="flex items-center gap-3 rounded-lg border border-[#191970]/12 bg-[#F4F7FC] px-4 py-3.5 transition focus-within:border-[#191970]/55 focus-within:bg-white">
            <span className="text-[#191970]/48" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21a8 8 0 0 0-16 0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <input
              type="email"
              name="email"
              placeholder="correo@philadelphia.edu"
              autoComplete="email"
              required
              disabled={isLoading}
              className="w-full bg-transparent text-[15px] font-medium text-[#191970] outline-none placeholder:text-[#191970]/38 disabled:cursor-not-allowed [font-family:Merta,Arial,sans-serif]"
            />
          </div>
        </label>

        <label className="block">
          <span className="sr-only">Contraseña</span>
          <div className="flex items-center gap-3 rounded-lg border border-[#191970]/12 bg-[#F4F7FC] px-4 py-3.5 transition focus-within:border-[#191970]/55 focus-within:bg-white">
            <span className="text-[#191970]/48" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 11V8a5 5 0 0 1 10 0v3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M6.5 11h11A1.5 1.5 0 0 1 19 12.5v6A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="contraseña"
              autoComplete="current-password"
              required
              minLength={8}
              disabled={isLoading}
              className="password-input w-full bg-transparent text-[15px] font-medium text-[#191970] outline-none placeholder:text-[#191970]/38 disabled:cursor-not-allowed [font-family:Merta,Arial,sans-serif]"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
              disabled={isLoading}
              className="text-[#191970]/45 transition hover:text-[#191970] disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m3 3 18 18"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.7 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16.7 16.7 0 0 1-3.1 3.7M7.8 7.8C4.5 9.4 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.7-.3 3.8-.8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>
              )}
            </button>
          </div>
        </label>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 [font-family:Merta,Arial,sans-serif]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="block w-full rounded-lg bg-[#191970] px-4 py-3.5 text-center text-[15px] font-bold text-white shadow-sm transition hover:bg-[#12125c] disabled:cursor-not-allowed disabled:bg-[#191970]/55 [font-family:Merta,Arial,sans-serif]"
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>

      <div className="mt-6 border-t border-[#191970]/10 pt-5 text-center">
        <a
          href="mailto:soporte@philadelphia.edu"
          className="text-xs font-medium text-[#191970]/50 transition hover:text-[#191970] [font-family:Merta,Arial,sans-serif]"
        >
          ¿Necesitas ayuda para acceder?
        </a>
        <p className="mt-4 text-xs text-[#191970]/40 [font-family:Merta,Arial,sans-serif]">
          Uso exclusivo de la comunidad educativa
        </p>
      </div>
    </section>
  );
}
