# Bolão Green

Aplicativo de bolão do Campeonato Brasileiro onde os usuários fazem palpites em jogos, acompanham o ranking e se desafiam entre amigos. Disponível como **PWA** (instalável pelo navegador) e como **APK Android** (Capacitor).

> 📋 Histórico completo de atualizações, correções e melhorias: **[CHANGELOG.md](./CHANGELOG.md)**

## Funcionalidades

- **Cadastro/Login** — email/senha ou conta Google (login social via Capacitor Google Auth)
- **Dashboard** — próximo palpite, pontos/posição, desempenho da semana, jogos fechando em 24h
- **Jogos** — Brasileirão Série A/B e Champions; filtros por competição e rodada; palpite **salva sozinho** e trava no início do jogo (regra do servidor)
- **Histórico** (`/palpites`) — pontos, placares exatos, taxa de acerto e resultado rodada a rodada
- **Ranking** — geral e da semana (seg–dom, todas as competições), pódio e sua posição sempre visível
- **Bolões Especiais** — bolões privados criados pelo admin, com convite, aceite, palpites, ranking e vencedor (pagamento controlado offline)
- **Ao Vivo** — jogos em andamento e transmissão (StreamModal via iframe com sandbox)
- **Notificações** — avisos dentro do app (globais ou por usuário), com "lidas" sincronizadas entre aparelhos
- **Portal Admin** — jogos, resultados, importação (Brasileirão/Champions), notificações e bolões especiais
- **Atualizações** — no APK, aviso de nova versão via GitHub Releases
- **Tema claro/escuro**

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, React Router 7 (HashRouter) |
| Build | Vite 8 + `vite-plugin-pwa` |
| Backend | Firebase (Realtime Database, Auth, Cloud Messaging, Hosting) |
| Mobile | Capacitor 8 (Android) |
| Ícones | lucide-react, react-icons |
| Dados | `campeonato-brasileiro-api` |

## Estrutura do Projeto

```
bolao-green-v2/
├── android/                  # Projeto nativo Android (Capacitor)
├── assets/                   # Assets de origem do Capacitor (icon, splash)
├── public/                   # Arquivos estáticos (logo, offline.html, ícones PWA)
├── src/
│   ├── assets/               # Imagens
│   ├── components/           # Componentes de UI (Navbar, Modais, etc.)
│   ├── context/              # AuthContext, NotificationContext, ReadyContext
│   ├── data/                 # Dados gerados (brasileirao.json)
│   ├── hooks/                # useStreams, useUpdateChecker, useTheme
│   ├── utils/                # pontuação, ranking, semanas/fases, perfil público (com testes *.test.js)
│   ├── pages/                # Páginas (Login, Jogos, Ranking, Admin...)
│   ├── services/             # firebase.js (inicialização do Firebase)
│   ├── styles/               # CSS
│   └── main.jsx / App.jsx
├── database.rules.json       # Regras do Realtime Database
├── dist/                     # Build de produção (deploy)
├── capacitor.config.json
├── firebase.json
└── vite.config.js
```

## Configuração de Ambiente

### Pré-requisitos
- Node.js 20+
- Conta Firebase com projeto ativo
- (Opções) Android Studio + JDK para build do APK

### Variáveis de ambiente
Crie um arquivo `.env` na raiz (ele **não** deve ser commitado):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Credenciais reais são injetadas no bundle em build — isso é esperado em apps web Firebase. A segurança real fica nas **regras do banco (database.rules.json)** e nas **restrições de API key** no Console Google Cloud.

## Comandos

```bash
npm install          # Instalar dependências
npm run dev          # Servidor de desenvolvimento (Vite)
npm run build        # Build de produção em dist/
npm run preview      # Preview do build
npm run lint         # Lint ESLint
npm test             # Testes automáticos (Vitest)
node gerar-jogos.js  # Atualiza jogos da Série A/B e escudos
```

> A versão do app vem do campo `version` do `package.json`. Ao gerar um APK novo, suba a versão ali e crie a release no GitHub com a mesma tag (ex.: `v1.7`).

## Deploy

### Publicar o web app / PWA (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

O PWA é gerado automaticamente pelo `vite-plugin-pwa` (service worker + manifest). Após o deploy, ao acessar o link no Android aparece a opção de **instalar o PWA**.

### Gerar APK Android (Capacitor)

```bash
# Build do web app
npm run build

# Sincronizar com o projeto nativo
npx cap sync android

# Abrir no Android Studio e gerar o APK/AAB assinado
npx cap open android
```

**Arquivos sensíveis do Android (não versionados — estão no `.gitignore`):**
- `android/app/google-services.json` — configuração Firebase/Google do app
- `android/keystore.properties` — senhas do keystore de assinatura
- `*.keystore`, `*.jks`

## PWA

Configurado via `vite-plugin-pwa` em `vite.config.js`:
- `registerType: 'autoUpdate'`
- Service worker Workbox com precache de assets e fallback offline (`/offline.html`)
- Manifest com ícones `192x192` e `512x512` (com propósito `maskable`)
- Ícones gerados a partir de `public/logo-bolao.png`

**Requisito de instalação atendido:** app tem manifest válido, ícones presentes, service worker com fetch handler, e é servido via HTTPS.

## Segurança

Veja o documento dedicado: [SECURITY.md](./SECURITY.md) — inclui relatório de auditoria, recomendações e estado das correções aplicadas.

## Observações Técnicas

- Toda a autorização (papel de admin) é decidida nas **regras do Realtime Database** — o front apenas esconde/mostra UI baseado no `role` do usuário.
- Raiz bloqueada (`.read/.write: false`). Dados pessoais (`users/{uid}`: e-mail, token) só o dono e o admin leem; o ranking usa `perfisPublicos/{uid}` (nome e foto).
- Projeto roda no plano gratuito do Firebase (sem Cloud Functions). Por isso não há push com o app fechado e os palpites dos outros ficam visíveis antes do jogo.
- Para guia detalhado de agentes/devs, veja [AGENTS.md](./AGENTS.md).
- O app Capacitor usa `server.url` apontando para o site remoto (`https://bolao26-bbe2c.web.app`), ou seja, o APK carrega a mesma aplicação web.
