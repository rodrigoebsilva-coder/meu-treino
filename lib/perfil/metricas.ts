export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return pesoKg / (alturaM * alturaM);
}

export function classificarIMC(imc: number): string {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau I";
  if (imc < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

// Mifflin-St Jeor — fórmula atual mais usada pra TMB (taxa metabólica
// basal), mais simples e geralmente mais precisa que Harris-Benedict.
export function calcularTMB(
  pesoKg: number,
  alturaCm: number,
  idade: number,
  sexo: "masculino" | "feminino"
): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;
  return sexo === "masculino" ? base + 5 : base - 161;
}
