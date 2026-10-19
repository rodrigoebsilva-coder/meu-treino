import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { NIVEL_LABEL, LOCAL_TREINO_LABEL, type AnamneseInput } from "@/lib/perfil/schema";
import { AnamneseForm } from "./anamnese-form";

export default async function PerfilPage() {
  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("anamnese_atual")
    .select("*")
    .maybeSingle<AnamneseInput & { versao: number }>();

  const { data: historico } = await supabase
    .from("anamneses")
    .select("versao, objetivo, nivel, local_treino, criado_em")
    .order("versao", { ascending: false });

  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {atual ? `Anamnese (versão ${atual.versao})` : "Preencher anamnese"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnamneseForm anamnese={atual ?? null} />
        </CardContent>
      </Card>

      {historico && historico.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {historico.map((h) => (
              <div key={h.versao} className="flex justify-between text-sm text-muted-foreground">
                <span>
                  v{h.versao} · {h.objetivo} · {NIVEL_LABEL[h.nivel as AnamneseInput["nivel"]]} ·{" "}
                  {LOCAL_TREINO_LABEL[h.local_treino as AnamneseInput["local_treino"]]}
                </span>
                <span>{new Date(h.criado_em).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
