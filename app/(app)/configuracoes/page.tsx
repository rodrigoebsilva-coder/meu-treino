import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimerToggles } from "./timer-toggles";
import { sair } from "../actions";

export default function ConfiguracoesPage() {
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

      <form action={sair}>
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>
    </main>
  );
}
