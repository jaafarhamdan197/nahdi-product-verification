import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getSession } from "@/lib/session";
import SearchTool from "@/components/SearchTool";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Nahdi Product Verification
          </h1>
          <p className="text-sm text-slate-500">
            Signed in as {session.user?.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="px-6 py-8">
        <SearchTool />
      </main>
    </div>
  );
}
