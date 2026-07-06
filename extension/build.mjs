import esbuild from "esbuild";
import { readFile, writeFile, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const prod = process.argv.includes("--prod");
const outdir = "dist";

const APP_URL = process.env.EXT_APP_URL ?? "http://localhost:3000";
const APP_ORIGIN = (() => {
  try {
    return new URL(APP_URL).origin;
  } catch {
    return "http://localhost:3000";
  }
})();

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

// Chỉ inject giá trị PUBLIC. KHÔNG bao giờ đưa service_role/OpenAI key vào đây.
const define = {
  "process.env.EXT_SUPABASE_URL": JSON.stringify(process.env.EXT_SUPABASE_URL ?? ""),
  "process.env.EXT_SUPABASE_ANON_KEY": JSON.stringify(process.env.EXT_SUPABASE_ANON_KEY ?? ""),
  "process.env.EXT_APP_URL": JSON.stringify(APP_URL),
};

await esbuild.build({
  entryPoints: {
    "service-worker": "src/background/service-worker.ts",
    "auth-bridge": "src/content/auth-bridge.ts",
    "yt-intercept": "src/content/yt-intercept.ts",
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

// manifest: thay __APP_ORIGIN__ bằng origin thật (host_permissions + content_scripts khớp APP_URL).
const manifest = await readFile("manifest.json", "utf8");
await writeFile(
  path.join(outdir, "manifest.json"),
  manifest.replaceAll("__APP_ORIGIN__", APP_ORIGIN)
);
await cp("src/popup/popup.html", path.join(outdir, "popup.html"));

console.log(`extension built -> ${outdir}/ (${prod ? "prod" : "dev"}) app=${APP_ORIGIN}`);
