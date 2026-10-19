import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "./bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <div className="flex-1 pb-16">{children}</div>
      <BottomNav />
    </div>
  );
}
