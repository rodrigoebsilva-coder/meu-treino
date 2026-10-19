import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: anamnese } = await supabase.from("anamnese_atual").select("objetivo, dias_disponiveis").maybeSingle();

  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Meu Treino</h1>

      {anamnese ? (
        <p className="text-muted-foreground">
          Objetivo atual: {anamnese.objetivo} · {anamnese.dias_disponiveis}x por semana.
        </p>
      ) : (
        <p className="text-muted-foreground">
          Você ainda não preencheu seu perfil/anamnese.
        </p>
      )}

      <p className="text-muted-foreground">
        O treino do dia e a execução guiada chegam na próxima fase. Por enquanto, dá
        pra conferir e editar seu perfil.
      </p>

      <Button
        render={<Link href="/perfil">Ver perfil</Link>}
        nativeButton={false}
        className="w-fit"
      />
    </main>
  );
}
