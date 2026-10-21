import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SoliaLogo, SoliaMark } from "@/components/solia-logo";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SoliaMark className="size-7 text-primary" />
            <CardTitle>Meu Treino</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
        <span>Criado por</span>
        <SoliaLogo className="text-foreground" />
      </div>
    </main>
  );
}
