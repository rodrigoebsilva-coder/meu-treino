// Preferências do timer de descanso — ficam só no aparelho (localStorage),
// não no banco: é um ajuste de UI por dispositivo, não dado do usuário.
// Padrão é "ligado" nos dois (som + vibração), igual o comportamento de
// antes dessa preferência existir.

const CHAVE_SOM = "meu-treino:som-descanso";
const CHAVE_VIBRACAO = "meu-treino:vibracao-descanso";
const CHAVE_DESCANSO = "meu-treino:descanso-segundos";

function ler(chave: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const valor = window.localStorage.getItem(chave);
    return valor === null ? true : valor === "1";
  } catch {
    return true;
  }
}

function escrever(chave: string, valor: boolean) {
  try {
    window.localStorage.setItem(chave, valor ? "1" : "0");
  } catch {
    // localStorage pode falhar (modo privado, cota cheia) — ok ignorar.
  }
}

// null = usar o descanso de cada exercício no plano.
function lerDescanso(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const valor = window.localStorage.getItem(CHAVE_DESCANSO);
    if (!valor) return null;
    const n = Number(valor);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

function escreverDescanso(v: number | null) {
  try {
    if (v === null) window.localStorage.removeItem(CHAVE_DESCANSO);
    else window.localStorage.setItem(CHAVE_DESCANSO, String(v));
  } catch {
    // ok ignorar
  }
}

export const preferenciasTimer = {
  getDescanso: lerDescanso,
  setDescanso: escreverDescanso,
  getSom: () => ler(CHAVE_SOM),
  setSom: (v: boolean) => escrever(CHAVE_SOM, v),
  getVibracao: () => ler(CHAVE_VIBRACAO),
  setVibracao: (v: boolean) => escrever(CHAVE_VIBRACAO, v),
};
