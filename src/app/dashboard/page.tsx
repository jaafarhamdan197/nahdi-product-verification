import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getSession } from "@/lib/session";
import Header from "@/components/Header";
import SearchTool from "@/components/SearchTool";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        right={
          <div className="flex items-center gap-3">
            <span className="topbar-meta hidden sm:inline">
              {session.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-white/25 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        }
      />

      <div className="border-b border-[var(--light-gray)] bg-white px-8 py-4">
        <h1 className="sec-hdr">Product Verification</h1>
        <p className="mt-1 text-xs text-[var(--mid-gray)]">
          Check item availability across the Nahdi KSA &amp; UAE feeds.
        </p>
      </div>

      <main className="flex-1 px-8 py-7">
        <SearchTool />
      </main>
    </div>
  );
}
