import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { MedidaForm } from "./medida-form";
import { MedidasList } from "./medidas-list";

export default async function MedidasPage() {
  const supabase = await createClient();
  const { data: medidas } = await supabase
    .from("medidas")
    .select("id, registrado_em, peso_kg, cintura_cm, peito_cm, braco_cm")
    .order("registrado_em", { ascending: false });

  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Medidas</h1>

      <Card>
        <CardHeader>
          <CardTitle>Registrar hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <MedidaForm />
        </CardContent>
      </Card>

      <MedidasList medidas={medidas ?? []} />
    </main>
  );
}
