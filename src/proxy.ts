export { auth as proxy } from "@/auth";

// Only guard page routes here — unauthenticated requests are redirected to
// /login. The API routes (/api/search, /api/export) are intentionally NOT
// matched: they verify the session themselves and return a JSON 401, which is
// the correct response for fetch() callers (a redirect to the HTML login page
// would break client-side `res.json()` parsing on session expiry).
export const config = {
  matcher: ["/dashboard/:path*"],
};
