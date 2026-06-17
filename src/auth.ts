import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Runs during the OAuth callback. Returning false blocks sign-in and the
    // user is redirected to /login?error=AccessDenied.
    async signIn({ user }) {
      const allowList = process.env.ALLOWED_EMAILS;
      if (!allowList) return true;
      const emails = allowList
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (emails.length === 0) return true;
      return !!user.email && emails.includes(user.email.toLowerCase());
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
      return !!auth?.user;
    },
  },
});
