import { signIn } from "@/auth";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "This Google account isn't authorized to use the dashboard. Ask an administrator to add you as a test user.",
  Configuration:
    "Sign-in is misconfigured. Please contact the administrator.",
  Verification: "The sign-in link is no longer valid. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error
    ? ERROR_MESSAGES[error] ?? "Sign-in failed. Please try again."
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">
          Nahdi Product Verification
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Sign in with your Google account to access the dashboard.
        </p>

        {message && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {message}
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
