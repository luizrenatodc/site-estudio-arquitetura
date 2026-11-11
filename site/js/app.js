import { CATEGORIAS, PROJETOS, achar, contar, filtrar, slugDaRota, vizinhos } from "./projetos.js";
import { plantaSVG, volumeSVG } from "./desenho.js";
import { CAMPOS, formatarTelefone, validar, validarCampo } from "./validacao.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Troca o DOM com transição de visualização quando o navegador sabe fazer; senão, direto. */
function transicao(fn) {
  if (!reduzir && document.startViewTransition) document.startViewTransition(fn);
  else fn();
}

/* ---------- hero ---------- */
$("#hero-desenho").innerHTML = volumeSVG(PROJETOS[0].caixas, { escala: 24, animar: true, rotulo: "Axonometria de uma casa com ripado, desenhada linha a linha" });

/* ---------- cabeçalho ---------- */
const topo = $("#topo");
let ultimoY = 0;
addEventListener("scroll", () => {
  const y = scrollY;
  topo.classList.toggle("escuro", y > 40);
  topo.classList.toggle("oculto", y > ultimoY && y > 400 && !$(".topo nav a:focus-visible"));
  ultimoY = y;
}, { passive: true });

/* ---------- manifesto: palavras acendem conforme a rolagem ---------- */
const mani = $("#manifesto");
mani.innerHTML = mani.textContent.trim().split(/\s+/).map((p) => `<span class="p">${p}</span>`).join(" ");
const palavras = $$(".p", mani);
function acenderManifesto() {
  const r = mani.getBoundingClientRect();
  const prog = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
  const n = Math.round(prog * palavras.length);
  palavras.forEach((p, i) => p.classList.toggle("aceso", i < n));
}
if (reduzir) palavras.forEach((p) => p.classList.add("aceso"));
else { addEventListener("scroll", acenderManifesto, { passive: true }); acenderManifesto(); }

/* ---------- galeria com filtro ---------- */
const grade = $("#grade");
const filtros = $("#filtros");
let categoria = "Todos";
filtros.innerHTML = ["Todos", ...CATEGORIAS].map((c) => `<button type="button" aria-pressed="${c === categoria}" data-cat="${c}">${c}<sup>${contar(c)}</sup></button>`).join("");

function cartao(p, i) {
  const n = String(PROJETOS.indexOf(p) + 1).padStart(2, "0");
  return `<li class="card entrando" style="--n:${i}" data-slug="${p.slug}">
    <a href="#/projeto/${p.slug}" aria-label="${p.nome}, ${p.cat}, ${p.ano}. Abrir projeto">
      <figure><span class="num-proj">${n}</span>${volumeSVG(p.caixas, { escala: 12, rotulo: `Axonometria do projeto ${p.nome}` })}<span class="ver" aria-hidden="true">Ver projeto</span></figure>
      <h3>${p.nome}</h3>
      <div class="meta"><span>${p.cat}</span><span>${p.local} · ${p.ano}</span></div>
    </a></li>`;
}
function desenharGrade() {
  const lista = filtrar(categoria);
  grade.innerHTML = lista.map(cartao).join("");
  $("#contagem").textContent = `${lista.length} ${lista.length === 1 ? "projeto" : "projetos"}${categoria === "Todos" ? "" : " em " + categoria.toLowerCase()}`;
}
filtros.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  categoria = b.dataset.cat;
  $$("button", filtros).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  desenharGrade();
});
grade.addEventListener("pointermove", (e) => {
  const fig = e.target.closest("figure");
  if (!fig) return;
  const r = fig.getBoundingClientRect();
  fig.style.setProperty("--mx", `${e.clientX - r.left + 14}px`);
  fig.style.setProperty("--my", `${e.clientY - r.top + 14}px`);
});
desenharGrade();

/* ---------- detalhe do projeto (rota #/projeto/slug) ---------- */
const det = $("#detalhe");
let vista = "volume";
let aberto = null;
let focoAntes = null;

function preencher(p) {
  const i = PROJETOS.indexOf(p) + 1;
  $("#d-indice").textContent = `${String(i).padStart(2, "0")} / ${String(PROJETOS.length).padStart(2, "0")}`;
  $("#d-meta").textContent = `${p.cat} · ${p.ano}`;
  $("#d-nome").textContent = p.nome;
  $("#d-resumo").textContent = p.resumo;
  $("#d-texto").textContent = p.texto;
  const linhas = [["Local", p.local], ["Área", `${p.area.toLocaleString("pt-BR")} m²`], ["Situação", p.fase], ["Programa", p.programa], ["Cliente", p.clienteFicticio]];
  $("#d-ficha").innerHTML = linhas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  const v = vizinhos(p.slug);
  $("#d-ant").href = `#/projeto/${v.anterior.slug}`;
  $("#d-ant").innerHTML = `<small>← Anterior</small><b>${v.anterior.nome}</b>`;
  $("#d-prox").href = `#/projeto/${v.proximo.slug}`;
  $("#d-prox").innerHTML = `<small>Próximo →</small><b>${v.proximo.nome}</b>`;
  desenharVista(p);
}
function desenharVista(p) {
  $("#d-desenho").innerHTML = vista === "volume"
    ? volumeSVG(p.caixas, { escala: 22, rotulo: `Axonometria do projeto ${p.nome}` })
    : plantaSVG(p.planta, { rotulo: `Planta baixa do projeto ${p.nome}` });
  $$(".alternar button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vista === vista)));
}
$(".alternar").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || !aberto) return;
  vista = b.dataset.vista;
  desenharVista(aberto);
});

function mostrar(slug) {
  const p = achar(slug);
  const fig = $(`.card[data-slug="${slug}"] figure`);
  const estaAberto = !det.hidden;
  if (!estaAberto) focoAntes = document.activeElement;
  const trocar = () => {
    if (fig) fig.style.viewTransitionName = "";
    aberto = p;
    preencher(p);
    det.hidden = false;
    det.scrollTop = 0;
    document.body.classList.add("travado");
    $("#d-fig").style.viewTransitionName = "proj";
    document.title = `${p.nome} · Vão Arquitetura (demonstração)`;
  };
  if (!estaAberto && fig) fig.style.viewTransitionName = "proj";
  transicao(trocar);
  setTimeout(() => $("#d-fechar").focus({ preventScroll: true }), 80);
}
function esconder() {
  const fig = aberto && $(`.card[data-slug="${aberto.slug}"] figure`);
  const fechar = () => {
    $("#d-fig").style.viewTransitionName = "";
    det.hidden = true;
    document.body.classList.remove("travado");
    document.title = "Vão Arquitetura · Estúdio de arquitetura (demonstração)";
    if (fig) fig.style.viewTransitionName = "proj";
  };
  transicao(fechar);
  setTimeout(() => { if (fig) fig.style.viewTransitionName = ""; focoAntes?.focus?.({ preventScroll: true }); aberto = null; }, 700);
}
function rota() {
  const slug = slugDaRota(location.hash);
  if (slug) mostrar(slug);
  else if (!det.hidden) esconder();
}
$("#d-fechar").addEventListener("click", () => {
  if (history.length > 1 && slugDaRota(location.hash)) history.back();
  else location.hash = "#projetos";
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !det.hidden) $("#d-fechar").click();
  if (e.key === "Tab" && !det.hidden) {
    const f = $$("button, a[href]", det).filter((x) => x.offsetParent !== null);
    const [a, z] = [f[0], f.at(-1)];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
});
addEventListener("hashchange", rota);
rota();

/* ---------- contadores do estúdio ---------- */
function contar_(el) {
  const alvo = Number(el.dataset.conta);
  const semSep = "semSep" in el.dataset;
  if (reduzir) return;
  const ini = performance.now();
  const dur = 1600;
  const passo = (t) => {
    const k = Math.min(1, (t - ini) / dur);
    const v = Math.round(alvo * (1 - (1 - k) ** 3));
    el.textContent = semSep ? String(v) : v.toLocaleString("pt-BR");
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* ---------- processo ---------- */
const ETAPAS = {
  1: ["Semana 1 a 3", "Visitamos o terreno em três horários, medimos o sol e ouvimos a rotina de quem vai usar o espaço. Sai daqui um programa de necessidades de uma página."],
  2: ["Semana 4 a 9", "Maquetes de papel e axonometrias à mão. Mostramos três caminhos e escolhemos um com você, sem pressa e sem jargão."],
  3: ["Semana 10 a 22", "Plantas, cortes, detalhes e compatibilização com estrutura e instalações. É o projeto que a obra vai seguir, linha por linha."],
  4: ["Obra", "Visita semanal ao canteiro, reunião com o mestre de obras e ajustes quando a realidade pede. Entregamos com um manual de uso da casa."],
};
const abas = $$("[role=tab]");
function etapa(n, foco) {
  $("#etapa-svg").dataset.etapa = n;
  abas.forEach((a) => { const ativa = a.dataset.etapa === String(n); a.setAttribute("aria-selected", String(ativa)); a.tabIndex = ativa ? 0 : -1; if (ativa && foco) a.focus(); });
  $("#p1").setAttribute("aria-labelledby", `t${n}`);
  $("#etapa-texto").innerHTML = `<p>${ETAPAS[n][1]}</p><span class="rotulo">${ETAPAS[n][0]}</span>`;
}
$(".processo-passos").addEventListener("click", (e) => { const b = e.target.closest("[role=tab]"); if (b) etapa(Number(b.dataset.etapa)); });
$(".processo-passos").addEventListener("keydown", (e) => {
  const atual = Number($("[role=tab][aria-selected=true]").dataset.etapa);
  const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
  if (delta) { e.preventDefault(); etapa(((atual - 1 + delta + 4) % 4) + 1, true); }
});
etapa(1);

/* ---------- revelar ao rolar ---------- */
$$(".estudio-titulo, .principios li, .equipe li, .numeros div, .processo-corpo > *, .contato-corpo > *, .sec-cab, .manifesto .rotulo").forEach((el, i) => { el.classList.add("rv"); el.style.setProperty("--d", `${(i % 4) * 80}ms`); });
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("vis");
  $$("[data-conta]", e.target).forEach(contar_);
  if (e.target.matches("[data-conta]")) contar_(e.target);
  io.unobserve(e.target);
}), { threshold: 0.15 });
$$(".rv").forEach((el) => io.observe(el));

/* ---------- formulário ---------- */
const form = $("#form");
const valores = () => ({ ...Object.fromEntries(CAMPOS.filter((c) => c !== "aceite").map((c) => [c, form.elements[c].value])), aceite: form.elements.aceite.checked });
function mostrarErro(campo, msg) {
  const el = form.elements[campo];
  $(`#erro-${campo}`).textContent = msg;
  if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
}
form.addEventListener("focusout", (e) => {
  const c = e.target.name;
  if (c && CAMPOS.includes(c)) mostrarErro(c, validarCampo(c, c === "aceite" ? e.target.checked : e.target.value, valores()));
});
form.addEventListener("input", (e) => {
  const c = e.target.name;
  if (c === "telefone") e.target.value = formatarTelefone(e.target.value);
  if (c === "mensagem") $("#contador").textContent = `${e.target.value.length} / 1200`;
  if (e.target.getAttribute("aria-invalid")) mostrarErro(c, validarCampo(c, e.target.value, valores()));
});
form.addEventListener("change", (e) => { if (e.target.name === "aceite") mostrarErro("aceite", validarCampo("aceite", e.target.checked, valores())); });
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const erros = validar(valores());
  for (const c of CAMPOS) mostrarErro(c, erros[c] ?? "");
  const resumo = $("#resumo-erros");
  const campos = Object.keys(erros);
  if (campos.length) {
    resumo.hidden = false;
    resumo.textContent = `${campos.length === 1 ? "Há 1 campo para corrigir" : `Há ${campos.length} campos para corrigir`} antes de enviar.`;
    form.elements[campos[0]].focus();
    return;
  }
  resumo.hidden = true;
  const v = valores();
  $("#enviado-texto").textContent = `Obrigado, ${v.nome.trim().split(/\s+/)[0]}. Em um estúdio de verdade, responderíamos para ${v.email.trim()} em até dois dias úteis. Aqui nada saiu do seu navegador.`;
  form.hidden = true;
  $("#enviado").hidden = false;
  $("#enviado").focus();
});
$("#novo").addEventListener("click", () => {
  form.reset();
  $("#contador").textContent = "0 / 1200";
  form.hidden = false;
  $("#enviado").hidden = true;
  form.elements.nome.focus();
});
