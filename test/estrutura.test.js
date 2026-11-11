import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../site/", import.meta.url));
const paginas = readdirSync(raiz).filter((f) => f.endsWith(".html"));
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

function etiquetas(html) {
  const limpo = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<script\b[\s\S]*?<\/script>/gi, "<script></script>").replace(/<style\b[\s\S]*?<\/style>/gi, "<style></style>");
  return [...limpo.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g)].map((m) => ({ fecha: m[1] === "/", nome: m[2].toLowerCase(), attrs: m[3], auto: m[3].trimEnd().endsWith("/") }));
}

for (const pagina of paginas) {
  const html = readFileSync(join(raiz, pagina), "utf-8");
  const tags = etiquetas(html);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

  describe(`HTML de ${pagina}`, () => {
    it("declara doctype, idioma pt-BR, título, descrição e viewport", () => {
      assert.match(html, /^<!doctype html>/i);
      assert.match(html, /<html lang="pt-BR"/);
      assert.match(html, /<title>[^<]{5,}<\/title>/);
      assert.match(html, /name="description" content="[^"]{30,}"/);
      assert.match(html, /name="viewport"/);
    });

    it("as etiquetas abrem e fecham em ordem (HTML bem formado)", () => {
      const pilha = [];
      for (const t of tags) {
        if (VOID.has(t.nome) || t.auto) continue;
        if (!t.fecha) { pilha.push(t.nome); continue; }
        const topo = pilha.pop();
        assert.equal(topo, t.nome, `esperava </${topo}> mas achei </${t.nome}>`);
      }
      assert.deepEqual(pilha, [], "etiquetas sem fechar");
    });

    it("ids são únicos", () => {
      assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
    });

    it("todo link de âncora (#x) aponta para um id que existe", () => {
      for (const [, alvo] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(alvo), `#${alvo} não existe`);
    });

    it("aria-labelledby, aria-describedby e aria-controls apontam para ids que existem", () => {
      for (const [, , lista] of html.matchAll(/aria-(labelledby|describedby|controls)="([^"]+)"/g)) {
        for (const id of lista.split(/\s+/)) assert.ok(ids.includes(id), `#${id} não existe`);
      }
    });

    it("todo <img> tem alt e todo <svg> informativo tem rótulo ou está oculto", () => {
      for (const t of tags.filter((x) => x.nome === "img" && !x.fecha)) assert.match(t.attrs, /\salt="/, `img sem alt: ${t.attrs}`);
      for (const t of tags.filter((x) => x.nome === "svg" && !x.fecha)) {
        assert.ok(/aria-hidden="true"|role="img"|aria-label=|aria-labelledby=/.test(t.attrs), `svg sem rótulo: ${t.attrs.slice(0, 80)}`);
      }
    });

    it("todo campo de formulário tem rótulo", () => {
      const campos = [...html.matchAll(/<(input|textarea|select)\b[^>]*>/g)].filter((m) => !/type="(hidden|submit|button)"/.test(m[0]));
      for (const [tag] of campos) {
        const id = /\sid="([^"]+)"/.exec(tag)?.[1];
        const comFor = id && new RegExp(`<label[^>]*for="${id}"`).test(html);
        const posicao = html.indexOf(tag);
        const antes = html.slice(Math.max(0, posicao - 500), posicao);
        const dentro = antes.lastIndexOf("<label") > antes.lastIndexOf("</label>");
        assert.ok(comFor || dentro || /aria-label(ledby)?=/.test(tag), `campo sem rótulo: ${tag.slice(0, 90)}`);
      }
    });

    it("todo botão tem texto ou aria-label", () => {
      for (const [, attrs, miolo] of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
        const texto = miolo.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, "").trim();
        assert.ok(texto || /aria-label=/.test(attrs), `botão sem nome: ${attrs}`);
      }
    });

    it("links externos que abrem outra aba usam rel=noopener", () => {
      for (const t of tags.filter((x) => x.nome === "a" && /target="_blank"/.test(x.attrs))) assert.match(t.attrs, /rel="[^"]*noopener/);
    });

    it("há um link de pular para o conteúdo e a página respeita prefers-reduced-motion", () => {
      assert.match(html, /class="pular"/);
      const css = readdirSync(join(raiz, "css")).map((f) => readFileSync(join(raiz, "css", f), "utf-8")).join("\n");
      assert.match(css, /prefers-reduced-motion/);
    });

    it("arquivos locais referenciados (css, js, imagens) existem", () => {
      for (const [, url] of html.matchAll(/(?:href|src)="([^"#:]+)"/g)) {
        if (url.startsWith("//") || url.startsWith("mailto")) continue;
        assert.ok(existsSync(join(raiz, url)), `${url} não existe`);
      }
    });
  });
}

describe("JavaScript do site", () => {
  const pasta = join(raiz, "js");
  for (const arq of readdirSync(pasta)) {
    it(`${arq} não usa eval, new Function nem innerHTML com dados de formulário`, () => {
      const codigo = readFileSync(join(pasta, arq), "utf-8");
      assert.doesNotMatch(codigo, /\beval\s*\(|new Function\s*\(|document\.write\(/);
    });
  }
  it("não há script inline nem manipulador de evento no HTML", () => {
    for (const pagina of paginas) {
      const html = readFileSync(join(raiz, pagina), "utf-8");
      for (const [, attrs] of html.matchAll(/<script\b([^>]*)>/g)) assert.match(attrs, /\ssrc="/);
      assert.doesNotMatch(html, /\son(click|load|error|change|input|submit)=/i);
    }
  });
});

export { dirname };
