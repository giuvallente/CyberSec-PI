// Armazenar dados detectados por aba
let dadosAbas = {};

// Detectar conexões de terceiros
browser.webRequest.onBeforeRequest.addListener(
  details => {
    const url = new URL(details.url);
    const domain = url.hostname;
    console.log("Requisição detectada:", domain);
    
    // Inicializar dados da aba se não existir
    if (!dadosAbas[details.tabId]) {
      dadosAbas[details.tabId] = {
        conexoesTerceiros: new Set(),
        etag: false,
        cookiesPrimeiraParte: 0,
        cookiesTerceiros: 0
      };
    }
    
    // Adicionar domínio de terceiros
    dadosAbas[details.tabId].conexoesTerceiros.add(domain);
  },
  { urls: ["<all_urls>"] }
);

// Monitorar cabeçalhos de resposta para possíveis supercookies via ETag
browser.webRequest.onHeadersReceived.addListener(
  details => {
    const etag = details.responseHeaders.find(h => h.name.toLowerCase() === "etag");
    if (etag) {
      console.warn("ETag detectado (pode ser usado como supercookie):", etag.value);
      if (!dadosAbas[details.tabId]) {
        dadosAbas[details.tabId] = {};
      }
      dadosAbas[details.tabId].etag = true;
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Detectar cookies por aba
async function detectarCookies(tabId, url) {
  try {
    const urlObj = new URL(url);
    const dominioPrincipal = urlObj.hostname;

    const cookies = await browser.cookies.getAll({ url: url });
    let primeiraParte = 0;
    let terceiraParte = 0;

    cookies.forEach(cookie => {
      if (cookie.domain.includes(dominioPrincipal)) {
        primeiraParte++;
      } else {
        terceiraParte++;
      }
    });

    console.log(`Cookies detectados para ${dominioPrincipal}:`);
    console.log(`- Primeira parte: ${primeiraParte}`);
    console.log(`- Terceira parte: ${terceiraParte}`);

    // Atualizar dados da aba
    if (!dadosAbas[tabId]) {
      dadosAbas[tabId] = {};
    }
    dadosAbas[tabId].cookiesPrimeiraParte = primeiraParte;
    dadosAbas[tabId].cookiesTerceiros = terceiraParte;

    return { primeiraParte, terceiraParte };
  } catch (error) {
    console.error("Erro ao detectar cookies:", error);
    return { primeiraParte: 0, terceiraParte: 0 };
  }
}

// Monitorar quando a aba termina de carregar
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    detectarCookies(tabId, tab.url);
  }
});

// Listener para mensagens do popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getReport") {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tabAtual = tabs[0];
      const tabId = tabAtual.id;
      
      // Obter dados da aba atual ou usar valores padrão
      const dados = dadosAbas[tabId] || {};
      
      // Enviar dados para o content script e depois compilar resposta
      browser.tabs.sendMessage(tabId, { action: "getDados" }).then((contentData) => {
        const dadosCompletos = {
          conexoesTerceiros: dados.conexoesTerceiros ? dados.conexoesTerceiros.size : 0,
          listaConexoesTerceiros: dados.conexoesTerceiros ? Array.from(dados.conexoesTerceiros) : [],
          hijacking: contentData?.hijacking || false,
          localStorage: contentData?.localStorage || false,
          cookiesPrimeiraParte: dados.cookiesPrimeiraParte || 0,
          cookiesTerceiros: dados.cookiesTerceiros || 0,
          supercookies: dados.etag || contentData?.indexedDB || contentData?.serviceWorker || false,
          supercookiesDetalhes: {
            etag: dados.etag || false,
            indexedDB: contentData?.indexedDB || false,
            serviceWorker: contentData?.serviceWorker || false
          },
          canvasFingerprint: contentData?.canvasFingerprint || false,
          etag: dados.etag || false,
          indexedDB: contentData?.indexedDB || false,
          serviceWorker: contentData?.serviceWorker || false
        };
        
        sendResponse(dadosCompletos);
      }).catch((error) => {
        console.error("Erro ao comunicar com content script:", error);
        // Enviar dados básicos mesmo se content script falhar
        const dadosCompletos = {
          conexoesTerceiros: dados.conexoesTerceiros ? dados.conexoesTerceiros.size : 0,
          listaConexoesTerceiros: dados.conexoesTerceiros ? Array.from(dados.conexoesTerceiros) : [],
          hijacking: false,
          localStorage: false,
          cookiesPrimeiraParte: dados.cookiesPrimeiraParte || 0,
          cookiesTerceiros: dados.cookiesTerceiros || 0,
          supercookies: dados.etag || false,
          supercookiesDetalhes: {
            etag: dados.etag || false,
            indexedDB: false,
            serviceWorker: false
          },
          canvasFingerprint: false,
          etag: dados.etag || false,
          indexedDB: false,
          serviceWorker: false
        };
        
        sendResponse(dadosCompletos);
      });
    });
    
    return true; 
  }
});

// Limpar dados quando aba é fechada
browser.tabs.onRemoved.addListener((tabId) => {
  delete dadosAbas[tabId];
});
