import { auth } from "@/auth";

/**
 * Development-only auth bypass. Lets the dashboard and API routes be tested
 * locally before Google OAuth credentials are configured.
 *
 * Hard-disabled in production: it requires BOTH a non-production build
 * (Vercel always sets NODE_ENV=production) AND an explicit opt-in flag, so it
 * can never accidentally expose a deployed instance.
 */
export function devBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_AUTH_BYPASS === "true"
  );
}

type Session = Awaited<ReturnType<typeof auth>>;

export async function getSession(): Promise<Session> {
  if (devBypassEnabled()) {
    return {
      user: { name: "Dev User", email: "dev@localhost" },
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    } as NonNullable<Session>;
  }
  return auth();
}
