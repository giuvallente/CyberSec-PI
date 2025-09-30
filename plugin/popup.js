// Variável global para armazenar stats do bloqueador
window.blockerStats = null;

// Inicializar controles de bloqueio
async function initBlockerControls() {
  try {
    // Obter estatísticas do bloqueador
    const stats = await browser.runtime.sendMessage({ action: 'getBlockerStats' });
    window.blockerStats = stats;
    
    // Atualizar interface
    updateBlockerUI(stats);
    
    // Configurar toggle
    const toggle = document.getElementById('blockerToggle');
    toggle.addEventListener('click', toggleBlocker);
    
    // Listener para atualizações do bloqueador
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'blockerUpdated') {
        window.blockerStats = message.stats;
        updateBlockerUI(message.stats);
      }
    });
    
  } catch (error) {
    console.error('Erro ao inicializar controles de bloqueio:', error);
    // Usar valores padrão
    window.blockerStats = {
      isEnabled: false,
      blockedDomainsCount: 0,
      sessionBlocks: 0,
      blockedDomains: []
    };
    updateBlockerUI(window.blockerStats);
  }
}

// Atualizar interface do bloqueador
function updateBlockerUI(stats) {
  const toggle = document.getElementById('blockerToggle');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('blockerStatusText');
  const blockCounter = document.getElementById('blockCounter');
  const blockCountText = document.getElementById('blockCountText');
  
  // Atualizar toggle
  toggle.classList.toggle('active', stats.isEnabled);
  
  // Atualizar status
  statusIndicator.classList.toggle('active', stats.isEnabled);
  statusText.textContent = stats.isEnabled ? 
    `Ativo • ${stats.blockedDomainsCount} bloqueados` : 
    'Inativo';
  
  // Atualizar contador
  blockCountText.textContent = stats.sessionBlocks;
  blockCounter.classList.toggle('zero', stats.sessionBlocks === 0);
}

// Toggle do bloqueador principal
async function toggleBlocker() {
  try {
    const newState = !window.blockerStats.isEnabled;
    await browser.runtime.sendMessage({ 
      action: 'toggleBlocking', 
      enabled: newState 
    });
  } catch (error) {
    console.error('Erro ao alternar bloqueador:', error);
  }
}

// Toggle de bloqueio de domínio específico
async function toggleDomainBlock(domain, button) {
  try {
    const isCurrentlyBlocked = button.classList.contains('blocked');
    const action = isCurrentlyBlocked ? 'unblockDomain' : 'blockDomain';
    
    // Desabilitar botão temporariamente
    button.disabled = true;
    
    await browser.runtime.sendMessage({ 
      action: action, 
      domain: domain 
    });
    
    // Atualizar botão
    button.classList.toggle('blocked', !isCurrentlyBlocked);
    button.textContent = isCurrentlyBlocked ? 'Bloquear' : 'Desbloq.';
    
  } catch (error) {
    console.error('Erro ao bloquear/desbloquear domínio:', error);
  } finally {
    button.disabled = false;
  }
}

// Expor função globalmente
window.toggleDomainBlock = toggleDomainBlock;

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', initBlockerControls);

// Recebe dados do background/content
browser.runtime.sendMessage({ action: "getReport" }).then((dados) => {
  if (!dados) {
    console.warn("Nenhum dado recebido, usando valores padrão");
    mostrarDadosPadrao();
    return;
  }

  try {
    // Analisar conexões para mostrar info detalhada
    let connectionsText = dados.conexoesTerceiros || 0;
    if (dados.listaConexoesTerceiros && dados.listaConexoesTerceiros.length > 0 && window.TrackerIdentifier) {
      const analysis = window.TrackerIdentifier.analyzeConnections(dados.listaConexoesTerceiros);
      const trackerCount = analysis.trackers.length;
      if (trackerCount > 0) {
        connectionsText = `${dados.conexoesTerceiros} (${trackerCount} 🚨)`;
      }
    }
    
    // Atualizar informações básicas
    document.getElementById("terceiros").innerText = connectionsText;
    document.getElementById("hijack").innerText = dados.hijacking ? "Sim" : "Não";
    document.getElementById("cookies1p").innerText = dados.cookiesPrimeiraParte || 0;
    document.getElementById("cookies3p").innerText = dados.cookiesTerceiros || 0;
    document.getElementById("canvas").innerText = dados.canvasFingerprint ? "Sim" : "Não";
    
    // Contar e mostrar supercookies
    const supercookiesCount = contarSupercookies(dados.supercookiesDetalhes);
    document.getElementById("supercookies").innerText = supercookiesCount;

    // Configurar conexões de terceiros
    setupExpandableSection("terceiros", "expandConnections", "connectionsList", 
      dados.listaConexoesTerceiros, populateConnectionsList);

    // Configurar cookies 1ª parte
    setupExpandableSection("cookies1p", "expandCookies1p", "cookies1pList", 
      dados.listaCookies1p, populateCookiesList);

    // Configurar cookies 3ª parte
    setupExpandableSection("cookies3p", "expandCookies3p", "cookies3pList", 
      dados.listaCookies3p, populateCookiesList);

    // Configurar supercookies
    setupExpandableSection("supercookies", "expandSupercookies", "supercookiesList", 
      dados.supercookiesDetalhes, populateSupercookiesList);

    // Configurar storage local (comportamento especial)
    setupStorageLocal(dados);

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
  
  // Ocultar todos os botões
  document.getElementById("expandConnections").style.display = "none";
  document.getElementById("expandCookies1p").style.display = "none";
  document.getElementById("expandCookies3p").style.display = "none";
  document.getElementById("expandSupercookies").style.display = "none";
}

function populateConnectionsList(connections) {
  const list = document.getElementById("connectionsList");
  list.innerHTML = "";
  
  if (!connections || connections.length === 0) return;
  
  // Analisar conexões usando o identificador de rastreadores
  const analysis = window.TrackerIdentifier ? 
    window.TrackerIdentifier.analyzeConnections(connections) : 
    { trackers: [], normal: connections.map(domain => ({ domain, category: 'unknown' })), byCategory: {} };
  
  // Mostrar estatísticas se houver rastreadores
  if (analysis.trackers.length > 0) {
    const statsDiv = document.createElement("div");
    statsDiv.className = "tracker-stats";
    
    // Contar por categoria
    const categories = ['ads', 'analytics', 'social', 'marketing', 'cdn'];
    categories.forEach(category => {
      const count = analysis.byCategory[category] || 0;
      if (count > 0) {
        const stat = document.createElement("div");
        stat.className = `tracker-stat ${category}`;
        stat.innerHTML = `<span class="tracker-icon">${window.TrackerIdentifier.TRACKER_CATEGORIES[category].icon}</span> ${count}`;
        stat.title = window.TrackerIdentifier.TRACKER_CATEGORIES[category].description;
        statsDiv.appendChild(stat);
      }
    });
    
    list.appendChild(statsDiv);
  }
  
  // Mostrar rastreadores primeiro
  if (analysis.trackers.length > 0) {
    const trackersHeader = document.createElement("div");
    trackersHeader.className = "section-divider";
    trackersHeader.textContent = `Rastreadores Detectados (${analysis.trackers.length})`;
    list.appendChild(trackersHeader);
    
    analysis.trackers
      .sort((a, b) => a.domain.localeCompare(b.domain))
      .forEach(tracker => {
        const item = document.createElement("div");
        item.className = `tracker-item ${tracker.category}`;
        
        // Verificar se o domínio está bloqueado
        const isBlocked = window.blockerStats && window.blockerStats.blockedDomains.includes(tracker.domain);
        
        item.innerHTML = `
          <div class="tracker-info">
            <div class="tracker-domain">${tracker.domain}</div>
            <div class="tracker-name">${tracker.name}</div>
          </div>
          <div class="tracker-actions">
            <div class="tracker-badge ${tracker.category}">
              <span class="tracker-icon">${tracker.icon}</span>
              ${tracker.name}
            </div>
            <button class="block-btn ${isBlocked ? 'blocked' : ''}" 
                    data-domain="${tracker.domain}" 
                    onclick="toggleDomainBlock('${tracker.domain}', this)">
              ${isBlocked ? 'Desbloq.' : 'Bloquear'}
            </button>
          </div>
        `;
        
        item.title = `${tracker.description}\nCategoria: ${tracker.name}`;
        list.appendChild(item);
      });
  }
  
  // Mostrar conexões normais se houver
  if (analysis.normal.length > 0) {
    const normalHeader = document.createElement("div");
    normalHeader.className = "section-divider";
    normalHeader.textContent = `Outras Conexões (${analysis.normal.length})`;
    list.appendChild(normalHeader);
    
    analysis.normal
      .sort((a, b) => a.domain.localeCompare(b.domain))
      .forEach(connection => {
        const item = document.createElement("div");
        item.className = `tracker-item ${connection.category}`;
        
        item.innerHTML = `
          <div class="tracker-info">
            <div class="tracker-domain">${connection.domain}</div>
            <div class="tracker-name">Conexão normal</div>
          </div>
          <div class="tracker-badge ${connection.category}">
            <span class="tracker-icon">${connection.icon}</span>
            Normal
          </div>
        `;
        
        list.appendChild(item);
      });
  }
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
  if (detalhes && detalhes.etag) tipos.push("ETag");
  if (detalhes && detalhes.indexedDB) tipos.push("IndexedDB");
  if (detalhes && detalhes.serviceWorker) tipos.push("Service Worker");
  
  tipos.forEach(tipo => {
    const item = document.createElement("div");
    item.className = "supercookie-item";
    item.textContent = tipo;
    list.appendChild(item);
  });
}

// Nova função para configurar seções expansíveis
function setupExpandableSection(valueId, buttonId, listId, data, populateFunction) {
  const button = document.getElementById(buttonId);
  const list = document.getElementById(listId);
  
  if (!data || (Array.isArray(data) && data.length === 0) || 
      (typeof data === 'object' && Object.keys(data).length === 0)) {
    // Se não há dados, ocultar botão
    button.style.display = "none";
    return;
  }

  // Mostrar botão se há dados
  button.style.display = "inline-block";
  
  // Configurar evento de clique
  button.addEventListener("click", function() {
    if (list.style.display === "none") {
      // Expandir
      list.style.display = "block";
      button.textContent = "Ocultar";
      button.classList.add("expanded");
      
      // Popular lista se ainda não foi populada
      if (list.children.length === 0) {
        if (populateFunction === populateCookiesList) {
          populateFunction(data, list);
        } else {
          populateFunction(data);
        }
      }
    } else {
      // Colapsar
      list.style.display = "none";
      button.textContent = "Ver";
      button.classList.remove("expanded");
    }
  });
}

// Função específica para storage local
function setupStorageLocal(dados) {
  const storageValue = document.getElementById("storage");
  const storageList = document.getElementById("storageList");
  
  const storageTypes = [];
  if (dados.localStorage) storageTypes.push("localStorage");
  if (dados.sessionStorage) storageTypes.push("sessionStorage");
  if (dados.indexedDB) storageTypes.push("IndexedDB");
  if (dados.webSQL) storageTypes.push("WebSQL");
  
  if (storageTypes.length > 0) {
    // Ocultar o valor "Sim/Não" e mostrar a lista diretamente
    storageValue.style.display = "none";
    storageList.style.display = "block";
    
    storageList.innerHTML = "";
    storageTypes.forEach(type => {
      const item = document.createElement("div");
      item.className = "storage-item";
      item.textContent = type;
      storageList.appendChild(item);
    });
  } else {
    // Mostrar apenas "Não"
    storageValue.textContent = "Não";
    storageValue.style.display = "block";
    storageList.style.display = "none";
  }
}

// Nova função para popular lista de cookies
function populateCookiesList(cookies, listElement) {
  if (!cookies || !Array.isArray(cookies)) return;
  
  if (!listElement) {
    return;
  }
  
  listElement.innerHTML = "";
  
  cookies.forEach(cookie => {
    const item = document.createElement("div");
    item.className = "cookie-item";
    
    if (typeof cookie === 'string') {
      item.textContent = cookie;
    } else if (cookie.name) {
      // Exibir nome do cookie e domínio
      item.textContent = `${cookie.name} (${cookie.domain})`;
      item.title = `Valor: ${cookie.value || 'N/A'}`;
    } else {
      item.textContent = 'Cookie';
    }
    
    listElement.appendChild(item);
  });
}
