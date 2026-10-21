"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { extrairYoutubeId, youtubeBuscaUrl } from "@/lib/treino/types";

// Com vídeo curado (youtube_url preenchido), abre embutido num Dialog. Sem
// curadoria (o caso de quase todo exercício do seed hoje), vira um link que
// manda pra uma busca no YouTube pelo nome do exercício — sempre funciona,
// sem depender de curadoria manual.
export function ExercicioVideoButton({
  nome,
  youtubeUrl,
  compact = false,
}: {
  nome: string;
  youtubeUrl: string | null;
  compact?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const youtubeId = extrairYoutubeId(youtubeUrl);

  if (youtubeId) {
    return (
      <>
        {compact ? (
          <Button variant="ghost" size="icon-sm" aria-label="Como executar" onClick={() => setAberto(true)}>
            <Play />
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
            <Play /> Como executar
          </Button>
        )}
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{nome}</DialogTitle>
            </DialogHeader>
            <iframe
              className="aspect-video w-full rounded-md"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="Como executar"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const href = youtubeBuscaUrl(nome);

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Ver no YouTube"
        render={<a href={href} target="_blank" rel="noopener noreferrer" />}
        nativeButton={false}
      >
        <Play />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      render={<a href={href} target="_blank" rel="noopener noreferrer" />}
      nativeButton={false}
    >
      <Play /> Ver no YouTube
    </Button>
  );
}
