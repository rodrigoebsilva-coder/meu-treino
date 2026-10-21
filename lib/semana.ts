// Início da semana (domingo), como string "YYYY-MM-DD" — usado pra agrupar
// dados por semana (gráficos de evolução, resumo semanal do dashboard).
export function inicioDaSemana(data: Date): string {
  const d = new Date(data);
  const diaSemana = d.getDay();
  d.setDate(d.getDate() - diaSemana);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
