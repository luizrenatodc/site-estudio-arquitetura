// Gera as capturas de docs/ e os quadros do GIF (tmp/quadros) usando o site de verdade.
// Uso: node scripts/telas.mjs     (precisa de puppeteer-core e Edge/Chrome)
//   PUPPETEER_DIR  pasta onde puppeteer-core está instalado (padrão: pasta atual)
//   NAVEGADOR      caminho do Edge/Chrome (padrão: Edge do Windows)
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const require = createRequire((process.env.PUPPETEER_DIR ?? process.cwd()).replace(/[\\/]?$/, "/"));
const puppeteer = require("puppeteer-core");
const NAVEGADOR = process.env.NAVEGADOR ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORTA = 8112;
const URL_SITE = `http://localhost:${PORTA}/`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const servidor = spawn(process.execPath, ["scripts/servir.mjs"], { env: { ...process.env, PORT: String(PORTA) }, stdio: "ignore" });
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(URL_SITE)).ok) break; } catch { /* aguardando */ }
  await dormir(150);
}
mkdirSync("docs", { recursive: true });
rmSync("tmp/quadros", { recursive: true, force: true });
mkdirSync("tmp/quadros", { recursive: true });

const navegador = await puppeteer.launch({ executablePath: NAVEGADOR, headless: "new" });
const erros = [];

async function pagina(largura, altura, dsf = 1) {
  const p = await navegador.newPage();
  await p.setViewport({ width: largura, height: altura, deviceScaleFactor: dsf });
  p.on("pageerror", (e) => erros.push(e.message));
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await p.goto(URL_SITE, { waitUntil: "networkidle0" });
  await p.evaluate(() => (document.documentElement.style.scrollBehavior = "auto"));
  return p;
}
const ir = async (p, sel, desloc = 0, pausa = 1200) => {
  await p.evaluate((s, d) => { if (!document.querySelector(s)) throw new Error("sem " + s); document.querySelector(s).scrollIntoView({ block: "start" }); window.scrollBy(0, -d); }, sel, desloc);
  await dormir(pausa);
};

try {
  let p = await pagina(1440, 900);
  await dormir(2600);
  await p.screenshot({ path: "docs/hero.png" });
  await ir(p, "#projetos", 20);
  await p.screenshot({ path: "docs/projetos.png" });
  await p.click('[data-cat="Residencial"]');
  await dormir(900);
  await p.screenshot({ path: "docs/filtro.png" });
  await p.click(".card a");
  await dormir(1400);
  await p.screenshot({ path: "docs/projeto-volume.png" });
  await p.click('[data-vista="planta"]');
  await dormir(900);
  await p.screenshot({ path: "docs/projeto-planta.png" });
  await p.click("#d-fechar");
  await dormir(1200);
  await ir(p, "#estudio", 0, 2200);
  await p.screenshot({ path: "docs/estudio.png" });
  await ir(p, "#processo", 0);
  await p.click("#t3");
  await dormir(1300);
  await p.screenshot({ path: "docs/processo.png" });
  await ir(p, "#contato", 0);
  await p.click("#form button[type=submit]");
  await dormir(700);
  await p.screenshot({ path: "docs/formulario.png" });
  await p.close();

  p = await pagina(390, 844, 2);
  await dormir(2600);
  await p.screenshot({ path: "docs/celular-topo.png" });
  await ir(p, ".card:nth-child(3)", 20);
  await p.screenshot({ path: "docs/celular-projetos.png" });
  await p.close();

  // GIF: da capa à planta de um projeto e à validação do formulário
  p = await pagina(1240, 760);
  const tempos = [];
  let gravando = true;
  const t0 = Date.now();
  const laco = (async () => {
    let n = 0;
    while (gravando) {
      const t = Date.now() - t0;
      try { await p.screenshot({ path: `tmp/quadros/f${String(n).padStart(4, "0")}.png` }); } catch { break; }
      tempos.push(t);
      n++;
    }
  })();
  await dormir(3200);
  await ir(p, "#manifesto", 0, 1800);
  await ir(p, "#projetos", 20, 1400);
  await p.click('[data-cat="Cultural"]'); await dormir(1200);
  await p.click('[data-cat="Urbano"]'); await dormir(1200);
  await p.click('[data-cat="Todos"]'); await dormir(900);
  await p.hover(".card a"); await dormir(700);
  await p.click(".card a"); await dormir(1800);
  await p.click('[data-vista="planta"]'); await dormir(1800);
  await p.click("#d-prox"); await dormir(1600);
  await p.click("#d-fechar"); await dormir(1400);
  await ir(p, "#processo", 0, 1000);
  await p.click("#t2"); await dormir(1100);
  await p.click("#t3"); await dormir(1100);
  await p.click("#t4"); await dormir(1200);
  await ir(p, "#contato", 0, 1000);
  await p.click("#form button[type=submit]"); await dormir(1500);
  await p.type("#nome", "Ana Souza", { delay: 45 });
  await p.type("#email", "ana@exemplo.com", { delay: 40 });
  await p.select("#tipo", "Reforma");
  await p.type("#mensagem", "Quero reformar a cozinha e a sala juntas.", { delay: 25 });
  await p.click(".marca-check"); await dormir(500);
  await p.click("#form button[type=submit]"); await dormir(2600);
  gravando = false;
  await laco;
  writeFileSync("tmp/quadros/tempos.json", JSON.stringify(tempos));
  console.log("quadros:", tempos.length, "duração (s):", ((Date.now() - t0) / 1000).toFixed(1));
  await p.close();
  if (erros.length) console.log("ERROS NO SITE", erros);
} catch (e) {
  console.log("FALHA:", e.message);
  process.exitCode = 1;
} finally {
  await navegador.close();
  servidor.kill();
}
