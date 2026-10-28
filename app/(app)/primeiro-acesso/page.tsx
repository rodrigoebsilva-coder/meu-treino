import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wizard } from "./wizard";

export default async function PrimeiroAcessoPage() {
  const supabase = await createClient();
  const { data: anamnese } = await supabase.from("anamnese_atual").select("user_id").maybeSingle();
  if (anamnese) redirect("/");

  return <Wizard />;
}
