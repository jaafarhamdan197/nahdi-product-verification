import { signIn } from "@/auth";
import Header from "@/components/Header";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "This Google account isn't authorized to use the dashboard. Ask an administrator to add you as a test user.",
  Configuration: "Sign-in is misconfigured. Please contact the administrator.",
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="panel w-full max-w-sm">
          <h1 className="sec-hdr">Product Verification</h1>
          <p className="mt-2 mb-6 text-sm text-[var(--mid-gray)]">
            Sign in with your Google account to access the dashboard.
          </p>

          {message && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-[var(--risk)] bg-red-50 px-3 py-2 text-sm text-[var(--risk)]"
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
            <button type="submit" className="btn btn-primary w-full">
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
