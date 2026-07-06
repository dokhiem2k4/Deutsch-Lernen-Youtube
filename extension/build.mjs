import esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const prod = process.argv.includes("--prod");
const outdir = "dist";

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

// Chỉ inject giá trị PUBLIC. KHÔNG bao giờ đưa service_role/OpenAI key vào đây.
const define = {
  "process.env.EXT_SUPABASE_URL": JSON.stringify(process.env.EXT_SUPABASE_URL ?? ""),
  "process.env.EXT_SUPABASE_ANON_KEY": JSON.stringify(process.env.EXT_SUPABASE_ANON_KEY ?? ""),
  "process.env.EXT_APP_URL": JSON.stringify(process.env.EXT_APP_URL ?? "http://localhost:3000"),
};

await esbuild.build({
  entryPoints: {
    "service-worker": "src/background/service-worker.ts",
    "youtube": "src/content/youtube.ts",
    "popup": "src/popup/popup.ts",
  },
  outdir,
  bundle: true,
  format: "iife",
  target: "chrome110",
  minify: prod,
  sourcemap: !prod,
  define,
  logLevel: "info",
});

// static assets
await cp("manifest.json", path.join(outdir, "manifest.json"));
await cp("src/popup/popup.html", path.join(outdir, "popup.html"));

console.log(`extension built -> ${outdir}/ (${prod ? "prod" : "dev"})`);
