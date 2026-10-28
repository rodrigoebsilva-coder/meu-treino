import { SenhaForm } from "./senha-form";

export default function AlterarSenhaPage() {
  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Alterar senha 🔑</h1>
      <SenhaForm />
    </main>
  );
}
