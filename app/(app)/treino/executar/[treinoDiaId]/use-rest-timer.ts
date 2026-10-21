"use client";

import { useEffect, useRef, useState } from "react";
import { preferenciasTimer } from "@/lib/preferencias/timer";

const CHAVE_SESSION_STORAGE = "meu-treino:descanso-ends-at";
const CHAVE_DURACAO_SESSION_STORAGE = "meu-treino:descanso-duracao-total";

function lerEndsAtSalvo(): number | null {
  if (typeof window === "undefined") return null;
  const salvo = sessionStorage.getItem(CHAVE_SESSION_STORAGE);
  if (!salvo) return null;
  const ts = Number(salvo);
  if (ts > Date.now()) return ts;
  sessionStorage.removeItem(CHAVE_SESSION_STORAGE);
  sessionStorage.removeItem(CHAVE_DURACAO_SESSION_STORAGE);
  return null;
}

function lerDuracaoSalva(): number {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(CHAVE_DURACAO_SESSION_STORAGE) ?? 0);
}

// O fim do descanso é guardado como timestamp absoluto (não um contador que
// decrementa) justamente porque o navegador pode suspender/atrasar o
// setInterval com a tela em segundo plano — ao voltar ao foco, o valor
// exibido é sempre recalculado a partir desse timestamp, nunca fica "preso".
export function useRestTimer() {
  const [endsAt, setEndsAt] = useState<number | null>(lerEndsAtSalvo);
  const [duracaoTotal, setDuracaoTotal] = useState<number>(lerDuracaoSalva);
  const [restante, setRestante] = useState(0);
  const alertouRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function dispararAlerta() {
    if (preferenciasTimer.getSom()) {
      try {
        const ctx = audioCtxRef.current ?? new AudioContext();
        audioCtxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch {
        // AudioContext pode falhar sem interação prévia do usuário — ok ignorar.
      }
    }

    if (preferenciasTimer.getVibracao() && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      document.hidden
    ) {
      new Notification("Descanso acabou", { body: "Hora da próxima série." });
    }
  }

  useEffect(() => {
    if (!endsAt) return;

    alertouRef.current = false;

    const tick = () => {
      const r = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRestante(r);
      if (r <= 0 && !alertouRef.current) {
        alertouRef.current = true;
        dispararAlerta();
        sessionStorage.removeItem(CHAVE_SESSION_STORAGE);
        sessionStorage.removeItem(CHAVE_DURACAO_SESSION_STORAGE);
      }
    };

    tick();
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [endsAt]);

  function iniciar(segundos: number) {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    const ts = Date.now() + segundos * 1000;
    sessionStorage.setItem(CHAVE_SESSION_STORAGE, String(ts));
    sessionStorage.setItem(CHAVE_DURACAO_SESSION_STORAGE, String(segundos));
    setEndsAt(ts);
    setDuracaoTotal(segundos);
  }

  function estender(segundosExtras: number) {
    setEndsAt((atual) => {
      if (!atual) return atual;
      const novo = atual + segundosExtras * 1000;
      sessionStorage.setItem(CHAVE_SESSION_STORAGE, String(novo));
      return novo;
    });
    setDuracaoTotal((atual) => {
      const nova = atual + segundosExtras;
      sessionStorage.setItem(CHAVE_DURACAO_SESSION_STORAGE, String(nova));
      return nova;
    });
  }

  function cancelar() {
    sessionStorage.removeItem(CHAVE_SESSION_STORAGE);
    sessionStorage.removeItem(CHAVE_DURACAO_SESSION_STORAGE);
    setEndsAt(null);
    setRestante(0);
  }

  return {
    ativo: !!endsAt && restante > 0,
    restante,
    duracaoTotal,
    iniciar,
    estender,
    cancelar,
  };
}
