# Changelog — Bolão Green

Documentação do projeto **Bolão Green** (PWA + APK Android) com histórico de **atualizações**, **correções** e **melhorias**.

> Versão atual: **1.6** · Deploy ativo: `https://bolao26-bbe2c.web.app`

---

## Sumário

- [1. Visão geral](#1-visão-geral)
- [2. Histórico de atualizações](#2-histórico-de-atualizações)
- [3. Melhorias recentes (detalhadas)](#3-melhorias-recentes-detalhadas)
- [4. Correções de bugs](#4-correções-de-bugs)
- [5. Integração com APIs externas](#5-integração-com-apis-externas)
- [6. Estrutura atual do projeto](#6-estrutura-atual-do-projeto)
- [7. Git e versionamento](#7-git-e-versionamento)
- [8. Observações técnicas e ambiente](#8-observações-técnicas-e-ambiente)

---

## 1. Visão geral

Bolão onde participantes fazem palpites em jogos de futebol (Brasileirão **Série A**, **Série B** e **UEFA Champions League**), acompanham pontuação e ranking em tempo real.

- **Frontend:** React 19 + React Router 7 (HashRouter) + PWA (`vite-plugin-pwa`)
- **Backend:** Firebase (Realtime Database, Auth, Cloud Messaging, Hosting)
- **Mobile:** Capacitor 8 (Android) — o APK carrega a mesma aplicação web hospedada (`server.url`)
- **Pontuação:** jogo exato = 10 pts · placar certo dos dois ou um gol a mais/menos = 5 pts · acerto do vencedor = 0 pts (ver `calcularPontuacao.js` e página `/regras`)

---

## 2. Histórico de atualizações

### 2.1 Última rodada de melhorias (mais recente)

Nova funcionalidade de **Champions League** + melhorias de usabilidade:

| Item | Tipo | Descrição |
|---|---|---|
| Importação da UEFA Champions League | Funcionalidade | Novo script `gerar-champions.mjs` (API football-data.org) → `champions-league.json` + botão **Importar Champions** no Admin, reutilizando a mesma lógica do Brasileirão |
| Escudos da Champions | Funcionalidade | Geração automática de `escudosChampions.js` com 36 escudos; `getEscudo` consulta os dois mapas |
| Página Regras | Melhoria | Rota `/regras` com pontuação oficial (10/5/0), acessível pelo menu desktop e mobile |
| Desempate do ranking | Melhoria | Ranking e Dashboard ordenam por `pontos → placares exatos → nome` e exibem contagem de acertos exatos |
| Editar palpite | Melhoria | Botão **Editar palpite** em Meus Palpites direciona para o jogo ainda aberto |
| Foto no cadastro | Melhoria | Campo opcional de foto (URL) com preview + `updateProfile` + gravação em `users/<uid>/photoURL` |
| Teclado numérico | Melhoria | `inputMode="numeric"` nos campos de resultado do Admin (teclado numérico em mobile) |
| Matching de transmissões | Correção/Melhoria | Normalização de nomes de times (acentos, prefixos `FC`/`SK`/`AC`, aliases `PSG`) → streams da Champions achados mesmo com nomes diferentes |

### 2.2 Rodada anterior

- **Tema claro/escuro** — `ThemeToggle` + `useTheme` com persistência (`theme.css`)
- **Perfil editável** — página `/perfil` com nome, foto e dados do usuário
- **Gamificação** — evolução por rodada no Dashboard/Ranking (`evolucao.js`)
- **Ranking** — visão de posições por rodada e evolução do jogador

### 2.3 Base (antes desta sessão)

- Splash screen com animação (`SplashGate`/`SplashAnimation`)
- Notificações push (FCM) com central no Admin (`NotificationModal`)
- Alertas de atualização via GitHub Releases (`useUpdateChecker`)
- PWA instalável + APK Android com build assinado
- Botões aprimorados de navbar

---

## 3. Melhorias recentes (detalhadas)

### 3.1 Importação da UEFA Champions League

**Como funciona (mesmo método do Brasileirão, sem quebrar o existente):**

1. **Gerar dados:** `node scripts/gerar-champions.mjs`
   - Consulta a API **football-data.org** (`/v4/competitions/CL/matches?season=2026`) usando `FOOTDATA_TOKEN` do `.env`
   - Converte UTC → horário de Brasília (UTC-3)
   - Gera ID estável `ucl-YYYYMMDD-time1-time2` (não perde palpites em reimportações)
   - Salva `src/data/champions-league.json` no **mesmo formato** do `brasileirao.json` (144 jogos, 8 rodadas, placares já encerrados)
   - Gera `src/utils/escudosChampions.js` com os escudos que a própria API retorna
2. **Importar no Admin:** botão **Importar Champions** — usa a mesma função `importarJogos(lista, nome)` parametrizada, escrevendo `jogos/<id>` + `resultados/<id>` no Firebase.

**Regras de banco:** o `database.rules.json` continua validando os 6 campos obrigatórios (`id, casa, fora, fase, data, lockAt`); nada mudou.

**Evolução por rodada (A + B, agora também Champions):** `evolucao.js` normaliza a fase com `serieDaFase()` — "Série A - Rodada 27" e "Série B - Rodada 27" viram **Rodada 27** (soma os pontos das duas séries na mesma rodada). Fases das Champions ("Rodada 1..8") não colidem com as rodadas do Brasileirão (25+).

### 3.2 Página Regras (`/regras`)

- Nova rota e links no navbar (desktop + menu mobile)
- Estilos `.regra-linha`, `.regra-pontos-10/5/0`
- Centraliza a regra oficial de pontuação para os participantes

### 3.3 Desempate e exibição de placares exatos

- `Ranking.jsx` e `Dashboard.jsx` computam `exatos` (pontos === 10) por jogador
- Ordenação: `pontos desc → exatos desc → nome`
- Exibição: *"N placar(es) exato(s)"* na lista de aceitação

### 3.4 Editar palpite

- Em Meus Palpites, cards de palpite apostado com jogo ainda aberto mostram **Editar palpite**
- Navega para `/jogos?jogo=<id>` com o jogo pré-selecionado pelo jogador

### 3.5 Foto de perfil no cadastro

- Campo opcional de URL de foto com preview
- Salva em Firebase Auth (`updateProfile`) + RTDB (`users/<uid>/photoURL`)
- Não há upload para Storage — é apenas URL (plano gratuito mantido)

---

## 4. Correções de bugs

### 4.1 Navbar mobile sumia no Android (crítico)

- **Sintoma:** na versão mobile, a navbar de baixo desaparecia em aparelhos reais.
- **Causa:** Vite 8 (lightningcss) estava convertendo `@media (max-width:768px)` para a sintaxe de intervalo `@media (width<=768px)`, ignorada por WebViews Chrome < 104 → a navbar ficava presa em `display:none`.
- **Correção:** `vite.config.js` → `build.cssTarget: 'chrome87'`, que força o CSS final a emitir `max-width/min-width` clássicos (validado: 0 ocorrências de `width<=` no `dist/`).
- **Status:** corrigido, publicado e verificado no build.

### 4.2 Evolução do ranking mostrava Série A e B separadas

- **Sintoma:** barras da evolução por rodada apareciam duplicadas ("Rodada 27" para A e outra para B).
- **Causa:** agrupamento pela fase completa, sem normalizar a série.
- **Correção:** `evolucao.js` com `serieDaFase()` combinando A + B na mesma rodada. Validado com teste Node (pontos/posições corretos).

### 4.3 Matching de streams não achava jogos da Champions

- **Sintoma:** "Transmissão ainda não disponível" mesmo com stream existente.
- **Causa:** comparava nomes literalmente (`Paris Saint-Germain FC` × `PSG`, `ŠK Slovan Bratislava` × `Slovan Bratislava`).
- **Correção:** `useStreams.js` normaliza nomes (remove acentos/pontuação e prefixos `FC|CF|SC|AC|SK|FK|...`) e usa alias (`psg` → "paris saint germain"). Resultado: **6/6** transmissões da Champions encontradas.

### 4.4 Acentos "corrompidos" no `brasileirao.json`

- Os acentos do JSON do Brasileirão apareciam corrompidos (`SǸrie`, `Cuiabǭ`) — problema **nos dados**, não no código (o app lê e exibe corretamente). Sem impacto funcional; dados da Champions já são gerados com acentos corretos.

---

## 5. Integração com APIs externas

| API | Uso | Ativação |
|---|---|---|
| `campeonato-brasileiro-api` (npm) | Dados do Brasileirão Série A/B (`gerar-jogos.js`) | grátis, sem chave |
| `football-data.org` | Jogos da Champions League (`scripts/gerar-champions.mjs`) | grátis, requer **chave no `.env`** |
| `api.reidoscanais.st` | Transmissões ao vivo (`useStreams.js`) | grátis, sem chave |

**Tokens/segredos:** a chave da football-data (**FOOTDATA_TOKEN**) fica **apenas** no `.env` local, que é ignorado pelo `.gitignore` — não vai para commit nem para o bundle.

---

## 6. Estrutura atual do projeto

```
bolao-green-v2/
├── android/                    # Projeto nativo Android (Capacitor)
├── assets/                     # Assets de origem do Capacitor
├── public/                     # Estáticos (logo, offline.html, ícones PWA)
├── scripts/
│   ├── gerar-brasileirao.mjs   # Gera brasileirao.json (Série A/B)
│   └── gerar-champions.mjs     # Gera champions-league.json + escudosChampions.js
├── src/
│   ├── components/             # Navbar, Layout, ThemeToggle, Modais, Splash...
│   ├── context/                # AuthContext, NotificationContext, ReadyContext
│   ├── data/
│   │   ├── brasileirao.json    # Dados gerados (Série A/B)
│   │   └── champions-league.json  # Dados gerados (Champions)
│   ├── hooks/                  # useTheme, useStreams, useUpdateChecker
│   ├── pages/                  # Login, Dashboard, Jogos, MeusPalpites, Ranking,
│   │                           # AoVivo, Perfil, Regras, Admin, Cadastro, ...
│   ├── services/firebase.js
│   ├── styles/theme.css        # CSS (tema claro/escuro)
│   ├── utils/
│   │   ├── calcularPontuacao.js
│   │   ├── evolucao.js         # Evolução por rodada (A+B normalizadas)
│   │   ├── escudos.js          # Escudos do Brasil (gerado) + fallback Champions
│   │   └── escudosChampions.js # Escudos da Champions (gerado)
│   └── main.jsx / App.jsx
├── gerar-jogos.js              # Gera brasileirao.json + escudos.js
├── database.rules.json         # Regras do Realtime Database
├── vite.config.js              # Inclui build.cssTarget: 'chrome87'
└── package.json
```

---

## 7. Git e versionamento

Últimos commits (estilo do repositório):

```
ab23916 Versão final e corrigida !         <- base atual
9d6a7d3 seg: remover google-services.json do versionamento
fda0308 Correção, rotas apresentavam problemas
7e4ffec Melhorias na estrutura do projeto
24976c3 Inclusao de api
b3c1827 Correções de segurança
bf00a54 Atualização para formato Brasileirão
```

> **Importante:** a sessão atual de melhorias (Champions, Regras, desempate, tema, perfil, evolução) ainda **não foi commitada**. Use `git status` para conferir os arquivos modificados antes do próximo commit.

---

## 8. Observações técnicas e ambiente

### Build e deploy
```bash
npm run build                 # build de produção em dist/
firebase deploy --only hosting  # publica PWA (https://bolao26-bbe2c.web.app)
```

> **Quirk do PowerShell (Windows):** comandos `npm run build` / `firebase deploy` podem "travar" no pipe por causa do stderr colorido. Solução usada nas sessões: redirecionar com `*> build-log.txt` (ou `deploy-log.txt`) e ler o arquivo depois.

### Rodadas
1. **Brasileirão:** `node gerar-jogos.js` → limpar/ajustar | Admin → **Importar Brasileirão**
2. **Champions:** `node scripts/gerar-champions.mjs` → Admin → **Importar Champions**

### Segurança
- Autorização (admin/user) decidida **nas regras do RTDB**; o front só esconde/mostra UI.
- Raiz do banco bloqueada (`.read/.write: false`); nós protegidos por `auth != null`.
- `google-services.json`, keystores e `.env` fora do git. Ver [SECURITY.md](./SECURITY.md).

### Decisões de produto
- **Não publicado na Play Store** (decisão do time: manter via hosting + APK direto).
- **Sem upgrade de plano Firebase** (Spark gratuito cobre Auth + RTDB + Hosting; Storage não é usado).