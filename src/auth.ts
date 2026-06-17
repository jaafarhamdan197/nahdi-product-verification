import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Parse the ALLOWED_EMAILS allowlist into a normalized, lowercased array.
 * Returns null when no allowlist is configured — in that case access is open
 * to any account Google authenticates (used only in dev / pre-allowlist setups).
 */
function allowedEmails(): string[] | null {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw) return null;
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.length > 0 ? emails : null;
}

/**
 * Whether an email may use the app. When no allowlist is set this returns true
 * (open). Enforced in THREE places — sign-in, the proxy route guard, and the
 * API routes — so removing someone from ALLOWED_EMAILS locks them out on their
 * very next request rather than whenever their 30-day session happens to expire.
 */
export function isEmailAllowed(email?: string | null): boolean {
  const list = allowedEmails();
  if (!list) return true;
  return !!email && list.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Auth.js only auto-trusts the host on Vercel. Behind any other reverse
  // proxy (Cloud Run, etc.) it throws UntrustedHost — which surfaces as
  // "There is a problem with the server configuration" — unless we opt in.
  trustHost: true,
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Runs during the OAuth callback. Returning false blocks sign-in and the
    // user is redirected to /login?error=AccessDenied.
    async signIn({ user }) {
      return isEmailAllowed(user.email);
    },
    // Runs in the proxy (middleware) for matched routes. Without this callback
    // next-auth defaults `authorized` to true and protects nothing, so it is
    // required for the proxy matcher to actually guard pages.
    authorized({ auth }) {
      // Mirror of devBypassEnabled() — kept inline because the proxy runs in
      // the edge runtime and must not import server-only modules.
      if (
        process.env.NODE_ENV !== "production" &&
        process.env.DEV_AUTH_BYPASS === "true"
      ) {
        return true;
      }
      // Require both a session AND an allowlisted email, re-checked on every
      // matched request (not just at sign-in).
      return !!auth?.user && isEmailAllowed(auth.user.email);
    },
  },
});
