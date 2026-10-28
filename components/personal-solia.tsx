// Personal SolIA: personagem em pixel art (pele clara, cabelo preto, regata, shorts e faixa na cabeça).
const CORES: Record<string, string> = {
  K: "#1B1B24", // cabelo
  S: "#FFE6D8", // pele
  E: "#111827", // olhos
  M: "#D9534F", // boca
  B: "#3B82F6", // faixa
  T: "#0E9AAE", // regata
  P: "#7C5CFF", // shorts
  W: "#F9FAFB", // meia/tênis
  G: "#6B7280", // sola
};

const PIXELS = [
  "................",
  ".....KKKKKK.....",
  "....KKKKKKKK....",
  "...KBBBBBBBBK...",
  "...KSSSSSSSSK...",
  "...KSESSSSESK...",
  "...KSSSSSSSSK...",
  "....KSSMMSSK....",
  ".....SSSSSS.....",
  "...KK.SSSS.KK...",
  "..SSTTTTTTTTSS..",
  "..SSTTTTTTTTSS..",
  "..SSTTTTTTTTSS..",
  "..SS.TTTTTT.SS..",
  ".....TTTTTT.....",
  ".....PPPPPP.....",
  ".....PPPPPP.....",
  ".....PP..PP.....",
  ".....SS..SS.....",
  ".....SS..SS.....",
  ".....WW..WW.....",
  "....WWW..WWW....",
  "....GGG..GGG....",
];

export function PersonalSolia({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 16 ${PIXELS.length}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Personal SolIA"
    >
      {PIXELS.flatMap((linha, y) =>
        [...linha].map((c, x) =>
          CORES[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={CORES[c]} /> : null
        )
      )}
    </svg>
  );
}
