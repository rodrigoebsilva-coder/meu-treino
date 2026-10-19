import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents/partialPrefetching (PPR) desligados de propósito: todo
  // mundo nas rotas (app) e (auth) depende de cookies() (sessão do Supabase),
  // então não existe shell estático que valha a pena gerar — só adicionaria
  // Suspense boundaries em todo lugar sem ganho real para um app pessoal.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSerwist(nextConfig);
