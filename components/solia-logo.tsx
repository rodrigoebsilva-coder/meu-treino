// Logomark da SolIA Labs: nós conectados nas três cores de acento da marca
// (azul, violeta, ciano — mesmas de `--chart-1/2/3` em app/globals.css).
// Recriado como SVG a partir do board de brand guidelines da SolIA (o
// artifact original é um canvas dentro de iframe, não deu pra extrair o
// arquivo original com fidelidade total) — se não bater exatamente com a
// logo oficial, é só pedir o ajuste.
export function SoliaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <line x1="10" y1="12" x2="20" y2="20" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="20" x2="30" y2="28" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="10" cy="12" r="6" fill="#0E9AAE" />
      <circle cx="20" cy="20" r="7" fill="#3B82F6" />
      <circle cx="30" cy="28" r="6" fill="#7C5CFF" />
    </svg>
  );
}

export function SoliaLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <SoliaMark className="size-5 text-foreground" />
      <span className="font-heading font-medium">SolIA Labs</span>
    </span>
  );
}
