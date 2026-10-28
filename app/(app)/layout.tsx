import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SoliaLogo } from "@/components/solia-logo";
import { BottomNav } from "./bottom-nav";
import { VoltarBar } from "./voltar-bar";
import { SyncBoot } from "./sync-boot";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <SyncBoot />
      <VoltarBar />
      <div className="mx-auto w-full max-w-2xl flex-1 pb-4">
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
