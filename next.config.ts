import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// En ligne, le site est un export HTML statique (dossier out/) et le serveur est en PHP (public/api).
// En local, `npm run dev` utilise les routes *.dev.ts qui imitent l'API PHP.
export default function config(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    output: dev ? undefined : "export",
    trailingSlash: true,
    // Même commit + même contenu = mêmes fichiers : la reconstruction planifiée ne republie rien d'inutile
    generateBuildId: async () => process.env.GITHUB_SHA ?? null,
    pageExtensions: dev ? ["tsx", "ts", "dev.ts"] : ["tsx", "ts"],
    experimental: {
      agentFeedback: true,
    },
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
  };
}
