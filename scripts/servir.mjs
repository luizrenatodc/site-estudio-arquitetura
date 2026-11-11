// Servidor estático mínimo para ver o site localmente (módulos ES exigem http, não file://).
// Uso: npm start   (porta 8080, ou PORT=3000 npm start)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../site", import.meta.url));
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".ico": "image/x-icon" };
const porta = Number(process.env.PORT ?? 8080);

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  let rel;
  try {
    rel = normalize(decodeURIComponent(url.pathname));
  } catch {
    // escape inválido na URL (ex.: /%E0%A4%A): sem este catch a exceção derrubava o processo
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" }).end("caminho inválido");
    return;
  }
  if (rel.endsWith("/") || rel.endsWith("\\")) rel += "index.html";
  if (rel.includes("..") || rel.includes("\0")) { res.writeHead(400, { "content-type": "text/plain; charset=utf-8" }).end("caminho inválido"); return; }
  try {
    const dados = await readFile(join(raiz, rel));
    res.writeHead(200, { "content-type": tipos[extname(rel)] ?? "application/octet-stream", "cache-control": "no-cache", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin" }).end(dados);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("não encontrado");
  }
}).listen(porta, () => console.log(`Vao Arquitetura em http://localhost:${porta}`));
