import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimerToggles } from "./timer-toggles";
import { SairButton } from "./sair-button";
import { createClient } from "@/lib/supabase/server";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: perfil } = userData.user
    ? await supabase.from("perfis").select("cargo").eq("user_id", userData.user.id).single()
    : { data: null };

  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Configurações ⚙️</h1>

      <div className="flex items-center justify-between">
        <span>Tema</span>
        <ThemeToggle />
      </div>

      <TimerToggles />

      <Button variant="outline" render={<Link href="/configuracoes/ia">IA (Claude/Gemini)</Link>} nativeButton={false} className="w-fit" />
      <Button variant="outline" render={<Link href="/configuracoes/dados">Seus dados</Link>} nativeButton={false} className="w-fit" />
      <Button variant="outline" render={<Link href="/aviso-legal">Aviso legal e médico</Link>} nativeButton={false} className="w-fit" />
      {perfil?.cargo === "admin" ? (
        <Button variant="outline" render={<Link href="/configuracoes/usuarios">Usuários 🛠️</Link>} nativeButton={false} className="w-fit" />
      ) : null}

      <SairButton />
    </main>
  );
}
