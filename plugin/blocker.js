// Sistema de Bloqueio de Rastreadores
class BlockerManager {
  constructor() {
    this.isEnabled = false;
    this.blockedDomains = new Set();
    this.sessionBlocks = 0;
    this.init();
  }

  // Inicializar o sistema
  async init() {
    await this.loadSettings();
    this.setupMessageListener();
  }

  // Carregar configurações salvas
  async loadSettings() {
    try {
      const result = await browser.storage.local.get(['blockerEnabled', 'blockedDomains', 'sessionBlocks']);
      this.isEnabled = result.blockerEnabled || false;
      this.blockedDomains = new Set(result.blockedDomains || []);
      this.sessionBlocks = result.sessionBlocks || 0;
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  // Salvar configurações
  async saveSettings() {
    try {
      await browser.storage.local.set({
        blockerEnabled: this.isEnabled,
        blockedDomains: Array.from(this.blockedDomains),
        sessionBlocks: this.sessionBlocks
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }

  // Ativar/desativar bloqueio
  async toggleBlocking(enabled) {
    this.isEnabled = enabled;
    await this.saveSettings();
    
    // Notificar outras partes da extensão
    this.broadcastUpdate();
  }

  // Bloquear um domínio específico
  async blockDomain(domain) {
    this.blockedDomains.add(domain);
    await this.saveSettings();
    this.broadcastUpdate();
  }

  // Desbloquear um domínio específico
  async unblockDomain(domain) {
    this.blockedDomains.delete(domain);
    await this.saveSettings();
    this.broadcastUpdate();
  }

  // Verificar se um domínio está bloqueado
  isDomainBlocked(domain) {
    return this.blockedDomains.has(domain);
  }

  // Verificar se uma URL deve ser bloqueada
  shouldBlockRequest(url) {
    if (!this.isEnabled) return false;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Verificar domínio exato
      if (this.blockedDomains.has(domain)) return true;
      
      // Verificar subdomínios
      for (const blockedDomain of this.blockedDomains) {
        if (domain.endsWith('.' + blockedDomain)) return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  // Incrementar contador de bloqueios
  async incrementBlockCount() {
    this.sessionBlocks++;
    await this.saveSettings();
    this.broadcastUpdate();
  }

  // Resetar contador de sessão
  async resetSessionCount() {
    this.sessionBlocks = 0;
    await this.saveSettings();
    this.broadcastUpdate();
  }

  // Obter estatísticas
  getStats() {
    return {
      isEnabled: this.isEnabled,
      blockedDomainsCount: this.blockedDomains.size,
      sessionBlocks: this.sessionBlocks,
      blockedDomains: Array.from(this.blockedDomains)
    };
  }

  // Configurar listener de mensagens
  setupMessageListener() {
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'getBlockerStats':
          sendResponse(this.getStats());
          break;
        case 'toggleBlocking':
          this.toggleBlocking(request.enabled).then(() => {
            sendResponse({ success: true });
          });
          return true;
        case 'blockDomain':
          this.blockDomain(request.domain).then(() => {
            sendResponse({ success: true });
          });
          return true;
        case 'unblockDomain':
          this.unblockDomain(request.domain).then(() => {
            sendResponse({ success: true });
          });
          return true;
        case 'resetSessionCount':
          this.resetSessionCount().then(() => {
            sendResponse({ success: true });
          });
          return true;
      }
    });
  }

  // Notificar mudanças
  broadcastUpdate() {
    // Enviar mensagem para o popup se estiver aberto
    browser.runtime.sendMessage({
      action: 'blockerUpdated',
      stats: this.getStats()
    }).catch(() => {
      // Ignorar erro se popup não estiver aberto
    });
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.BlockerManager = BlockerManager;
} else if (typeof global !== 'undefined') {
  global.BlockerManager = BlockerManager;
}