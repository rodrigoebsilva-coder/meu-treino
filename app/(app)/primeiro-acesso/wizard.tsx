"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PersonalSolia } from "@/components/personal-solia";
import { dataLocalString } from "@/lib/semana";
import { salvarAnamnese } from "../perfil/actions";

type Opcao = { valor: string; label: string; emoji?: string };
type Valores = Record<string, string>;

type Passo = {
  id: string;
  emoji: string;
  titulo: string;
  dica?: string;
  opcional?: boolean;
  quando?: (v: Valores) => boolean;
  tipo: "escolha" | "numero" | "texto" | "multi" | "medidas";
  opcoes?: Opcao[];
  permiteOutro?: boolean;
  unidade?: string;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
};

const MEDIDAS = [
  ["cintura_cm", "Cintura"],
  ["quadril_cm", "Quadril"],
  ["peito_cm", "Peito"],
  ["braco_cm", "Braço"],
  ["coxa_cm", "Coxa"],
  ["pescoco_cm", "Pescoço"],
] as const;

const PASSOS: Passo[] = [
  {
    id: "objetivo",
    emoji: "🎯",
    titulo: "Qual é o seu objetivo?",
    tipo: "escolha",
    permiteOutro: true,
    opcoes: [
      { valor: "Emagrecer", label: "Emagrecer", emoji: "🔥" },
      { valor: "Ganhar massa muscular", label: "Ganhar massa", emoji: "💪" },
      { valor: "Definição muscular", label: "Definição", emoji: "✨" },
      { valor: "Ganhar força", label: "Ganhar força", emoji: "🏋️" },
      { valor: "Saúde e condicionamento", label: "Saúde e disposição", emoji: "❤️" },
    ],
  },
  {
    id: "nivel",
    emoji: "🏅",
    titulo: "Qual é o seu nível?",
    tipo: "escolha",
    opcoes: [
      { valor: "iniciante", label: "Iniciante", emoji: "🌱" },
      { valor: "intermediario", label: "Intermediário", emoji: "⚡" },
      { valor: "avancado", label: "Avançado", emoji: "🚀" },
    ],
  },
  {
    id: "dias_disponiveis",
    emoji: "📅",
    titulo: "Quantos dias por semana você pode treinar?",
    tipo: "escolha",
    opcoes: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ valor: String(n), label: String(n) })),
  },
  {
    id: "local_treino",
    emoji: "📍",
    titulo: "Onde você vai treinar?",
    tipo: "escolha",
    opcoes: [
      { valor: "academia", label: "Academia", emoji: "🏢" },
      { valor: "casa", label: "Em casa", emoji: "🏠" },
      { valor: "hibrido", label: "Os dois", emoji: "🔀" },
    ],
  },
  { id: "idade", emoji: "🎂", titulo: "Quantos anos você tem?", tipo: "numero", unidade: "anos", min: 10, max: 100 },
  { id: "altura_cm", emoji: "📏", titulo: "Qual é a sua altura?", tipo: "numero", unidade: "cm", min: 100, max: 250 },
  {
    id: "peso_inicial_kg",
    emoji: "⚖️",
    titulo: "Quanto você pesa hoje?",
    tipo: "numero",
    unidade: "kg",
    min: 30,
    max: 300,
    step: "0.1",
  },
  {
    id: "sexo",
    emoji: "🧬",
    titulo: "Qual é o seu sexo biológico?",
    dica: "Usado só para calcular sua taxa metabólica basal.",
    opcional: true,
    tipo: "escolha",
    opcoes: [
      { valor: "masculino", label: "Masculino" },
      { valor: "feminino", label: "Feminino" },
    ],
  },
  {
    id: "meta_peso_kg",
    emoji: "🏁",
    titulo: "Tem um peso-alvo em mente?",
    opcional: true,
    tipo: "numero",
    unidade: "kg",
    min: 30,
    max: 300,
    step: "0.1",
  },
  {
    id: "meta_prazo",
    emoji: "⏳",
    titulo: "Em quanto tempo quer chegar lá?",
    dica: "Vamos avisar se o ritmo for puxado demais.",
    opcional: true,
    quando: (v) => Boolean(v.meta_peso_kg),
    tipo: "escolha",
    opcoes: [
      { valor: "1", label: "1 mês" },
      { valor: "3", label: "3 meses" },
      { valor: "6", label: "6 meses" },
      { valor: "12", label: "1 ano" },
    ],
  },
  {
    id: "lesoes",
    emoji: "🩹",
    titulo: "Alguma lesão ou limitação?",
    dica: "Pode marcar mais de uma.",
    opcional: true,
    tipo: "multi",
    permiteOutro: true,
    opcoes: [
      { valor: "Ombro", label: "Ombro" },
      { valor: "Joelho", label: "Joelho" },
      { valor: "Lombar", label: "Lombar" },
      { valor: "Coluna", label: "Coluna" },
      { valor: "Punho", label: "Punho" },
      { valor: "Quadril", label: "Quadril" },
    ],
  },
  {
    id: "medidas",
    emoji: "📐",
    titulo: "Quer registrar suas medidas?",
    dica: "Tudo opcional, em cm. Ajuda a acompanhar sua evolução.",
    opcional: true,
    tipo: "medidas",
  },
  {
    id: "observacoes",
    emoji: "📝",
    titulo: "Algo mais que a gente deva saber?",
    dica: "Preferências, horários, equipamentos que você tem...",
    opcional: true,
    tipo: "texto",
    placeholder: "Ex.: só tenho 45 min por dia, não gosto de agachamento...",
  },
  {
    id: "semanas",
    emoji: "🗓️",
    titulo: "Quanto tempo vai durar seu primeiro ciclo?",
    tipo: "escolha",
    opcoes: [
      { valor: "8", label: "8 semanas" },
      { valor: "12", label: "12 semanas" },
      { valor: "16", label: "16 semanas" },
    ],
  },
];

const MARCOS: Record<number, string> = {
  25: "Boa largada! 🔥",
  50: "Metade do caminho! 💥",
  75: "Quase lá, falta pouco! 🚀",
};

function valido(p: Passo, v: Valores) {
  if (p.tipo === "numero") {
    const n = Number(v[p.id]);
    if (!v[p.id]) return Boolean(p.opcional);
    return n >= (p.min ?? 0) && n <= (p.max ?? Infinity);
  }
  if (p.tipo === "escolha") {
    if (p.permiteOutro && v[p.id] === "__outro") return Boolean(v[`${p.id}_outro`]?.trim());
    return Boolean(v[p.id]) || Boolean(p.opcional);
  }
  return true;
}

function temResposta(p: Passo, v: Valores) {
  if (p.tipo === "medidas") return MEDIDAS.some(([id]) => v[id]);
  if (p.tipo === "multi") return Boolean(v[p.id] || v.lesoes_outro?.trim());
  return Boolean(v[p.id]);
}

function Balao({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 rounded-2xl border border-border bg-card p-4 text-left shadow-sm">
      <span className="absolute top-6 -left-1.5 size-3 rotate-45 border-b border-l border-border bg-card" />
      {children}
    </div>
  );
}

export function Wizard() {
  const router = useRouter();
  const [valores, setValores] = useState<Valores>({ semanas: "12" });
  const [indice, setIndice] = useState(0);
  const [comecou, setComecou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const passos = PASSOS.filter((p) => !p.quando || p.quando(valores));
  const concluido = indice >= passos.length;
  const passo = concluido ? null : passos[indice];
  const progresso = Math.round((Math.min(indice, passos.length) / passos.length) * 100);
  const marco = [1, 2, 3].map((k) => (indice === Math.round((passos.length * k) / 4) ? MARCOS[k * 25] : null)).find(Boolean) ?? null;

  function definir(id: string, valor: string) {
    setValores((v) => ({ ...v, [id]: valor }));
  }

  function avancar() {
    setIndice((i) => i + 1);
  }

  function escolher(p: Passo, valor: string) {
    definir(p.id, valor);
    if (valor !== "__outro") setTimeout(avancar, 220);
  }

  function alternarMulti(p: Passo, valor: string) {
    const atuais = (valores[p.id] ?? "").split("|").filter(Boolean);
    const novos = atuais.includes(valor) ? atuais.filter((a) => a !== valor) : [...atuais, valor];
    definir(p.id, novos.join("|"));
  }

  async function finalizar(gerar: boolean) {
    setEnviando(true);
    setErro(null);

    const fd = new FormData();
    const objetivo = valores.objetivo === "__outro" ? valores.objetivo_outro.trim() : valores.objetivo;
    fd.set("objetivo", objetivo);
    for (const id of ["nivel", "dias_disponiveis", "local_treino", "idade", "altura_cm", "peso_inicial_kg", "sexo", "meta_peso_kg", "observacoes"]) {
      fd.set(id, valores[id] ?? "");
    }
    if (valores.meta_peso_kg && valores.meta_prazo) {
      const d = new Date();
      d.setMonth(d.getMonth() + Number(valores.meta_prazo));
      fd.set("meta_prazo", dataLocalString(d));
    }
    const lesoes = [...(valores.lesoes ?? "").split("|").filter(Boolean), valores.lesoes_outro?.trim()].filter(Boolean);
    fd.set("lesoes", lesoes.join(", "));
    for (const [id] of MEDIDAS) fd.set(id, valores[id] ?? "");

    const resultado = await salvarAnamnese({ error: null, success: false }, fd);
    if (!resultado.success) {
      setErro(resultado.error ?? "Não foi possível salvar. Tente de novo.");
      setEnviando(false);
      return;
    }
    router.push(gerar ? `/treino/gerar-ia?tipoAcao=novo_ciclo&semanas=${valores.semanas}` : "/");
  }

  const chip = (ativo: boolean) =>
    cn(
      "flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-base font-medium shadow-sm transition active:scale-95",
      ativo && "border-primary bg-primary text-primary-foreground shadow-primary/30"
    );

  if (!comecou) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] flex-col items-center gap-6 p-6 animate-in fade-in duration-500">
        <PersonalSolia className="mt-4 h-52 drop-shadow-md" />
        <div className="w-full rounded-2xl border border-border bg-card p-5 text-left shadow-sm">
          <p className="font-heading text-xl font-semibold">Oi, eu sou a Personal SolIA! 💪</p>
          <p className="mt-2 text-muted-foreground">
            Sou uma personal trainer de inteligência artificial e vou acompanhar você em toda a sua jornada: montar
            o seu treino, ajustar quando precisar e comemorar cada evolução.
          </p>
          <p className="mt-2 text-muted-foreground">
            Para começar, vou te fazer algumas perguntinhas rápidas. Dá para pular as opcionais, combinado?
          </p>
        </div>
        <Button className="mt-auto h-14 w-full text-base" onClick={() => setComecou(true)}>
          Bora começar! <ArrowRight />
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{concluido ? "Tudo pronto!" : `Etapa ${indice + 1} de ${passos.length}`}</span>
          <span className="font-medium text-foreground">⭐ {Math.min(indice, passos.length) * 10} XP</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${concluido ? 100 : progresso}%` }} />
        </div>
        {marco ? <p className="text-center text-sm font-medium text-primary">{marco}</p> : null}
      </div>

      {passo ? (
        <div key={passo.id} className="flex flex-1 flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-start gap-3">
            <PersonalSolia className="h-24 shrink-0" />
            <Balao>
              <h1 className="font-heading text-lg leading-snug font-semibold">
                {passo.emoji} {passo.titulo}
              </h1>
              {passo.dica ? <p className="mt-1 text-sm text-muted-foreground">{passo.dica}</p> : null}
            </Balao>
          </div>

          {passo.tipo === "escolha" ? (
            <div className={cn("grid gap-3", passo.opcoes!.length > 4 ? "grid-cols-4" : "grid-cols-1")}>
              {passo.opcoes!.map((o) => (
                <button key={o.valor} type="button" onClick={() => escolher(passo, o.valor)} className={chip(valores[passo.id] === o.valor)}>
                  {o.emoji ? <span>{o.emoji}</span> : null}
                  {o.label}
                </button>
              ))}
              {passo.permiteOutro ? (
                <button
                  type="button"
                  onClick={() => escolher(passo, "__outro")}
                  className={cn(chip(valores[passo.id] === "__outro"), passo.opcoes!.length > 4 && "col-span-4")}
                >
                  ✏️ Outro
                </button>
              ) : null}
              {passo.permiteOutro && valores[passo.id] === "__outro" ? (
                <Input
                  autoFocus
                  placeholder="Escreva aqui"
                  value={valores[`${passo.id}_outro`] ?? ""}
                  onChange={(e) => definir(`${passo.id}_outro`, e.target.value)}
                  className={cn("h-12", passo.opcoes!.length > 4 && "col-span-4")}
                />
              ) : null}
            </div>
          ) : null}

          {passo.tipo === "multi" ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {passo.opcoes!.map((o) => (
                  <button
                    key={o.valor}
                    type="button"
                    onClick={() => alternarMulti(passo, o.valor)}
                    className={chip((valores[passo.id] ?? "").split("|").includes(o.valor))}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Outra? Descreva (opcional)"
                value={valores.lesoes_outro ?? ""}
                onChange={(e) => definir("lesoes_outro", e.target.value)}
                className="h-12"
              />
            </div>
          ) : null}

          {passo.tipo === "numero" ? (
            <div className="flex items-center justify-center gap-3">
              <Input
                autoFocus
                type="number"
                inputMode="decimal"
                step={passo.step}
                value={valores[passo.id] ?? ""}
                onChange={(e) => definir(passo.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && valido(passo, valores) && avancar()}
                className="h-16 w-40 text-center text-3xl"
              />
              <span className="text-lg text-muted-foreground">{passo.unidade}</span>
            </div>
          ) : null}

          {passo.tipo === "texto" ? (
            <Textarea
              rows={4}
              placeholder={passo.placeholder}
              value={valores[passo.id] ?? ""}
              onChange={(e) => definir(passo.id, e.target.value)}
            />
          ) : null}

          {passo.tipo === "medidas" ? (
            <div className="grid grid-cols-2 gap-3">
              {MEDIDAS.map(([id, label]) => (
                <div key={id} className="flex flex-col gap-1">
                  <label htmlFor={id} className="text-sm text-muted-foreground">
                    {label} (cm)
                  </label>
                  <Input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={valores[id] ?? ""}
                    onChange={(e) => definir(id, e.target.value)}
                    className="h-12"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex items-center gap-3">
            <Button variant="outline" size="icon" className="size-12" disabled={indice === 0} onClick={() => setIndice((i) => i - 1)} aria-label="Etapa anterior">
              <ArrowLeft />
            </Button>
            <Button className="h-12 flex-1 text-base" disabled={!valido(passo, valores)} onClick={avancar}>
              {passo.opcional && !temResposta(passo, valores) ? "Pular" : "Continuar"}
              <ArrowRight />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-300">
          <PersonalSolia className="h-40" />
          <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h1 className="font-heading text-xl font-semibold">Perfil completo! 🏆</h1>
            <p className="mt-1 text-muted-foreground">
              Pronto, já sei tudo que preciso! Você ganhou {passos.length * 10} XP. Agora eu monto o seu primeiro
              ciclo de treino e a gente começa essa jornada juntos.
            </p>
          </div>
          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
          <div className="mt-auto flex w-full flex-col gap-3">
            <Button className="h-14 w-full text-base" disabled={enviando} onClick={() => finalizar(true)}>
              {enviando ? "Salvando..." : "Gerar meu treino 🚀"}
            </Button>
            <Button variant="ghost" disabled={enviando} onClick={() => finalizar(false)}>
              Só salvar meu perfil
            </Button>
            <Button variant="ghost" disabled={enviando} onClick={() => setIndice(passos.length - 1)}>
              Revisar respostas
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
