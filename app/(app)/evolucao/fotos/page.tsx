import { createClient } from "@/lib/supabase/server";
import { UploadFoto } from "./upload-foto";
import { FotosGaleria } from "./fotos-galeria";

export default async function FotosPage() {
  const supabase = await createClient();
  const { data: fotos } = await supabase
    .from("fotos_progresso")
    .select("id, storage_path, registrado_em")
    .order("registrado_em", { ascending: false });

  const fotosComUrl = await Promise.all(
    (fotos ?? []).map(async (f) => {
      const { data } = await supabase.storage.from("fotos-progresso").createSignedUrl(f.storage_path, 60 * 60);
      return { ...f, url: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Fotos de progresso</h1>
      <UploadFoto />
      <FotosGaleria fotos={fotosComUrl} />
    </main>
  );
}
