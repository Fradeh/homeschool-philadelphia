import { LoginCard } from "@/components/auth/login-card";

export default function PortalPage() {
  return (
    <main className="fixed inset-0 h-svh w-screen overflow-hidden bg-[#ECEFF1] text-[#191970]">
      <header className="absolute inset-x-0 top-0 z-20 bg-[#191970] text-white">
        <div className="flex h-16 items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/10">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 10.5 12 6l8 4.5-8 4.5-8-4.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 13v3.2c0 1.3 2.2 2.8 5 2.8s5-1.5 5-2.8V13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.28em] [font-family:Merta,Arial,sans-serif]">
              Learning Ecosystem
            </span>
          </div>

          <nav className="flex items-center gap-2 text-sm font-semibold [font-family:Merta,Arial,sans-serif]">
            <a
              href="https://www.instagram.com/philadelphiaschoolpty/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full px-3 py-2 text-white/78 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/philadelphiaschoolpty"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full px-3 py-2 text-white/78 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Facebook
            </a>
            <a
              href="https://philadelphia-is.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 px-4 py-2 text-white transition hover:bg-white hover:text-[#191970]"
            >
              Web
            </a>
          </nav>
        </div>
      </header>

      <section className="grid h-svh pt-16 lg:grid-cols-[1fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-[#11115c] lg:block">
          <img
            src="https://philadelphia-is.vercel.app/estudiantes-felices-en-colegio-bilingue.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,42,.92),rgba(10,10,42,.72)_48%,rgba(10,10,42,.55))]" />
          <div className="relative flex h-full items-end px-12 pb-14">
            <div className="max-w-xl text-white">
              <h1 className="text-4xl font-bold leading-tight [font-family:Merta,Arial,sans-serif]">
                Formando líderes globales con excelencia académica y valores que perduran.
              </h1>
              <p className="mt-5 text-base text-white/72 [font-family:Merta,Arial,sans-serif]">
                Philadelphia International School
              </p>
            </div>
          </div>
        </aside>

        <div className="relative grid place-items-center overflow-hidden px-5 py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,.88),rgba(236,239,241,.76)_42%,rgba(236,239,241,1)_72%)]" />
          <LoginCard />
        </div>
      </section>
    </main>
  );
}
