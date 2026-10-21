import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportarLink, ImportarForm, ApagarTudoButton } from "./dados-client";

export default function DadosPage() {
  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Seus dados 🗂️</h1>

      <Card>
        <CardHeader>
          <CardTitle>Exportar</CardTitle>
        </CardHeader>
        <CardContent>
          <ExportarLink />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importar</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportarForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apagar</CardTitle>
        </CardHeader>
        <CardContent>
          <ApagarTudoButton />
        </CardContent>
      </Card>
    </main>
  );
}
