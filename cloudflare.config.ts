import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "daniel-churrasco",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-05",
    compatibilityFlags: ["nodejs_compat"],
    observability: {
      enabled: true,
      logs: { enabled: true, persist: true, headSamplingRate: 1 },
      traces: { enabled: true, persist: true, headSamplingRate: 1 },
    },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
