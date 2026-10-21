import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { avaliarMeta } from "@/lib/perfil/meta";

export function MetaRealismo({
  pesoAtualKg,
  pesoAlvoKg,
  metaPrazo,
}: {
  pesoAtualKg: number;
  pesoAlvoKg: number;
  metaPrazo: string;
}) {
  const avaliacao = avaliarMeta(pesoAtualKg, pesoAlvoKg, metaPrazo);

  if (!avaliacao) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Realismo da meta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">O prazo da meta já passou — ajuste a data.</p>
        </CardContent>
      </Card>
    );
  }

  const direcao = avaliacao.diferencaKg < 0 ? "perder" : "ganhar";
  const kgTotal = Math.abs(avaliacao.diferencaKg).toFixed(1);
  const semanas = Math.round(avaliacao.semanasRestantes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realismo da meta</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>
          {direcao === "perder" ? "Perder" : "Ganhar"} {kgTotal}kg em {semanas} semana{semanas === 1 ? "" : "s"}{" "}
          pede um ritmo de <strong>{avaliacao.ritmoPedidoKgSemana.toFixed(2)}kg/semana</strong>.
        </p>
        <p className="text-muted-foreground">
          Ritmo saudável pra você hoje: até ~{avaliacao.ritmoSeguroKgSemana.toFixed(2)}kg/semana.
        </p>
        {avaliacao.realista ? (
          <p className="font-medium text-emerald-600">Dentro de um ritmo saudável.</p>
        ) : (
          <p className="font-medium text-destructive">
            Meta agressiva — considere um prazo mais longo ou um alvo mais próximo do peso atual.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
