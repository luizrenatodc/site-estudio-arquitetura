import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PARES } from "./pares.js";

const css = readFileSync(new URL("../site/css/estilo.css", import.meta.url), "utf-8");
const raizCss = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
/** Cores definidas em :root (--nome: #rrggbb). */
const cor = Object.fromEntries([...raizCss.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Razão de contraste da WCAG 2.x. */
function razao(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe("contraste das cores do site (WCAG AA, 4,5:1 para texto)", () => {
  it("as cores do :root foram lidas", () => {
    assert.ok(Object.keys(cor).length >= 6);
  });
  for (const [frente, fundo, minimo = 4.5] of PARES) {
    it(`${frente} sobre ${fundo} tem pelo menos ${minimo}:1`, () => {
      assert.ok(cor[frente] && cor[fundo], `cor ausente: ${frente} ou ${fundo}`);
      const r = razao(cor[frente], cor[fundo]);
      assert.ok(r >= minimo, `${frente} (${cor[frente]}) sobre ${fundo} (${cor[fundo]}): ${r.toFixed(2)}:1`);
    });
  }
});
