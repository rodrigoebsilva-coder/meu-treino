import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcularIMC, classificarIMC, calcularTMB } from "@/lib/perfil/metricas";

export function Metricas({
  pesoKg,
  alturaCm,
  idade,
  sexo,
}: {
  pesoKg: number;
  alturaCm: number;
  idade: number;
  sexo: "masculino" | "feminino" | null;
}) {
  const imc = calcularIMC(pesoKg, alturaCm);
  const tmb = sexo ? calcularTMB(pesoKg, alturaCm, idade, sexo) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas 📐</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">IMC: </span>
          <strong>{imc.toFixed(1)}</strong> <span className="text-muted-foreground">· {classificarIMC(imc)}</span>
        </div>
        {tmb !== null ? (
          <div>
            <span className="text-muted-foreground">TMB (taxa metabólica basal): </span>
            <strong>{Math.round(tmb)} kcal/dia</strong>
          </div>
        ) : (
          <p className="text-muted-foreground">Preencha o sexo biológico na anamnese pra ver a TMB.</p>
        )}
      </CardContent>
    </Card>
  );
}
