# 📊 Sistema de Pontuação de Privacidade

## Visão Geral

O sistema avançado de pontuação avalia a privacidade de um site com base em **5 categorias principais**, gerando uma pontuação de 0 a 100+ pontos.

## 🎯 Categorias de Avaliação

### 1. **Conexões de Terceiros** (0-25 pontos)
- **O que detecta**: Requisições para domínios externos
- **Como pontua**: Escala logarítmica baseada no número de conexões
- **Fórmula**: `Math.min(25, Math.log10(conexoes + 1) * 8)`
- **Exemplo**: 
  - 5 conexões = ~6 pontos
  - 20 conexões = ~11 pontos
  - 100+ conexões = 25 pontos (máximo)

### 2. **Cookies** (0-20 pontos)
- **1ª parte**: Peso 0.2 (máximo 5 pontos)
- **3ª parte**: Peso 0.8 (máximo 15 pontos)
- **Rationale**: Cookies de terceiros são mais invasivos
- **Exemplo**:
  - 10 cookies próprios + 5 de terceiros = 6 pontos
  - 5 cookies próprios + 20 de terceiros = 17 pontos

### 3. **Armazenamento Persistente** (0-25 pontos)
| Tecnologia | Pontos | Motivo |
|------------|--------|--------|
| localStorage | 5 | Armazenamento básico |
| ETag | 6 | Supercookie via cabeçalho |
| IndexedDB | 8 | Banco de dados persistente |
| Service Worker | 10 | Cache muito persistente |

### 4. **Fingerprinting** (0-20 pontos)
- **Canvas Fingerprint**: 15 pontos (muito invasivo)
- **Futuro**: WebGL, AudioContext, Font detection, etc.

### 5. **Segurança/Hijacking** (0-15 pontos)
- **API Hijacking**: 15 pontos (crítico para segurança)
- **Detecção**: Modificações em `fetch()`, `XMLHttpRequest`, etc.

## 🏆 Categorização de Níveis

| Pontuação | Nível | Cor | Descrição |
|-----------|-------|-----|-----------|
| 0-10 | **Excelente** 🟢 | Verde | Site muito respeitoso com privacidade |
| 11-25 | **Bom** 🔵 | Azul | Nível aceitável de tracking |
| 26-45 | **Moderado** 🟡 | Amarelo | Tracking moderado detectado |
| 46-70 | **Alto** 🟠 | Laranja | Alto nível de tracking |
| 71+ | **Crítico** 🔴 | Vermelho | Tracking muito invasivo |

## 📈 Exemplos Práticos

### Site "Limpo" (Score: 8)
- 3 conexões terceiros: 4 pontos
- 2 cookies próprios: 1 ponto
- localStorage usado: 5 pontos
- **Total**: 10 pontos → **Excelente**

### Site de E-commerce (Score: 35)
- 25 conexões terceiros: 15 pontos
- 15 cookies terceiros: 12 pontos
- localStorage + IndexedDB: 13 pontos
- **Total**: 40 pontos → **Moderado**

### Site Invasivo (Score: 78)
- 100+ conexões: 25 pontos
- 30 cookies terceiros: 20 pontos
- Todos tipos de storage: 25 pontos
- Canvas fingerprint: 15 pontos
- **Total**: 85 pontos → **Crítico**

## 🔍 Funcionalidades Avançadas

### **Relatório Detalhado**
- Breakdown por categoria
- Impacto de cada métrica
- Valores específicos detectados

### **Interface Aprimorada**
- Score visual prominent
- Barra de progresso colorida
- Detalhes expansíveis
- Cores baseadas no nível de risco

### **Algoritmo Inteligente**
- Escala logarítmica para evitar scores excessivos
- Ponderação baseada em invasividade real
- Máximos por categoria para balance

## 🎛️ Configurações Possíveis

Para personalizar o sistema, você pode ajustar:

1. **Pesos das categorias** em `calcularPontuacao()`
2. **Limites de níveis** na categorização
3. **Pontos por tecnologia** nas detecções
4. **Fórmulas de cálculo** para conexões/cookies

## 📊 Melhorias Futuras

- [ ] Detecção de WebGL fingerprinting
- [ ] Análise de políticas de privacidade
- [ ] Histórico de pontuações por site
- [ ] Comparação com outros sites
- [ ] Configurações personalizáveis pelo usuário
- [ ] Export de relatórios
- [ ] Integração com listas de bloqueio