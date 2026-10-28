export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function distancia(a: string, b: string) {
  const linha = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const atual = linha[j];
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = atual;
    }
  }
  return linha[b.length];
}

// Pontuação por palavra digitada: 0 se aparece no texto, senão a distância de edição
// até a palavra mais parecida (tolera erro de digitação). null = não combina.
function pontuarPalavra(palavra: string, texto: string, palavrasTexto: string[]) {
  if (texto.includes(palavra)) return 0;
  const tolerancia = palavra.length <= 3 ? 0 : palavra.length <= 6 ? 1 : 2;
  if (tolerancia === 0) return null;
  const melhor = Math.min(
    ...palavrasTexto.map((p) => distancia(palavra, p.slice(0, palavra.length + 1))),
    ...palavrasTexto.map((p) => distancia(palavra, p))
  );
  return melhor <= tolerancia ? melhor : null;
}

export function filtrarPorBusca<T>(itens: T[], consulta: string, texto: (item: T) => string): T[] {
  const q = normalizar(consulta);
  if (!q) return itens;
  const palavras = q.split(/\s+/);

  return itens
    .map((item, indice) => {
      const t = normalizar(texto(item));
      const palavrasTexto = t.split(/[^a-z0-9]+/).filter(Boolean);
      let total = 0;
      for (const palavra of palavras) {
        const pontos = pontuarPalavra(palavra, t, palavrasTexto);
        if (pontos === null) return null;
        total += pontos;
      }
      return { item, total, indice };
    })
    .filter((r): r is { item: T; total: number; indice: number } => r !== null)
    .sort((a, b) => a.total - b.total || a.indice - b.indice)
    .map((r) => r.item);
}
