// Desenhos técnicos em SVG gerados a partir dos dados: axonométrica (volumes) e planta baixa.

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

/** Projeção axonométrica (isométrica) de um ponto 3D em metros. */
export function projetar(x, y, z, escala = 1) {
  return [(x - y) * COS * escala, ((x + y) * SIN - z) * escala];
}

const n2 = (v) => Math.round(v * 100) / 100;
const pts = (lista) => lista.map(([a, b]) => `${n2(a)},${n2(b)}`).join(" ");

/** Ordem de pintura: do fundo para a frente (mais afastado do observador primeiro). */
export function ordenar(caixas) {
  // A vem antes de B se um plano separa as duas caixas com A do lado do fundo.
  const antes = (a, b) => a[0] + a[3] <= b[0] || a[1] + a[4] <= b[1] || a[2] + a[5] <= b[2];
  const restantes = [...caixas].sort((a, b) => chave(a) - chave(b));
  const saida = [];
  while (restantes.length) {
    let i = restantes.findIndex((c) => restantes.every((o) => o === c || !antes(o, c) || antes(c, o)));
    if (i < 0) i = 0; // ciclo (caixas que se interpenetram): cai na ordem por profundidade
    saida.push(restantes.splice(i, 1)[0]);
  }
  return saida;
}
function chave([x, y, z, w, d, h]) {
  return x + y + z * 1.2 + (w + d + h) / 2;
}

/** Faces visíveis de uma caixa, já em coordenadas de tela. */
export function faces([x, y, z, w, d, h], escala = 1) {
  const p = (a, b, c) => projetar(a, b, c, escala);
  return {
    topo: [p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)],
    esquerda: [p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x, y + d, z + h)],
    direita: [p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x + w, y, z + h)],
  };
}

/** Retângulo [minX, minY, maxX, maxY] que contém todas as caixas, na tela. */
export function limites(caixas, escala = 1) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const c of caixas) {
    for (const f of Object.values(faces(c, escala))) {
      for (const [px, py] of f) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
    }
  }
  return [x0, y0, x1, y1];
}

/** SVG da axonométrica. `animar` liga o traçado progressivo das linhas. */
export function volumeSVG(caixas, { escala = 14, margem = 14, animar = false, rotulo = "Axonometria do projeto" } = {}) {
  const [x0, y0, x1, y1] = limites(caixas, escala);
  const larg = x1 - x0 + margem * 2;
  const alt = y1 - y0 + margem * 2;
  let i = 0;
  const corpo = ordenar(caixas).map((c) => {
    const f = faces(c, escala);
    const destaque = c[6] ? " destaque" : "";
    const ordem = () => (animar ? ` style="--i:${i++}"` : "");
    return `<g class="vol${destaque}">` +
      `<polygon class="f-esq" points="${pts(f.esquerda)}" pathLength="1"${ordem()}/>` +
      `<polygon class="f-dir" points="${pts(f.direita)}" pathLength="1"${ordem()}/>` +
      `<polygon class="f-topo" points="${pts(f.topo)}" pathLength="1"${ordem()}/></g>`;
  }).join("");
  const solo = `<ellipse class="sombra" cx="${n2(0)}" cy="${n2(y1 + margem / 2)}" rx="0" ry="0"/>`;
  return `<svg class="desenho vol-svg${animar ? " traca" : ""}" viewBox="${n2(x0 - margem)} ${n2(y0 - margem)} ${n2(larg)} ${n2(alt)}" role="img" aria-label="${rotulo}" preserveAspectRatio="xMidYMid meet">${solo}${corpo}</svg>`;
}

/** Converte linhas de ambientes em retângulos { x, y, w, h, nome, linha }. */
export function salasDaPlanta(linhas) {
  const salas = [];
  let y = 0;
  linhas.forEach(([altura, ambientes], linha) => {
    let x = 0;
    for (const [largura, nome] of ambientes) {
      salas.push({ x, y, w: largura, h: altura, nome, linha });
      x += largura;
    }
    y += altura;
  });
  return salas;
}

/** Largura e altura totais da planta, em metros. */
export function dimensoes(linhas) {
  const salas = salasDaPlanta(linhas);
  return { w: Math.max(...salas.map((s) => s.x + s.w)), h: Math.max(...salas.map((s) => s.y + s.h)) };
}

const fmt = (v) => String(Math.round(v * 100) / 100).replace(".", ",");

/** SVG da planta baixa com paredes, portas, nomes dos ambientes e cotas. */
export function plantaSVG(linhas, { escala = 22, rotulo = "Planta baixa do projeto" } = {}) {
  const { w, h } = dimensoes(linhas);
  const salas = salasDaPlanta(linhas);
  const m = 34; // margem para cotas
  const S = escala;
  const largura = w * S + m * 2;
  const altura = h * S + m * 2;
  let svg = `<svg class="desenho planta-svg" viewBox="0 0 ${n2(largura)} ${n2(altura)}" role="img" aria-label="${rotulo}" preserveAspectRatio="xMidYMid meet"><g transform="translate(${m} ${m})">`;
  for (const s of salas) {
    svg += `<rect class="sala" x="${n2(s.x * S)}" y="${n2(s.y * S)}" width="${n2(s.w * S)}" height="${n2(s.h * S)}"/>`;
  }
  // portas: nas linhas de baixo, abertura no muro de cima; na primeira linha, no muro de baixo
  for (const s of salas) {
    const na_borda_de_cima = s.linha > 0;
    const px = (s.x + 0.35) * S;
    const py = (na_borda_de_cima ? s.y : s.y + s.h) * S;
    const r = 0.9 * S;
    const sentido = na_borda_de_cima ? 1 : -1;
    svg += `<line class="vao" x1="${n2(px)}" y1="${n2(py)}" x2="${n2(px + r)}" y2="${n2(py)}"/>`;
    svg += `<path class="porta" d="M ${n2(px)} ${n2(py)} L ${n2(px)} ${n2(py + sentido * r)} M ${n2(px + r)} ${n2(py)} A ${n2(r)} ${n2(r)} 0 0 ${na_borda_de_cima ? 1 : 0} ${n2(px)} ${n2(py + sentido * r)}"/>`;
  }
  svg += `<rect class="parede" x="0" y="0" width="${n2(w * S)}" height="${n2(h * S)}"/>`;
  for (const s of salas) {
    svg += `<text class="nome-sala" x="${n2((s.x + s.w / 2) * S)}" y="${n2((s.y + s.h / 2) * S + 4)}" text-anchor="middle">${s.nome}</text>`;
    svg += `<text class="area-sala" x="${n2((s.x + s.w / 2) * S)}" y="${n2((s.y + s.h / 2) * S + 18)}" text-anchor="middle">${fmt(s.w * s.h)} m²</text>`;
  }
  // cotas
  svg += `<g class="cota"><line x1="0" y1="${-14}" x2="${n2(w * S)}" y2="${-14}"/><line x1="0" y1="-19" x2="0" y2="-9"/><line x1="${n2(w * S)}" y1="-19" x2="${n2(w * S)}" y2="-9"/>` +
    `<text x="${n2((w * S) / 2)}" y="-20" text-anchor="middle">${fmt(w)}</text>` +
    `<line x1="${-14}" y1="0" x2="${-14}" y2="${n2(h * S)}"/><line x1="-19" y1="0" x2="-9" y2="0"/><line x1="-19" y1="${n2(h * S)}" x2="-9" y2="${n2(h * S)}"/>` +
    `<text transform="translate(-20 ${n2((h * S) / 2)}) rotate(-90)" text-anchor="middle">${fmt(h)}</text></g>`;
  return svg + "</g></svg>";
}
