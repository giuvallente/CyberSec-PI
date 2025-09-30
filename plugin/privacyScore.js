// Sistema avançado de pontuação de privacidade
function calcularPontuacao(dados) {
  let score = 0;
  let detalhes = {
    conexoesTerceiros: 0,
    cookies: 0,
    armazenamento: 0,
    fingerprinting: 0,
    seguranca: 0
  };

  // ========== CONEXÕES DE TERCEIROS (0-25 pontos) ==========
  const conexoes = dados.conexoesTerceiros || 0;
  let pontosConexoes = 0;
  if (conexoes > 0) {
    // Escala logarítmica para conexões
    pontosConexoes = Math.min(25, Math.log10(conexoes + 1) * 8);
  }
  detalhes.conexoesTerceiros = pontosConexoes;
  score += pontosConexoes;

  // ========== COOKIES (0-20 pontos) ==========
  const cookies1p = dados.cookiesPrimeiraParte || 0;
  const cookies3p = dados.cookiesTerceiros || 0;
  
  let pontosCookies = 0;
  // Cookies de primeira parte (peso menor)
  pontosCookies += Math.min(5, cookies1p * 0.2);
  // Cookies de terceiros (peso maior)
  pontosCookies += Math.min(15, cookies3p * 0.8);
  
  detalhes.cookies = pontosCookies;
  score += pontosCookies;

  // ========== ARMAZENAMENTO PERSISTENTE (0-25 pontos) ==========
  let pontosArmazenamento = 0;
  
  // localStorage/sessionStorage
  if (dados.localStorage) pontosArmazenamento += 5;
  
  // IndexedDB (mais invasivo)
  if (dados.indexedDB) pontosArmazenamento += 8;
  
  // Service Worker (muito invasivo)
  if (dados.serviceWorker) pontosArmazenamento += 10;
  
  // ETag supercookie
  if (dados.etag) pontosArmazenamento += 6;
  
  detalhes.armazenamento = pontosArmazenamento;
  score += pontosArmazenamento;

  // ========== FINGERPRINTING (0-20 pontos) ==========
  let pontosFingerprint = 0;
  
  // Canvas fingerprinting (muito invasivo)
  if (dados.canvasFingerprint) pontosFingerprint += 15;
  
  // Outros tipos de fingerprinting podem ser adicionados aqui
  // WebGL, AudioContext, etc.
  
  detalhes.fingerprinting = pontosFingerprint;
  score += pontosFingerprint;

  // ========== SEGURANÇA/HIJACKING (0-15 pontos) ==========
  let pontosSeguranca = 0;
  
  // Hijacking de APIs (muito perigoso)
  if (dados.hijacking) pontosSeguranca += 15;
  
  detalhes.seguranca = pontosSeguranca;
  score += pontosSeguranca;

  // ========== CATEGORIZAÇÃO REFINADA ==========
  let nivel, cor, descricao;
  
  if (score <= 10) {
    nivel = "Excelente";
    cor = "excelente";
    descricao = "Site muito respeitoso com privacidade";
  } else if (score <= 25) {
    nivel = "Bom";
    cor = "bom";
    descricao = "Nível aceitável de tracking";
  } else if (score <= 45) {
    nivel = "Moderado";
    cor = "moderado";
    descricao = "Tracking moderado detectado";
  } else if (score <= 70) {
    nivel = "Alto";
    cor = "alto";
    descricao = "Alto nível de tracking";
  } else {
    nivel = "Crítico";
    cor = "critico";
    descricao = "Tracking muito invasivo detectado";
  }

  return { 
    score: Math.round(score), 
    nivel, 
    cor,
    descricao,
    detalhes,
    porcentagem: Math.min(100, Math.round((score / 100) * 100))
  };
}

// Função para gerar relatório detalhado
function gerarRelatorioDetalhado(dados) {
  const resultado = calcularPontuacao(dados);
  
  let relatorio = [];
  
  // Conexões de terceiros
  if (dados.conexoesTerceiros > 0) {
    relatorio.push({
      categoria: "Conexões de Terceiros",
      valor: dados.conexoesTerceiros,
      pontos: resultado.detalhes.conexoesTerceiros,
      impacto: dados.conexoesTerceiros > 20 ? "Alto" : dados.conexoesTerceiros > 10 ? "Médio" : "Baixo"
    });
  }
  
  // Cookies
  const totalCookies = (dados.cookiesPrimeiraParte || 0) + (dados.cookiesTerceiros || 0);
  if (totalCookies > 0) {
    relatorio.push({
      categoria: "Cookies",
      valor: `${dados.cookiesPrimeiraParte || 0} (1ª) + ${dados.cookiesTerceiros || 0} (3ª)`,
      pontos: resultado.detalhes.cookies,
      impacto: dados.cookiesTerceiros > 10 ? "Alto" : dados.cookiesTerceiros > 5 ? "Médio" : "Baixo"
    });
  }
  
  // Armazenamento
  const tiposArmazenamento = [];
  if (dados.localStorage) tiposArmazenamento.push("localStorage");
  if (dados.indexedDB) tiposArmazenamento.push("IndexedDB");
  if (dados.serviceWorker) tiposArmazenamento.push("Service Worker");
  if (dados.etag) tiposArmazenamento.push("ETag");
  
  if (tiposArmazenamento.length > 0) {
    relatorio.push({
      categoria: "Armazenamento Persistente",
      valor: tiposArmazenamento.join(", "),
      pontos: resultado.detalhes.armazenamento,
      impacto: resultado.detalhes.armazenamento > 15 ? "Alto" : resultado.detalhes.armazenamento > 8 ? "Médio" : "Baixo"
    });
  }
  
  // Fingerprinting
  if (dados.canvasFingerprint) {
    relatorio.push({
      categoria: "Fingerprinting",
      valor: "Canvas detectado",
      pontos: resultado.detalhes.fingerprinting,
      impacto: "Alto"
    });
  }
  
  // Segurança
  if (dados.hijacking) {
    relatorio.push({
      categoria: "Segurança",
      valor: "Hijacking de APIs detectado",
      pontos: resultado.detalhes.seguranca,
      impacto: "Crítico"
    });
  }
  
  return relatorio;
}
