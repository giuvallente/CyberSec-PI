// Armazenar dados detectados por aba
let dadosAbas = {};

// Inicializar sistema de bloqueio
let blockerManager = null;

// Aguardar um momento para que todos os scripts carreguem
setTimeout(async () => {
  try {
    // A classe BlockerManager deve estar disponível globalmente via blocker.js
    if (typeof BlockerManager !== 'undefined') {
      blockerManager = new BlockerManager();
      setupBlockingLogic();
    } else {
      console.error('BlockerManager não encontrado - verifique se blocker.js foi carregado');
    }
  } catch (error) {
    console.error('Erro ao inicializar sistema de bloqueio:', error);
  }
}, 100);

// Configurar lógica de bloqueio de requisições
function setupBlockingLogic() {
  // Interceptar requisições para bloqueio
  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (!blockerManager) return {};
      
      // Verificar se deve bloquear a requisição
      if (blockerManager.shouldBlockRequest(details.url)) {
        console.log('🚫 Bloqueando requisição:', details.url);
        
        // Incrementar contador de bloqueios
        blockerManager.incrementBlockCount();
        
        // Cancelar a requisição
        return { cancel: true };
      }
      
      return {};
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
}

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
    let listaCookies1p = [];
    let listaCookies3p = [];

    cookies.forEach(cookie => {
      if (cookie.domain.includes(dominioPrincipal)) {
        primeiraParte++;
        listaCookies1p.push({
          name: cookie.name,
          domain: cookie.domain,
          value: cookie.value ? cookie.value.substring(0, 20) + (cookie.value.length > 20 ? '...' : '') : ''
        });
      } else {
        terceiraParte++;
        listaCookies3p.push({
          name: cookie.name,
          domain: cookie.domain,
          value: cookie.value ? cookie.value.substring(0, 20) + (cookie.value.length > 20 ? '...' : '') : ''
        });
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
    dadosAbas[tabId].listaCookies1p = listaCookies1p;
    dadosAbas[tabId].listaCookies3p = listaCookies3p;

    return { primeiraParte, terceiraParte, listaCookies1p, listaCookies3p };
  } catch (error) {
    console.error("Erro ao detectar cookies:", error);
    return { primeiraParte: 0, terceiraParte: 0, listaCookies1p: [], listaCookies3p: [] };
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
  // Delegar mensagens do bloqueador
  if (blockerManager && ['getBlockerStats', 'toggleBlocking', 'blockDomain', 'unblockDomain', 'resetSessionCount'].includes(request.action)) {
    // A classe BlockerManager já configurou seu próprio listener
    return;
  }
  
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
          listaCookies1p: dados.listaCookies1p || [],
          listaCookies3p: dados.listaCookies3p || [],
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
          listaCookies1p: dados.listaCookies1p || [],
          listaCookies3p: dados.listaCookies3p || [],
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
