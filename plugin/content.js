// Detectar uso de localStorage e sessionStorage
if (localStorage.length > 0 || sessionStorage.length > 0) {
  console.log("Armazenamento detectado (local/session storage):", {
    localStorage: Object.keys(localStorage),
    sessionStorage: Object.keys(sessionStorage)
  });
}

// Detectar IndexedDB (supercookie)
(function() {
  const openRequest = indexedDB.open("detector-teste");
  openRequest.onsuccess = function() {
    console.warn("Possível uso de IndexedDB detectado (supercookie).");
    indexedDB.deleteDatabase("detector-teste"); // limpeza após teste
  };
})();

// Detectar Canvas Fingerprint
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
HTMLCanvasElement.prototype.toDataURL = function () {
  console.warn("Possível tentativa de Canvas Fingerprint detectada!");
  return originalToDataURL.apply(this, arguments);
};

// Detectar Service Workers (armazenamento persistente)
if (navigator.serviceWorker && navigator.serviceWorker.controller) {
  console.warn("Service Worker detectado – pode estar sendo usado como supercookie.");
}
