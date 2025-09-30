// Recebe dados do background/content
browser.runtime.sendMessage({ action: "getReport" }).then((dados) => {
  if (!dados) {
    console.warn("Nenhum dado recebido, usando valores padrão");
    mostrarDadosPadrao();
    return;
  }

  try {
    // Atualizar informações básicas
    document.getElementById("terceiros").innerText = dados.conexoesTerceiros || 0;
    document.getElementById("hijack").innerText = dados.hijacking ? "Sim" : "Não";
    document.getElementById("storage").innerText = dados.localStorage ? "Sim" : "Não";
    document.getElementById("cookies1p").innerText = dados.cookiesPrimeiraParte || 0;
    document.getElementById("cookies3p").innerText = dados.cookiesTerceiros || 0;
    
    // Contar e mostrar supercookies
    const supercookiesCount = contarSupercookies(dados.supercookiesDetalhes);
    document.getElementById("supercookies").innerText = supercookiesCount;
    
    document.getElementById("canvas").innerText = dados.canvasFingerprint ? "Sim" : "Não";

    // Mostrar lista de conexões se houver
    if (dados.listaConexoesTerceiros && dados.listaConexoesTerceiros.length > 0) {
      const connectionsList = document.getElementById("connectionsList");
      const terceiroValue = document.getElementById("terceiros");
      if (connectionsList && terceiroValue) {
        connectionsList.style.display = "block";
        terceiroValue.style.display = "none"; // Ocultar número quando há lista
        populateConnectionsList(dados.listaConexoesTerceiros);
      }
    }

    // Mostrar detalhes de supercookies se houver
    if (supercookiesCount > 0) {
      const supercookiesList = document.getElementById("supercookiesList");
      const supercookiesValue = document.getElementById("supercookies");
      if (supercookiesList && supercookiesValue) {
        supercookiesList.style.display = "block";
        supercookiesValue.style.display = "none"; // Ocultar número quando há lista
        populateSupercookiesList(dados.supercookiesDetalhes);
      }
    }

    // Calcular e mostrar pontuação
    const resultado = calcularPontuacao(dados);
    document.getElementById("score").innerText = resultado.score + " pontos";
    
    const nivel = document.getElementById("nivel");
    nivel.innerText = resultado.nivel;
    nivel.className = "score-level " + resultado.cor;
    
  } catch (error) {
    console.error("Erro ao atualizar interface:", error);
    mostrarDadosPadrao();
  }
}).catch((error) => {
  console.error("Erro ao obter dados:", error);
  mostrarDadosPadrao();
});

function mostrarDadosPadrao() {
  document.getElementById("terceiros").innerText = "0";
  document.getElementById("hijack").innerText = "Não";
  document.getElementById("storage").innerText = "Não";
  document.getElementById("cookies1p").innerText = "0";
  document.getElementById("cookies3p").innerText = "0";
  document.getElementById("supercookies").innerText = "0";
  document.getElementById("canvas").innerText = "Não";
  document.getElementById("score").innerText = "0 pontos";
  document.getElementById("nivel").innerText = "Excelente";
  document.getElementById("nivel").className = "score-level excelente";
}

function populateConnectionsList(connections) {
  const list = document.getElementById("connectionsList");
  list.innerHTML = "";
  
  // Ordenar conexões alfabeticamente
  const sortedConnections = connections.sort();
  
  sortedConnections.forEach(domain => {
    const item = document.createElement("div");
    item.className = "connection-item";
    item.textContent = domain;
    list.appendChild(item);
  });
}

function contarSupercookies(detalhes) {
  let count = 0;
  if (detalhes.etag) count++;
  if (detalhes.indexedDB) count++;
  if (detalhes.serviceWorker) count++;
  return count;
}

function populateSupercookiesList(detalhes) {
  const list = document.getElementById("supercookiesList");
  list.innerHTML = "";
  
  const tipos = [];
  if (detalhes.etag) tipos.push("ETag");
  if (detalhes.indexedDB) tipos.push("IndexedDB");
  if (detalhes.serviceWorker) tipos.push("Service Worker");
  
  tipos.forEach(tipo => {
    const item = document.createElement("div");
    item.className = "supercookie-item";
    item.textContent = tipo;
    list.appendChild(item);
  });
}
