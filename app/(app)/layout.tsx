import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
        <footer className="p-6 pt-0 text-center text-xs text-muted-foreground print:hidden">
          Criado por SolIA Labs
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}
