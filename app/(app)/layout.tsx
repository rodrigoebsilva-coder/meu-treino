import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SoliaLogo } from "@/components/solia-logo";
import { BottomNav } from "./bottom-nav";
import { SyncBoot } from "./sync-boot";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <SyncBoot />
      <div className="flex-1 pb-16">
        {children}
        <footer className="flex flex-col items-center gap-1 p-6 pt-0 text-xs text-muted-foreground print:hidden">
          <span>Criado por</span>
          <SoliaLogo className="text-foreground" />
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}
