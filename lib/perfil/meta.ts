export interface AvaliacaoMeta {
  pesoAtualKg: number;
  pesoAlvoKg: number;
  diferencaKg: number; // alvo - atual: negativo = perder peso, positivo = ganhar
  semanasRestantes: number;
  ritmoPedidoKgSemana: number;
  ritmoSeguroKgSemana: number;
  realista: boolean;
}

// Heurística comum: até ~1%/semana do peso corporal é um ritmo seguro pra
// perda de peso, até ~0,5%/semana pra ganho (mais lento porque ganho de massa
// magra tem um teto biológico menor que perda de gordura). Pedido até 1,5x
// esse ritmo ainda conta como "realista" (dá folga pra gente com mais
// margem, p.ex. sobrepeso maior); acima disso é agressivo demais pra sugerir
// sem alertar.
const MARGEM_AGRESSIVA = 1.5;

export function avaliarMeta(
  pesoAtualKg: number,
  pesoAlvoKg: number,
  metaPrazo: string,
  hoje: Date = new Date()
): AvaliacaoMeta | null {
  const prazo = new Date(`${metaPrazo}T00:00:00`);
  const diasRestantes = Math.ceil((prazo.getTime() - hoje.getTime()) / 86_400_000);
  if (diasRestantes <= 0) return null;

  const semanasRestantes = diasRestantes / 7;
  const diferencaKg = pesoAlvoKg - pesoAtualKg;
  const ritmoPedidoKgSemana = Math.abs(diferencaKg) / semanasRestantes;
  const percentualSeguro = diferencaKg < 0 ? 0.01 : 0.005;
  const ritmoSeguroKgSemana = pesoAtualKg * percentualSeguro;

  return {
    pesoAtualKg,
    pesoAlvoKg,
    diferencaKg,
    semanasRestantes,
    ritmoPedidoKgSemana,
    ritmoSeguroKgSemana,
    realista: ritmoPedidoKgSemana <= ritmoSeguroKgSemana * MARGEM_AGRESSIVA,
  };
}
