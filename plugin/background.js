// Detectar conexões de terceiros
browser.webRequest.onBeforeRequest.addListener(
  details => {
    const url = new URL(details.url);
    const domain = url.hostname;
    console.log("Requisição detectada:", domain);
  },
  { urls: ["<all_urls>"] }
);

// Monitorar cabeçalhos de resposta para possíveis supercookies via ETag
browser.webRequest.onHeadersReceived.addListener(
  details => {
    const etag = details.responseHeaders.find(h => h.name.toLowerCase() === "etag");
    if (etag) {
      console.warn("ETag detectado (pode ser usado como supercookie):", etag.value);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Detectar cookies por aba
async function detectarCookies(tabId, url) {
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

  return { primeiraParte, terceiraParte };
}

// Monitorar quando a aba termina de carregar
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.startsWith("http")) {
    detectarCookies(tabId, tab.url);
  }
});
