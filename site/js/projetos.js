// Dados dos projetos (fictícios) e funções puras de consulta. Sem acesso ao DOM, para poder testar.
// Volumes: caixas [x, y, z, largura, profundidade, altura, destaque?] em metros.
// Planta: linhas de ambientes [altura da linha, [[largura, "Nome"], ...]].

export const CATEGORIAS = ["Residencial", "Cultural", "Comercial", "Urbano"];

export const PROJETOS = [
  {
    slug: "casa-ripado", nome: "Casa Ripado", cat: "Residencial", ano: 2023, local: "Atibaia, SP", area: 380, fase: "Construída",
    resumo: "Um volume superior em balanço sobre o térreo recuado, filtrado por um plano de ripas de cumaru.",
    texto: "A casa nasce de uma pergunta simples: como receber o sol da manhã sem abrir mão da privacidade? O andar de cima avança sobre o jardim e o ripado desenha a sombra do dia na sala.",
    programa: "3 suítes, estar integrado, varanda e deck", clienteFicticio: "Família Andrade",
    caixas: [[0, 0, 0, 14, 9, 3.2], [3, 1, 3.2, 11, 7, 3], [14, 2, 0, 7, 6, 0.5], [2, 9, 0, 8, 0.4, 6.2, 1]],
    planta: [[4.5, [[5, "Sala"], [4, "Cozinha"], [5, "Varanda"]]], [4.5, [[4, "Suíte"], [5, "Quarto"], [5, "Estar"]]]],
  },
  {
    slug: "biblioteca-do-rio", nome: "Biblioteca do Rio", cat: "Cultural", ano: 2022, local: "Joinville, SC", area: 1850, fase: "Construída",
    resumo: "Uma biblioteca de bairro com lanternim central que leva luz natural ao acervo.",
    texto: "O acervo fica no miolo, protegido; as salas de leitura e o café se abrem para o pátio. O lanternim funciona como relógio: a luz percorre as estantes ao longo do dia.",
    programa: "Acervo, leitura, auditório, oficinas e café", clienteFicticio: "Prefeitura (cliente fictício)",
    caixas: [[0, 0, 0, 20, 10, 4], [6, 2, 4, 8, 6, 3], [-2, 0, 0, 2, 10, 0.6, 1]],
    planta: [[6, [[8, "Acervo"], [7, "Leitura"], [5, "Café"]]], [4, [[6, "Auditório"], [6, "Oficina"], [8, "Pátio"]]]],
  },
  {
    slug: "edificio-lume", nome: "Edifício Lume", cat: "Residencial", ano: 2024, local: "Curitiba, PR", area: 2400, fase: "Em obra",
    resumo: "Quatro pavimentos que se deslocam para criar varandas profundas e ventilação cruzada.",
    texto: "Cada andar recua ou avança um metro em relação ao vizinho. O resultado são varandas generosas e uma fachada que muda de ritmo sem precisar de enfeite.",
    programa: "16 apartamentos, térreo comercial, bicicletário", clienteFicticio: "Incorporadora Lume",
    caixas: [[0, 0, 0, 10, 8, 3], [1, 0, 3, 9, 8, 3], [0, 0, 6, 10, 8, 3], [1, 0, 9, 9, 8, 3, 1]],
    planta: [[4, [[5, "Sala"], [5, "Cozinha"]]], [4, [[3, "Quarto 1"], [3.5, "Quarto 2"], [3.5, "Banho"]]]],
  },
  {
    slug: "pavilhao-ceramica", nome: "Pavilhão Cerâmica", cat: "Cultural", ano: 2021, local: "Cunha, SP", area: 640, fase: "Construída",
    resumo: "Uma cobertura leve sobre pilares finos abriga forno, ateliê e loja de uma cooperativa.",
    texto: "A laje de cobertura flutua sobre pilares de seção mínima. Sob ela, o forno a lenha, o ateliê e a loja dividem o mesmo chão, sem paredes entre eles.",
    programa: "Forno comunitário, ateliê, loja e depósito", clienteFicticio: "Cooperativa Barro Vivo",
    caixas: [[0, 0, 0, 16, 8, 0.5], [0, 0, 0.5, 0.6, 0.6, 3], [15.4, 0, 0.5, 0.6, 0.6, 3], [0, 7.4, 0.5, 0.6, 0.6, 3], [15.4, 7.4, 0.5, 0.6, 0.6, 3], [-1, -1, 3.5, 18, 10, 0.4, 1]],
    planta: [[8, [[6, "Forno"], [5, "Ateliê"], [5, "Loja"]]]],
  },
  {
    slug: "praca-nascente", nome: "Praça Nascente", cat: "Urbano", ano: 2023, local: "Londrina, PR", area: 5200, fase: "Construída",
    resumo: "Uma praça em degraus que recupera a nascente do córrego e devolve o bairro à sombra.",
    texto: "As plataformas acompanham o desnível natural e viram arquibancada, palco e mesa de piquenique. A pérgola marca o ponto de encontro e conduz o olhar até a água.",
    programa: "Anfiteatro, bosque, horta comunitária e quiosque", clienteFicticio: "Associação de Moradores",
    caixas: [[0, 0, 0, 16, 16, 0.4], [2, 2, 0.4, 8, 8, 0.6], [4, 4, 1, 4, 4, 0.6], [10, 10, 0.4, 0.4, 0.4, 2.8], [14.6, 10, 0.4, 0.4, 0.4, 2.8], [10, 14.6, 0.4, 0.4, 0.4, 2.8], [10, 10, 3.2, 5, 5, 0.3, 1]],
    planta: [[8, [[8, "Anfiteatro"], [8, "Bosque"]]], [8, [[5, "Quiosque"], [6, "Fonte"], [5, "Horta"]]]],
  },
  {
    slug: "escritorio-trama", nome: "Escritório Trama", cat: "Comercial", ano: 2022, local: "São Paulo, SP", area: 920, fase: "Construída",
    resumo: "Sede de uma agência criativa em dois níveis, com um terraço-sala de reunião em balanço.",
    texto: "O térreo é público e aberto; o andar de cima é mais recolhido. Um bloco em balanço, pintado de terracota, abriga a sala de reunião com vista para a rua.",
    programa: "Recepção, estúdio, salas de reunião e copa", clienteFicticio: "Agência Trama",
    caixas: [[0, 0, 0, 18, 9, 3.5], [0, 0, 3.5, 12, 9, 3], [12, 3, 3.5, 6, 6, 3, 1]],
    planta: [[5, [[6, "Recepção"], [6, "Estúdio"], [6, "Reunião"]]], [4, [[9, "Open space"], [5, "Copa"], [4, "WC"]]]],
  },
  {
    slug: "casa-patio", nome: "Casa Pátio", cat: "Residencial", ano: 2020, local: "Tiradentes, MG", area: 260, fase: "Construída",
    resumo: "Uma casa em U que abraça um pátio central e faz dele a principal sala da família.",
    texto: "Todos os cômodos olham para dentro. O pátio de terra batida recebe a figueira, a chuva e o domingo; a rua enxerga apenas uma parede cega e uma porta.",
    programa: "2 suítes, 2 quartos, sala, cozinha e pátio", clienteFicticio: "Casal Ribeiro",
    caixas: [[0, 0, 0, 12, 4, 3.2], [0, 4, 0, 4, 8, 3.2], [8, 4, 0, 4, 8, 3.2], [4, 4, 0, 4, 8, 0.2, 1]],
    planta: [[4, [[4, "Sala"], [4, "Cozinha"], [4, "Jantar"]]], [8, [[4, "Suíte"], [4, "Pátio"], [4, "Quartos"]]]],
  },
  {
    slug: "mercado-cobogo", nome: "Mercado Cobogó", cat: "Urbano", ano: 2024, local: "Recife, PE", area: 1400, fase: "Em projeto",
    resumo: "Um mercado coberto de feira livre, com cobogós que ventilam as bancas sem molhar o chão.",
    texto: "A cobertura é ampla e baixa, como um guarda-chuva de bairro. Os cobogós de concreto deixam o vento atravessar e desenham, no piso, a mesma trama que a feira já tinha.",
    programa: "Bancas, hortifrúti, café, cozinha coletiva e praça", clienteFicticio: "Prefeitura (cliente fictício)",
    caixas: [[0, 0, 0, 20, 12, 0.3], [0, 0, 0.3, 20, 0.5, 2.7], [0, 11.5, 0.3, 20, 0.5, 2.7], [-1, -1, 3, 22, 14, 0.3, 1]],
    planta: [[6, [[7, "Bancas"], [7, "Hortifrúti"], [6, "Peixaria"]]], [6, [[6, "Café"], [8, "Praça de feira"], [6, "Cozinha"]]]],
  },
];

/** Projetos da categoria (ou todos). Categoria desconhecida devolve lista vazia. */
export function filtrar(cat = "Todos") {
  if (cat === "Todos") return [...PROJETOS];
  return PROJETOS.filter((p) => p.cat === cat);
}

export function contar(cat) {
  return filtrar(cat).length;
}

export function achar(slug) {
  return PROJETOS.find((p) => p.slug === slug) ?? null;
}

/** Projeto anterior e seguinte na lista inteira (circular). */
export function vizinhos(slug) {
  const i = PROJETOS.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  const n = PROJETOS.length;
  return { anterior: PROJETOS[(i - 1 + n) % n], proximo: PROJETOS[(i + 1) % n] };
}

/** Lê "#/projeto/slug" e devolve o slug, ou null. */
export function slugDaRota(hash) {
  const m = /^#\/projeto\/([a-z0-9-]+)$/.exec(hash ?? "");
  return m && achar(m[1]) ? m[1] : null;
}
