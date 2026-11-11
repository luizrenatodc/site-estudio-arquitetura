// Validação do formulário de contato. Funções puras: recebem os dados e devolvem as mensagens de erro.

export const TIPOS = ["Casa nova", "Reforma", "Comercial", "Urbano ou paisagismo"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mantém só os dígitos de um telefone. */
export function digitos(t) {
  return String(t ?? "").replace(/\D/g, "");
}

export function formatarTelefone(t) {
  const d = digitos(t).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Valida um campo e devolve a mensagem de erro, ou "" se estiver certo. */
export function validarCampo(nome, valor, dados = {}) {
  const v = String(valor ?? "").trim();
  switch (nome) {
    case "nome":
      if (!v) return "Diga seu nome para a gente saber com quem fala.";
      if (v.length < 3 || !/\s|^\S{3,}$/.test(v)) return "Use pelo menos 3 letras.";
      return "";
    case "email":
      if (!v) return "Informe um e-mail para a resposta.";
      return EMAIL.test(v) ? "" : "Esse e-mail parece incompleto (exemplo: voce@dominio.com).";
    case "telefone":
      if (!v) return "";
      return [10, 11].includes(digitos(v).length) ? "" : "Telefone com DDD, 10 ou 11 números.";
    case "tipo":
      return TIPOS.includes(v) ? "" : "Escolha o tipo de projeto.";
    case "area": {
      if (!v) return "";
      const n = Number(v.replace(",", "."));
      return Number.isFinite(n) && n >= 10 && n <= 100000 ? "" : "Informe uma área entre 10 e 100.000 m².";
    }
    case "mensagem":
      if (!v) return "Conte um pouco sobre o que você imagina.";
      return v.length >= 20 ? (v.length <= 1200 ? "" : "Máximo de 1.200 caracteres.") : `Escreva mais um pouco (faltam ${20 - v.length} caracteres).`;
    case "aceite":
      return dados.aceite === true || valor === true ? "" : "É preciso concordar para enviarmos a resposta.";
    default:
      return "";
  }
}

export const CAMPOS = ["nome", "email", "telefone", "tipo", "area", "mensagem", "aceite"];

/** Valida o formulário todo. Devolve { campo: mensagem } só com os campos que têm erro. */
export function validar(dados) {
  const erros = {};
  for (const c of CAMPOS) {
    const e = validarCampo(c, dados[c], dados);
    if (e) erros[c] = e;
  }
  return erros;
}
