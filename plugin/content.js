// Dados detectados no content script
let dadosDetectados = {
  localStorage: false,
  indexedDB: false,
  serviceWorker: false,
  canvasFingerprint: false,
  hijacking: false
};

// Detectar uso de localStorage e sessionStorage
function detectarStorage() {
  try {
    if (localStorage.length > 0 || sessionStorage.length > 0) {
      console.log("Armazenamento detectado (local/session storage):", {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      });
      dadosDetectados.localStorage = true;
    }
  } catch (error) {
    console.log("Erro ao verificar storage:", error);
  }
}

// Detectar IndexedDB (supercookie)
function detectarIndexedDB() {
  try {
    const openRequest = indexedDB.open("detector-teste");
    openRequest.onsuccess = function() {
      console.warn("Possível uso de IndexedDB detectado (supercookie).");
      dadosDetectados.indexedDB = true;
      indexedDB.deleteDatabase("detector-teste"); 
    };
    openRequest.onerror = function() {
      dadosDetectados.indexedDB = false;
    };
  } catch (error) {
    console.log("Erro ao verificar IndexedDB:", error);
    dadosDetectados.indexedDB = false;
  }
}

// Detectar Canvas Fingerprint
function detectarCanvasFingerprint() {
  try {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {
      console.warn("Possível tentativa de Canvas Fingerprint detectada!");
      dadosDetectados.canvasFingerprint = true;
      return originalToDataURL.apply(this, arguments);
    };

    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function () {
      console.warn("Possível tentativa de Canvas Fingerprint detectada via getImageData!");
      dadosDetectados.canvasFingerprint = true;
      return originalGetImageData.apply(this, arguments);
    };
  } catch (error) {
    console.log("Erro ao detectar canvas fingerprint:", error);
  }
}

// Detectar Service Workers (armazenamento persistente)
function detectarServiceWorker() {
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      console.warn("Service Worker detectado – pode estar sendo usado como supercookie.");
      dadosDetectados.serviceWorker = true;
    }
  } catch (error) {
    console.log("Erro ao verificar service worker:", error);
  }
}

// Detectar possíveis tentativas de hijacking/hooks
function detectarHijacking() {
  try {
    // Verificar se APIs nativas foram modificadas
    const originalFetch = window.fetch;
    const originalXMLHttpRequest = window.XMLHttpRequest;
    
    // Verificar se fetch foi modificado
    if (window.fetch !== originalFetch) {
      console.warn("Fetch API foi modificada - possível hijacking detectado");
      dadosDetectados.hijacking = true;
    }
    
    // Verificar se XMLHttpRequest foi modificado
    if (window.XMLHttpRequest !== originalXMLHttpRequest) {
      console.warn("XMLHttpRequest foi modificado - possível hijacking detectado");
      dadosDetectados.hijacking = true;
    }
  } catch (error) {
    console.log("Erro ao verificar hijacking:", error);
  }
}

// Executar detecções quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  detectarStorage();
  detectarIndexedDB();
  detectarServiceWorker();
  detectarHijacking();
});

// Executar detecções imediatamente também
detectarStorage();
detectarIndexedDB();
detectarCanvasFingerprint();
detectarServiceWorker();
detectarHijacking();

// Listener para mensagens do background script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDados") {
    // Atualizar dados antes de enviar
    detectarStorage();
    detectarServiceWorker();
    
    return Promise.resolve(dadosDetectados);
  }
});
