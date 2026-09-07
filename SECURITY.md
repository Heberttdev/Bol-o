# Segurança — Bolão Green

Documento de referência sobre a postura de segurança do projeto, auditoria realizada, itens aplicados e recomendações pendentes.

## Visão Geral do Modelo de Segurança

Este é um aplicativo **client-side** (web/PWA + APK Capacitor). Não há backend próprio; toda a lógica de negócio e autorização depende de:

1. **Firebase Authentication** — login via email/senha e Google (login social)
2. **Regras do Firebase Realtime Database** (`database.rules.json`) — a verdadeira camada de autorização
3. **Restrições de API key** no Console Google Cloud — controlam de onde/quem a chave pode ser usada

A renderização React com escape automático e a ausência de `dangerouslySetInnerHTML` protegem contra XSS clássico por injeção de HTML.

## Itens Aplicados (corrigidos)

### 1. Credenciais fora do versionamento
- **`google-services.json`** (Android) foi removido do rastreamento do git (`git rm --cached`) e adicionado ao `.gitignore`.
  - **Status:** aplicado no commit `9d6a7d3`
  - **Impacto:** o arquivo continua no disco (build Android intacto), apenas não é mais versionado.
- **`.env`** já constava no `.gitignore` e foi confirmado que **nunca foi commitado**.
- `android/keystore.properties` e `*.keystore`/`*.jks` já eram ignorados.

> **Nota sobre histórico:** as chaves ainda existem em commits antigos (ex.: `3f2dead` com a API key hardcoded em `firebase.js`). Como não foi reescrito o histórico, as restrições de API key abaixo são o mitigador ativo.

### 2. Restrição de API keys (Console Google Cloud)
As chaves foram restritas para limitar uso apenas ao domínio web e ao app Android.

- **Chave Web** (`AIzaSyAtcWusBYwGxvgEcNfbdbJ5Ws018G8oHhk`)
  - Restrição: **HTTP referrers** (`https://bolao26-bbe2c.web.app/*` + `localhost`)
  - Utilizada em runtime tanto pelo **site** quanto pelo **APK** (o APK carrega o site remoto via Capacitor)
- **Chave Android** (`AIzaSyBC1nOfpVrpMgG37Jvx6fh65qxRgBTm8fs`)
  - Restrição: aplicativo Android com package `com.bolao.green`
  - SHA-1 do keystore de release real: `1C:B3:0A:05:8B:27:0E:B4:61:85:C7:C0:4E:77:53:3C:E2:9B:41:28`
- **Status verificado:** Firebase Auth e Realtime Database respondem corretamente (sem `API_KEY_SERVICE_BLOCKED`); banco segue negando acesso sem autenticação (401).

> **Importante:** durante a configuração houve um bloqueio temporário do Firebase Auth (`API_KEY_SERVICE_BLOCKED`) porque a API **Identity Toolkit** não estava habilitada na restrição de API da chave web. Foi corrigido. Se voltar a ocorrer, habilite **Identity Toolkit API** nas restrições de API da chave.

## Postura de Segurança Atual (forças)

| Item | Situação |
|---|---|
| Regras do banco | Raiz bloqueada (`.read/.write: false`); nós exigem `auth != null` |
| Elevação de papel | Bloqueada por regra (`role` de `users/$uid` forçado a `'user'`) |
| Injeção HTML/JS | Sem `dangerouslySetInnerHTML`, `innerHTML` ou `eval` em todo `src/` |
| Armazenamento de tokens | Firebase Auth usa indexedDB; sem senhas/tokens em `localStorage` |
| HTTP não criptografado | `server.cleartext: false` no Capacitor |
| Permissões Android | `AndroidManifest` apenas com `INTERNET` |
| Palpites | Regra impedem palpites após `lockAt` ou após resultado publicado |

## Relatório de Auditoria

Lista completa de achados de segurança, com severidade. Para detalhes de localização (arquivo:linha), consulte o histórico da auditoria.

### Severidade Alta
1. **`google-services.json` versionado** — corrigido (item aplicado acima).
2. **iframe de API terceira sem validação** — `StreamModal.jsx` injeta `embed.embed_url` de `api.reidoscanais.st` em `<iframe>` sem allowlist de domínio/protocolo. Risco de clickjacking/phishing.

### Severidade Média
3. **Open redirect via `link` de notificações** — `window.location.hash = data.link` e `navigate(notif.link)` sem validação de rota externa; a regra `notificacoes` não valida o campo `link`.
4. **Exposição de dados em massa** — qualquer autenticado lê `users` (e-mails, `fcmToken`) e `bets` (todos os palpites).
5. **`photoURL` não validado** — usuário grava URL arbitrária renderizada no ranking (vetor de tracking/fingerprint).
6. **Headers de segurança ausentes** — sem CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS no `firebase.json`.
7. **Dependência RC de autenticação** — `@daniele-rolli/capacitor-google-auth@3.4.0-rc.6` não é versão estável.

### Severidade Baixa
8. **Campos extras aceitos** — `bets`/`users` sem `hasOnly` nas regras.
9. **Sem teto nos placares** — `casa/fora >= 0` sem limite superior.
10. **Contexto de notificação sem check admin no client** — proteção apenas via regra.
11. **`android:allowBackup="true"`** — backup de sessão para a nuvem do Google.
12. **Encoding corrompido em `brasileirao.json`** — nomes como `"Goiǭs"`, `"Sǜo Bernardo"` exibidos na UI.

## Recomendações Pendentes

Prioridade sugerida:

1. **Validar/allowlistar URLs de iframe** no `StreamModal.jsx` (aceitar apenas `https://` de providers confiáveis).
2. **Restringir leitura** de `users` (não expor `fcmToken`/e-mails em massa) e de `bets` (apenas próprio + agregações).
3. **Adicionar headers de segurança** no `firebase.json` (CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
4. **Validar o campo `link`** de notificações (client + regra) para permitir só rotas internas conhecidas.
5. **Validar `photoURL`** contra `https://` e domínios permitidos.
6. **Substituir a dependência RC** de Google Auth por versão estável e rodar `npm audit`.
7. **Limitar campos e teto de placares** nas regras (`hasOnly`, limites).

## Credenciais / Chaves — Registro

| Item | Valor (referência) | Uso | Compartilhamento |
|---|---|---|---|
| Chave web Firebase | `AIzaSyAtcWusBYwGxvgEcNfbdbJ5Ws018G8oHhk` | Site/PWA/APK (via `.env`) | Restrição por referrer |
| Chave Android Firebase | `AIzaSyBC1nOfpVrpMgG37Jvx6fh65qxRgBTm8fs` | `google-services.json` | Restrição por package + SHA-1 |
| OAuth client ID (Google) | `33072795427-pl4npka5oqms44juodci4grfohqpo65n.apps.googleusercontent.com` | Login Google | Não é segredo (público) |
| Keystore release | `android/bolao-green-release.keystore` | Assinatura do APK | **Segredo — não versionar** |

## Processo de Verificação Rápida

Após alterações de segurança, validar:
1. `firebase deploy --only hosting` reenvia `dist/`.
2. Acessar o site: login com email/senha **e** com Google.
3. Confirmar que o banco nega `/` sem auth (esperado 401).
4. (Android) Gerar APK e testar login + abertura de telas.
