// Recebe dados do background/content
browser.runtime.sendMessage({ action: "getReport" }).then(dados => {
  document.getElementById("terceiros").innerText = dados.conexoesTerceiros || 0;
  document.getElementById("hijack").innerText = dados.hijacking ? "Detectado" : "Não detectado";
  document.getElementById("storage").innerText = dados.localStorage ? "Usado" : "Não usado";
  document.getElementById("cookies1p").innerText = dados.cookiesPrimeiraParte || 0;
  document.getElementById("cookies3p").innerText = dados.cookiesTerceiros || 0;
  document.getElementById("supercookies").innerText = dados.supercookies ? "Detectado" : "Não detectado";
  document.getElementById("canvas").innerText = dados.canvasFingerprint ? "Detectado" : "Não detectado";

  // Calcular pontuação de privacidade
  const resultado = calcularPontuacao(dados);
  document.getElementById("score").innerText = resultado.score;
  const nivel = document.getElementById("nivel");
  nivel.innerText = resultado.nivel;

  if (resultado.nivel === "Seguro") nivel.className = "seguro";
  if (resultado.nivel === "Médio") nivel.className = "medio";
  if (resultado.nivel === "Arriscado") nivel.className = "arriscado";
});
