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
        subtitle="Check item availability across the Nahdi KSA & UAE feeds."
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
              <button type="submit" className="btn px-3 py-1.5 text-xs">
                Sign out
              </button>
            </form>
          </div>
        }
      />

      <main className="flex-1 px-8 py-7">
        <SearchTool />
      </main>
    </div>
  );
}
