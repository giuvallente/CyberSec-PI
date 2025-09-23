function calcularPontuacao(dados) {
  let score = 0;

  // Cookies
  score += dados.cookiesTerceiros || 0;

  // LocalStorage
  if (dados.localStorage) score += 2;

  // IndexedDB (supercookie)
  if (dados.indexedDB) score += 2;

  // Service Worker persistente
  if (dados.serviceWorker) score += 2;

  // ETag
  if (dados.etag) score += 2;

  // Canvas fingerprint
  if (dados.canvasFingerprint) score += 3;

  let nivel;
  if (score <= 2) nivel = "Seguro";
  else if (score <= 6) nivel = "Médio";
  else nivel = "Arriscado";

  return { score, nivel };
}
