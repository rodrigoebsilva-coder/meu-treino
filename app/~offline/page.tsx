export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">Sem conexão</h1>
      <p className="text-muted-foreground">
        Você está offline. O treino salvo no aparelho continua disponível; o que
        você registrar agora sincroniza quando a internet voltar.
      </p>
    </main>
  );
}
