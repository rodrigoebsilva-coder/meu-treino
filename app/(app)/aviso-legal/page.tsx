export default function AvisoLegalPage() {
  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Aviso legal e médico</h1>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>
          O Meu Treino é uma ferramenta pessoal de acompanhamento de treino, incluindo planos gerados por
          modelos de IA (Claude, Gemini). Não é supervisão profissional nem substitui a avaliação de um
          educador físico, fisioterapeuta ou médico.
        </p>
        <p>
          Consulte um profissional de saúde antes de iniciar ou mudar um programa de exercícios,
          especialmente se você tiver alguma condição médica, lesão ou estiver grávida. Pare e procure
          atendimento se sentir dor aguda, tontura, falta de ar fora do esperado ou qualquer sintoma
          preocupante durante o treino.
        </p>
        <p>
          Os planos gerados por IA são sugestões baseadas nas informações que você preenche na anamnese;
          eles podem conter erros ou não considerar todo o seu histórico de saúde. Ajuste cargas e exercícios
          com bom senso e priorize sua segurança sobre seguir o plano à risca.
        </p>
        <p>
          Dados de peso, medidas e fotos de progresso ficam só no seu banco de dados pessoal (Supabase),
          acessíveis só pela sua conta. Use a página{" "}
          <a href="/configuracoes/dados" className="underline underline-offset-4">
            Seus dados
          </a>{" "}
          pra exportar ou apagar tudo quando quiser.
        </p>
      </div>
    </main>
  );
}
