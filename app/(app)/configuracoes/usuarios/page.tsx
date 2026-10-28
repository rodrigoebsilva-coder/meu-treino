import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UsuariosTable } from "./usuarios-table";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: meuPerfil } = await supabase
    .from("perfis")
    .select("cargo")
    .eq("user_id", userData.user.id)
    .single();

  if (meuPerfil?.cargo !== "admin") {
    redirect("/configuracoes");
  }

  const { data: usuarios } = await supabase
    .from("perfis")
    .select("user_id, email, nome, cargo")
    .order("criado_em", { ascending: true });

  const { data: cotas } = await supabase.from("cota_ia").select("user_id, creditos");
  const creditosPorUsuario = Object.fromEntries((cotas ?? []).map((c) => [c.user_id, c.creditos]));

  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Usuários 🛠️</h1>
      <UsuariosTable usuarios={usuarios ?? []} meuUserId={userData.user.id} creditosPorUsuario={creditosPorUsuario} />
    </main>
  );
}
