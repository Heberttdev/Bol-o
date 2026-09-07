# Bolão Green

Aplicativo de bolão do Campeonato Brasileiro onde os usuários fazem palpites em jogos, acompanham o ranking e se desafiam entre amigos. Disponível como **PWA** (instalável pelo navegador) e como **APK Android** (Capacitor).

## Funcionalidades

- **Cadastro/Login** — email/senha ou conta Google (login social via Capacitor Google Auth)
- **Dashboard** — visão geral do campeonato, próximos jogos e palpites rápidos
- **Jogos / Meus Palpites** — fazer e acompanhar palpites com bloqueio por horário de início e por resultado publicado
- **Ranking** — posições de todos os participantes com base nos acertos
- **Ao Vivo** — jogos em andamento com placar e transmissão (StreamModal via iframe)
- **Notificações** — push notifications (FCM) gerenciadas por administrador
- **Portal Admin** — gerenciar jogos, resultados, importar jogos do Brasileirão e disparar notificações
- **Atualizações** — verificação de nova versão via GitHub Releases

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
│   ├── hooks/                # useStreams, useUpdateChecker, data/
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
```

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
- O banco é protegido por `auth != null` na maioria dos nós e raiz bloqueada (`.read/.write: false`).
- O app Capacitor usa `server.url` apontando para o site remoto (`https://bolao26-bbe2c.web.app`), ou seja, o APK carrega a mesma aplicação web.
