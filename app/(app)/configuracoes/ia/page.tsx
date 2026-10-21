import { createClient } from "@/lib/supabase/server";
import { IaForm } from "./ia-form";

export default async function ConfiguracoesIaPage() {
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("config_ia")
    .select("provedor_padrao, modelo_padrao, claude_key_secret_id, gemini_key_secret_id")
    .maybeSingle();

  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Configurações de IA</h1>
      <p className="text-sm text-muted-foreground">
        A chave fica guardada criptografada no Supabase Vault — nunca é enviada de
        volta pro navegador depois de salva.
      </p>
      <IaForm
        provedorAtual={config?.provedor_padrao ?? "claude"}
        modeloAtual={config?.modelo_padrao ?? ""}
        temChaveClaude={!!config?.claude_key_secret_id}
        temChaveGemini={!!config?.gemini_key_secret_id}
      />
    </main>
  );
}
