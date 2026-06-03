import { createFileRoute, Link } from "@tanstack/react-router";
import SiteLayout from "@/components/site/SiteLayout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Shiftinger" },
      { name: "description", content: "Sign in to your Shiftinger account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <SiteLayout>
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <Link to="/" className="text-2xl font-medium tracking-tight">
              <span className="text-teal">Shift</span>
              <span className="font-serif italic text-gold">inger</span>
            </Link>
            <h1 className="mt-6 font-serif text-3xl text-ink">Welcome back</h1>
            <p className="mt-2 text-sm text-ink/60">Sign in to manage your shifts and profile.</p>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-8 ring-1 ring-ink/5">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full ring-1 ring-ink/15 transition-colors hover:bg-ink/5"
            >
              <span className="text-sm font-medium text-ink">Continue with Google</span>
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
              <span className="h-px flex-1 bg-ink/10" />
              or
              <span className="h-px flex-1 bg-ink/10" />
            </div>

            <form className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full rounded-md border-0 bg-canvas px-3 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-md border-0 bg-canvas px-3 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              <button
                type="button"
                className="h-11 w-full rounded-full bg-teal text-sm font-medium text-canvas transition-colors hover:bg-teal-light"
              >
                Sign in
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-ink/50">
            New to Shiftinger?{" "}
            <Link to="/register" className="font-medium text-teal hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
