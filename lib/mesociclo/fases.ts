export type NomeFase = "Acumulação" | "Intensificação" | "Deload";

export interface FaseMesociclo {
  nome: NomeFase;
  semanaInicio: number;
  semanaFim: number;
}

// Heurística fixa, não decidida pela IA (ver CLAUDE.md): ~15% deload no
// final, ~60% do restante em acumulação, o resto em intensificação. Ciclos
// curtos (<3 semanas) não têm espaço pra três fases — tudo vira acumulação.
export function calcularFases(duracaoSemanas: number): FaseMesociclo[] {
  if (duracaoSemanas < 3) {
    return [{ nome: "Acumulação", semanaInicio: 1, semanaFim: duracaoSemanas }];
  }

  const semanasDeload = Math.max(1, Math.round(duracaoSemanas * 0.15));
  const semanasAcumulacao = Math.max(1, Math.round((duracaoSemanas - semanasDeload) * 0.6));
  const semanasIntensificacao = duracaoSemanas - semanasDeload - semanasAcumulacao;

  const fases: FaseMesociclo[] = [];
  let cursor = 1;

  fases.push({ nome: "Acumulação", semanaInicio: cursor, semanaFim: cursor + semanasAcumulacao - 1 });
  cursor += semanasAcumulacao;

  if (semanasIntensificacao > 0) {
    fases.push({ nome: "Intensificação", semanaInicio: cursor, semanaFim: cursor + semanasIntensificacao - 1 });
    cursor += semanasIntensificacao;
  }

  fases.push({ nome: "Deload", semanaInicio: cursor, semanaFim: duracaoSemanas });
  return fases;
}

// Semana 1-indexada desde o início do ciclo (criado_em).
export function semanaAtual(criadoEm: string, hoje: Date = new Date()): number {
  const dias = Math.floor((hoje.getTime() - new Date(criadoEm).getTime()) / 86_400_000);
  return Math.floor(dias / 7) + 1;
}

export interface StatusMesociclo {
  semana: number;
  duracaoSemanas: number;
  fase: FaseMesociclo | null; // null = ciclo já passou da duração prevista
}

export function statusMesociclo(criadoEm: string, duracaoSemanas: number, hoje: Date = new Date()): StatusMesociclo {
  const semana = semanaAtual(criadoEm, hoje);
  if (semana > duracaoSemanas) {
    return { semana, duracaoSemanas, fase: null };
  }
  const fases = calcularFases(duracaoSemanas);
  const fase = fases.find((f) => semana >= f.semanaInicio && semana <= f.semanaFim) ?? fases[fases.length - 1];
  return { semana, duracaoSemanas, fase };
}
