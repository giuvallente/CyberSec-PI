// Base de dados de rastreadores conhecidos
// Baseado em listas como EasyList, EasyPrivacy e outras fontes conhecidas

const TRACKER_DATABASE = {
  // Analytics
  'google-analytics.com': { category: 'analytics', name: 'Google Analytics' },
  'googletagmanager.com': { category: 'analytics', name: 'Google Tag Manager' },
  'facebook.com': { category: 'social', name: 'Facebook Pixel' },
  'doubleclick.net': { category: 'ads', name: 'DoubleClick' },
  'googlesyndication.com': { category: 'ads', name: 'Google AdSense' },
  'amazon-adsystem.com': { category: 'ads', name: 'Amazon Advertising' },
  'adsystem.com': { category: 'ads', name: 'Amazon Ads' },
  'hotjar.com': { category: 'analytics', name: 'Hotjar' },
  'mixpanel.com': { category: 'analytics', name: 'Mixpanel' },
  'segment.com': { category: 'analytics', name: 'Segment' },
  'amplitude.com': { category: 'analytics', name: 'Amplitude' },
  
  // Advertising Networks
  'googlesyndication.com': { category: 'ads', name: 'Google Ads' },
  'adsystem.com': { category: 'ads', name: 'Ad System' },
  'outbrain.com': { category: 'ads', name: 'Outbrain' },
  'taboola.com': { category: 'ads', name: 'Taboola' },
  'bing.com': { category: 'ads', name: 'Microsoft Advertising' },
  'criteo.com': { category: 'ads', name: 'Criteo' },
  'adsystem.com': { category: 'ads', name: 'Amazon DSP' },
  
  // Social Media Trackers
  'facebook.net': { category: 'social', name: 'Facebook' },
  'fbcdn.net': { category: 'social', name: 'Facebook CDN' },
  'twitter.com': { category: 'social', name: 'Twitter Analytics' },
  'linkedin.com': { category: 'social', name: 'LinkedIn Insights' },
  'instagram.com': { category: 'social', name: 'Instagram' },
  'pinterest.com': { category: 'social', name: 'Pinterest Analytics' },
  
  // Marketing & Retargeting
  'mailchimp.com': { category: 'marketing', name: 'MailChimp' },
  'hubspot.com': { category: 'marketing', name: 'HubSpot' },
  'salesforce.com': { category: 'marketing', name: 'Salesforce' },
  'marketo.com': { category: 'marketing', name: 'Marketo' },
  'pardot.com': { category: 'marketing', name: 'Pardot' },
  
  // CDNs que podem ter tracking
  'cloudflare.com': { category: 'cdn', name: 'Cloudflare' },
  'amazonaws.com': { category: 'cdn', name: 'Amazon S3' },
  'googleusercontent.com': { category: 'cdn', name: 'Google CDN' },
  
  // Analytics especializados
  'newrelic.com': { category: 'analytics', name: 'New Relic' },
  'datadog.com': { category: 'analytics', name: 'Datadog' },
  'bugsnag.com': { category: 'analytics', name: 'Bugsnag' },
  'sentry.io': { category: 'analytics', name: 'Sentry' },
  
  // Brasileiros comuns
  'uol.com.br': { category: 'analytics', name: 'UOL Analytics' },
  'globo.com': { category: 'analytics', name: 'Globo Analytics' },
  'terra.com.br': { category: 'analytics', name: 'Terra Analytics' },
  'mercadolivre.com.br': { category: 'analytics', name: 'MercadoLivre Analytics' },
  'netshoes.com.br': { category: 'analytics', name: 'Netshoes Analytics' },
  
  // Outros rastreadores conhecidos
  'quantserve.com': { category: 'analytics', name: 'Quantcast' },
  'scorecardresearch.com': { category: 'analytics', name: 'ScoreCard Research' },
  'nielsen.com': { category: 'analytics', name: 'Nielsen' },
  'comscore.com': { category: 'analytics', name: 'ComScore' },
  'chartbeat.com': { category: 'analytics', name: 'Chartbeat' }
};

// Categorias e suas configurações visuais
const TRACKER_CATEGORIES = {
  'ads': {
    name: 'Publicidade',
    icon: '📢',
    color: '#e53e3e',
    bgColor: '#fed7d7',
    description: 'Redes de publicidade e anúncios'
  },
  'analytics': {
    name: 'Analytics',
    icon: '📊',
    color: '#3182ce',
    bgColor: '#bee3f8',
    description: 'Ferramentas de análise e métricas'
  },
  'social': {
    name: 'Social',
    icon: '👥',
    color: '#805ad5',
    bgColor: '#e9d8fd',
    description: 'Redes sociais e widgets'
  },
  'marketing': {
    name: 'Marketing',
    icon: '💼',
    color: '#d69e2e',
    bgColor: '#faf089',
    description: 'Ferramentas de marketing e CRM'
  },
  'cdn': {
    name: 'CDN',
    icon: '🌐',
    color: '#38a169',
    bgColor: '#c6f6d5',
    description: 'Redes de distribuição de conteúdo'
  },
  'unknown': {
    name: 'Desconhecido',
    icon: '❓',
    color: '#718096',
    bgColor: '#e2e8f0',
    description: 'Origem não identificada'
  }
};

// Função para identificar se um domínio é um rastreador
function identifyTracker(domain) {
  // Limpar o domínio (remover www, subdomínios irrelevantes, etc.)
  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
  
  // Busca direta
  if (TRACKER_DATABASE[cleanDomain]) {
    return {
      isTracker: true,
      ...TRACKER_DATABASE[cleanDomain],
      ...TRACKER_CATEGORIES[TRACKER_DATABASE[cleanDomain].category]
    };
  }
  
  // Busca por subdomínio (ex: analytics.google.com -> google.com)
  for (const trackerDomain in TRACKER_DATABASE) {
    if (cleanDomain.includes(trackerDomain) || cleanDomain.endsWith('.' + trackerDomain)) {
      return {
        isTracker: true,
        ...TRACKER_DATABASE[trackerDomain],
        ...TRACKER_CATEGORIES[TRACKER_DATABASE[trackerDomain].category]
      };
    }
  }
  
  // Se não encontrado, retorna como desconhecido
  return {
    isTracker: false,
    category: 'unknown',
    name: domain,
    ...TRACKER_CATEGORIES['unknown']
  };
}

// Função para analisar uma lista de domínios
function analyzeConnections(domains) {
  const results = {
    trackers: [],
    normal: [],
    byCategory: {
      ads: 0,
      analytics: 0,
      social: 0,
      marketing: 0,
      cdn: 0,
      unknown: 0
    }
  };
  
  domains.forEach(domain => {
    const analysis = identifyTracker(domain);
    
    if (analysis.isTracker) {
      results.trackers.push({
        domain,
        ...analysis
      });
    } else {
      results.normal.push({
        domain,
        ...analysis
      });
    }
    
    results.byCategory[analysis.category]++;
  });
  
  return results;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.TrackerIdentifier = {
    identifyTracker,
    analyzeConnections,
    TRACKER_CATEGORIES,
    TRACKER_DATABASE
  };
}