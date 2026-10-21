import { createClient } from "@/lib/supabase/server";
import { buscarDadosRelatorio } from "@/lib/dashboard/relatorio";
import { ExportarButton } from "./exportar-button";

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarDuracao(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  if (horas === 0) return `${minutos}min`;
  return `${horas}h${String(minutos).padStart(2, "0")}`;
}

export default async function RelatorioPage() {
  const supabase = await createClient();
  const dados = await buscarDadosRelatorio(supabase);

  const deltaPeso =
    dados.pesoInicialKg != null && dados.pesoAtualKg != null ? dados.pesoAtualKg - dados.pesoInicialKg : null;

  return (
    <main className="flex flex-col gap-6 p-6 print:p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Relatório de treino</h1>
          <p className="text-sm text-muted-foreground">
            {formatarData(dados.periodoInicio)} – {formatarData(dados.periodoFim)}
            {dados.nomeCiclo ? ` · ${dados.nomeCiclo}` : ""}
          </p>
        </div>
        <ExportarButton />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-border p-3">
          <p className="text-sm text-muted-foreground">Treinos realizados</p>
          <p className="text-xl font-semibold">{dados.treinosRealizados}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-sm text-muted-foreground">Séries totais</p>
          <p className="text-xl font-semibold">{dados.seriesTotais}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-sm text-muted-foreground">Volume total</p>
          <p className="text-xl font-semibold">{dados.volumeTotalKg}kg</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-sm text-muted-foreground">Tempo treinado</p>
          <p className="text-xl font-semibold">{formatarDuracao(dados.duracaoTotalSegundos)}</p>
        </div>
      </div>

      {dados.pesoInicialKg != null ? (
        <div className="rounded-md border border-border p-3 text-sm">
          Peso: {dados.pesoInicialKg}kg
          {dados.pesoAtualKg != null ? (
            <>
              {" "}
              → {dados.pesoAtualKg}kg (
              {deltaPeso !== null ? `${deltaPeso > 0 ? "+" : ""}${deltaPeso.toFixed(1)}kg` : "—"})
            </>
          ) : null}
        </div>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-medium">Sessões no período</h2>
        {dados.sessoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma sessão concluída nesse período.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-1 pr-2 font-normal">Data</th>
                <th className="py-1 pr-2 font-normal">Dia</th>
                <th className="py-1 pr-2 font-normal">Duração</th>
                <th className="py-1 pr-2 font-normal">Séries</th>
                <th className="py-1 pr-2 font-normal">Energia</th>
                <th className="py-1 font-normal">Sono</th>
              </tr>
            </thead>
            <tbody>
              {dados.sessoes.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <td className="py-1 pr-2">{formatarData(s.iniciada_em)}</td>
                  <td className="py-1 pr-2">{s.nome_dia}</td>
                  <td className="py-1 pr-2">{s.duracao_segundos ? formatarDuracao(s.duracao_segundos) : "—"}</td>
                  <td className="py-1 pr-2">{s.numero_series}</td>
                  <td className="py-1 pr-2">{s.energia ?? "—"}</td>
                  <td className="py-1">{s.sono ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {dados.medidas.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Medidas no período</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-1 pr-2 font-normal">Data</th>
                <th className="py-1 pr-2 font-normal">Peso</th>
                <th className="py-1 pr-2 font-normal">Cintura</th>
                <th className="py-1 pr-2 font-normal">Peito</th>
                <th className="py-1 font-normal">Braço</th>
              </tr>
            </thead>
            <tbody>
              {dados.medidas.map((m) => (
                <tr key={m.registrado_em} className="border-b border-border">
                  <td className="py-1 pr-2">{formatarData(m.registrado_em)}</td>
                  <td className="py-1 pr-2">{m.peso_kg != null ? `${m.peso_kg}kg` : "—"}</td>
                  <td className="py-1 pr-2">{m.cintura_cm != null ? `${m.cintura_cm}cm` : "—"}</td>
                  <td className="py-1 pr-2">{m.peito_cm != null ? `${m.peito_cm}cm` : "—"}</td>
                  <td className="py-1">{m.braco_cm != null ? `${m.braco_cm}cm` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </main>
  );
}
