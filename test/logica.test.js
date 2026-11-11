import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATEGORIAS, PROJETOS, achar, contar, filtrar, slugDaRota, vizinhos } from "../site/js/projetos.js";
import { dimensoes, faces, limites, ordenar, plantaSVG, projetar, salasDaPlanta, volumeSVG } from "../site/js/desenho.js";
import { digitos, formatarTelefone, validar, validarCampo } from "../site/js/validacao.js";

describe("projetos e filtro", () => {
  it("slugs são únicos e toda categoria tem projeto", () => {
    assert.equal(new Set(PROJETOS.map((p) => p.slug)).size, PROJETOS.length);
    for (const c of CATEGORIAS) assert.ok(contar(c) >= 1, c);
  });
  it("filtrar devolve só a categoria pedida, e Todos devolve tudo", () => {
    assert.ok(filtrar("Residencial").every((p) => p.cat === "Residencial"));
    assert.equal(filtrar("Todos").length, PROJETOS.length);
    assert.deepEqual(filtrar("Inexistente"), []);
  });
  it("as contagens por categoria somam o total", () => {
    assert.equal(CATEGORIAS.reduce((s, c) => s + contar(c), 0), PROJETOS.length);
  });
  it("vizinhos são circulares", () => {
    assert.equal(vizinhos(PROJETOS[0].slug).anterior, PROJETOS.at(-1));
    assert.equal(vizinhos(PROJETOS.at(-1).slug).proximo, PROJETOS[0]);
    assert.equal(vizinhos("nada"), null);
  });
  it("a rota só aceita projeto que existe", () => {
    assert.equal(slugDaRota("#/projeto/casa-patio"), "casa-patio");
    assert.equal(slugDaRota("#/projeto/nao-existe"), null);
    assert.equal(slugDaRota("#contato"), null);
    assert.equal(slugDaRota(undefined), null);
    assert.equal(achar("casa-patio").nome, "Casa Pátio");
  });
});

describe("desenho técnico", () => {
  it("a projeção isométrica coloca o eixo z para cima e x para a direita", () => {
    assert.deepEqual(projetar(0, 0, 0), [0, 0]);
    const [x, y] = projetar(10, 0, 0);
    assert.ok(x > 0 && y > 0);
    assert.ok(projetar(0, 0, 5)[1] < 0);
  });
  it("pinta o fundo antes da frente", () => {
    const ord = ordenar([[5, 5, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1]]);
    assert.equal(ord[0][0], 0);
  });
  it("cada caixa tem três faces visíveis com quatro pontos", () => {
    const f = faces([0, 0, 0, 2, 3, 4]);
    assert.deepEqual(Object.keys(f), ["topo", "esquerda", "direita"]);
    for (const v of Object.values(f)) assert.equal(v.length, 4);
  });
  it("os limites contêm todas as caixas de todos os projetos", () => {
    for (const p of PROJETOS) {
      const [x0, y0, x1, y1] = limites(p.caixas);
      assert.ok(x1 > x0 && y1 > y0, p.slug);
    }
  });
  it("monta a planta: ambientes ocupam toda a largura e as linhas têm a mesma largura", () => {
    for (const p of PROJETOS) {
      const larguras = p.planta.map(([, amb]) => amb.reduce((s, [l]) => s + l, 0));
      assert.ok(larguras.every((l) => l === larguras[0]), `${p.slug}: ${larguras}`);
    }
    const salas = salasDaPlanta([[4, [[3, "A"], [2, "B"]]], [2, [[5, "C"]]]]);
    assert.deepEqual(salas.map((s) => [s.x, s.y, s.w, s.h]), [[0, 0, 3, 4], [3, 0, 2, 4], [0, 4, 5, 2]]);
    assert.deepEqual(dimensoes([[4, [[3, "A"], [2, "B"]]], [2, [[5, "C"]]]]), { w: 5, h: 6 });
  });
  it("gera SVG com rótulo acessível", () => {
    const p = PROJETOS[0];
    assert.match(volumeSVG(p.caixas, { rotulo: "teste" }), /role="img" aria-label="teste"/);
    const planta = plantaSVG(p.planta);
    assert.match(planta, /<svg[^>]*role="img"/);
    assert.match(planta, /Sala/);
    assert.match(planta, /14/); // cota da largura
  });
});

describe("validação do formulário", () => {
  const ok = { nome: "Ana Souza", email: "ana@exemplo.com", telefone: "", tipo: "Reforma", area: "", mensagem: "Quero reformar a cozinha e a sala juntas.", aceite: true };
  it("aceita um formulário correto, com opcionais em branco", () => {
    assert.deepEqual(validar(ok), {});
  });
  it("aponta todos os campos obrigatórios vazios", () => {
    const erros = validar({ nome: "", email: "", telefone: "", tipo: "", area: "", mensagem: "", aceite: false });
    assert.deepEqual(Object.keys(erros).sort(), ["aceite", "email", "mensagem", "nome", "tipo"]);
  });
  it("e-mail: recusa formatos quebrados", () => {
    for (const e of ["ana", "ana@", "ana@x", "@x.com", "ana @x.com", "a@b.c"]) assert.notEqual(validarCampo("email", e), "", e);
    assert.equal(validarCampo("email", "a@b.co"), "");
  });
  it("telefone: opcional, mas com 10 ou 11 dígitos quando preenchido", () => {
    assert.equal(validarCampo("telefone", ""), "");
    assert.equal(validarCampo("telefone", "(41) 99999-1234"), "");
    assert.equal(validarCampo("telefone", "(41) 3333-1234"), "");
    assert.notEqual(validarCampo("telefone", "12345"), "");
  });
  it("formata telefone enquanto digita", () => {
    assert.equal(formatarTelefone("41999991234"), "(41) 99999-1234");
    assert.equal(formatarTelefone("4133331234"), "(41) 3333-1234");
    assert.equal(formatarTelefone("419"), "(41) 9");
    assert.equal(digitos("(41) 9"), "419");
  });
  it("área: entre 10 e 100.000, aceita vírgula", () => {
    assert.equal(validarCampo("area", "250,5"), "");
    for (const a of ["5", "abc", "100001", "-3"]) assert.notEqual(validarCampo("area", a), "", a);
  });
  it("mensagem: mínimo de 20 e máximo de 1200 caracteres", () => {
    assert.match(validarCampo("mensagem", "curta"), /faltam 15/);
    assert.equal(validarCampo("mensagem", "x".repeat(20)), "");
    assert.match(validarCampo("mensagem", "x".repeat(1201)), /Máximo/);
  });
  it("tipo só aceita as opções do formulário", () => {
    assert.notEqual(validarCampo("tipo", "Foguete"), "");
  });
});
