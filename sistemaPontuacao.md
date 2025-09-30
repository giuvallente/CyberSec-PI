## Sistema de Pontuação

### Categorização de Níveis

| Pontuação | Nível | Cor | Descrição |
|-----------|-------|-----|-----------|
| 0-10 | **Excelente** 🟢 | Verde | Site muito respeitoso com privacidade |
| 11-25 | **Bom** 🔵 | Azul | Nível aceitável de tracking |
| 26-45 | **Moderado** 🟡 | Amarelo | Tracking moderado detectado |
| 46-70 | **Alto** 🟠 | Laranja | Alto nível de tracking |
| 71+ | **Crítico** 🔴 | Vermelho | Tracking muito invasivo |

### Como funciona o sistema de pontuação?

O sistema de pontuação avalia a privacidade de um site com base em **5 categorias principais**, gerando uma pontuação de 0 a 100+ pontos.

#### 1. **Conexões de Terceiros** (0-25 pontos)

Detecção de requisições para domínios externos, sendo que a pontuação é calculada usando uma escala logarítmica baseada no número de conexões.

Exemplo:
  - 5 conexões = ~6 pontos
  - 20 conexões = ~11 pontos
  - 100+ conexões = 25 pontos (máximo)

#### 2. **Cookies** (0-20 pontos)

Cookies de 1ª parte têm peso 0.2, com pontuação máxima de 5 pontos, e cookies de 3ª parte têm peso 0.8, com pontuação máxima de 15 pontos, visto que são mais invasivos.

Exemplo:
  - 10 cookies próprios + 5 de terceiros = 6 pontos
  - 5 cookies próprios + 20 de terceiros = 17 pontos


#### 3. **Armazenamento Persistente** (0-25 pontos)

| Tecnologia | Pontos | Motivo |
|------------|--------|--------|
| localStorage | 5 | Armazenamento básico |
| ETag | 6 | Supercookie via cabeçalho |
| IndexedDB | 8 | Banco de dados persistente |
| Service Worker | 10 | Cache muito persistente |

#### 4. **Fingerprinting** (0-15 pontos)

Caso um site utilize técnicas de fingerprinting, como Canvas Fingerprint, recebe 15 pontos, visto que é uma técnica muito invasiva.


#### 5. **Segurança/Hijacking** (0-15 pontos)

Caso um site utilize técnicas de API Hijacking, como modificações em `fetch()`, `XMLHttpRequest`, etc., recebe 15 pontos, visto que é crítico para segurança.

