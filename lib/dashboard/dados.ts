import type { SupabaseClient } from "@supabase/supabase-js";
import { inicioDaSemana } from "@/lib/semana";

export interface DiaResumo {
  id: string;
  ordem: number;
  nome: string;
  grupos_musculares: string[];
}

export interface TreinoAtivoResumo {
  id: string;
  nome_ciclo: string;
  criado_em: string;
  duracao_semanas: number;
  dias: DiaResumo[];
}

export async function buscarTreinoAtivo(supabase: SupabaseClient): Promise<TreinoAtivoResumo | null> {
  const { data: treino } = await supabase
    .from("treinos")
    .select("id, nome_ciclo, criado_em, duracao_semanas, treino_dias(id, ordem, nome, grupos_musculares)")
    .eq("status", "ativo")
    .maybeSingle();

  if (!treino) return null;

  return {
    id: treino.id,
    nome_ciclo: treino.nome_ciclo,
    criado_em: treino.criado_em,
    duracao_semanas: treino.duracao_semanas,
    dias: [...treino.treino_dias].sort((a, b) => a.ordem - b.ordem),
  };
}

// "Próximo dia" é só o dia seguinte, na ordem do ciclo, ao último treino
// finalizado — não tem agenda por dia da semana, o usuário treina quando
// pode. Sem nenhum treino finalizado ainda, sugere o primeiro dia do ciclo.
async function indiceProximoDia(supabase: SupabaseClient, dias: DiaResumo[]): Promise<number> {
  const { data: ultima } = await supabase
    .from("sessoes")
    .select("treino_dia_id")
    .not("finalizada_em", "is", null)
    .order("iniciada_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ultima?.treino_dia_id) return 0;

  const indiceAtual = dias.findIndex((d) => d.id === ultima.treino_dia_id);
  if (indiceAtual === -1) return 0;

  return (indiceAtual + 1) % dias.length;
}

export async function buscarProximoDia(
  supabase: SupabaseClient,
  dias: DiaResumo[]
): Promise<DiaResumo | null> {
  if (dias.length === 0) return null;
  return dias[await indiceProximoDia(supabase, dias)];
}

// Lista (não um calendário com datas — o app não sabe em que dia da semana o
// usuário treina) dos próximos `quantidade` dias na ordem do ciclo, podendo
// repetir dias se `quantidade` passar de `dias.length` (a rotação continua).
export async function buscarProximosDias(
  supabase: SupabaseClient,
  dias: DiaResumo[],
  quantidade: number
): Promise<DiaResumo[]> {
  if (dias.length === 0) return [];
  const indiceInicial = await indiceProximoDia(supabase, dias);
  return Array.from({ length: quantidade }, (_, i) => dias[(indiceInicial + i) % dias.length]);
}

export interface ResumoSemana {
  treinosFeitos: number;
  seriesFeitas: number;
  duracaoTotalSegundos: number;
  energiaMedia: number | null;
  sonoMedia: number | null;
}

export async function buscarResumoSemana(supabase: SupabaseClient): Promise<ResumoSemana> {
  const inicio = inicioDaSemana(new Date());

  const { data: sessoes } = await supabase
    .from("sessoes")
    .select("id, duracao_segundos, energia, sono")
    .gte("iniciada_em", `${inicio}T00:00:00`)
    .not("finalizada_em", "is", null);

  const lista = sessoes ?? [];
  const duracaoTotalSegundos = lista.reduce((acc, s) => acc + (s.duracao_segundos ?? 0), 0);

  const comEnergia = lista.filter((s): s is typeof s & { energia: number } => s.energia != null);
  const energiaMedia = comEnergia.length
    ? comEnergia.reduce((acc, s) => acc + s.energia, 0) / comEnergia.length
    : null;

  const comSono = lista.filter((s): s is typeof s & { sono: number } => s.sono != null);
  const sonoMedia = comSono.length ? comSono.reduce((acc, s) => acc + s.sono, 0) / comSono.length : null;

  let seriesFeitas = 0;
  if (lista.length > 0) {
    const { count } = await supabase
      .from("sessao_series")
      .select("id", { count: "exact", head: true })
      .in(
        "sessao_id",
        lista.map((s) => s.id)
      );
    seriesFeitas = count ?? 0;
  }

  return { treinosFeitos: lista.length, seriesFeitas, duracaoTotalSegundos, energiaMedia, sonoMedia };
}
