// Funções de data civil e semana considerando o fuso de Brasília (America/Sao_Paulo)

export function dataLocalString(data: Date | string = new Date()): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Início da semana (domingo), como string "YYYY-MM-DD" no fuso local
export function inicioDaSemana(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : new Date(data.getTime());
  const dataStr = dataLocalString(d);
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const dataLocal = new Date(ano, mes - 1, dia);
  const diaSemana = dataLocal.getDay();
  dataLocal.setDate(dataLocal.getDate() - diaSemana);

  const a = dataLocal.getFullYear();
  const m = String(dataLocal.getMonth() + 1).padStart(2, "0");
  const diaM = String(dataLocal.getDate()).padStart(2, "0");
  return `${a}-${m}-${diaM}`;
}
