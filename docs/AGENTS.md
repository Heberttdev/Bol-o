# AGENTS.md — Manual para Agentes (Bolão Green)

> Guia de contexto para agentes de IA e devs. Leia isto antes de mexer no projeto.
> Visão geral do produto: [README.md](./README.md) · Histórico: [CHANGELOG.md](./CHANGELOG.md) · Segurança: [SECURITY.md](./SECURITY.md)

## 1. O que é o projeto

App de **bolão de futebol** (Brasileirão + Champions) onde usuários dão palpites de placar nos jogos, acompanham ranking e recebem notificações. Roda como **PWA** (web instalável) e como **APK Android** (Capacitor).

Além do bolão principal, existe o **Bolão Especial**: pools privados, criados **só pelo admin**, com jogos escolhidos ou personalizados, convidados selecionados da base de usuários, dinheiro real controlado **offline** (o app só registra valor/pagamento/vencedor — nunca dados de pagamento), e palpites de placar com ranking próprio.

Idioma do domínio e da UI: **português (pt-BR)**.

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, React Router 7 (**HashRouter**) |
| Build | Vite 8 + `vite-plugin-pwa` |
| Backend | Firebase Realtime Database + Auth (email/senha e Google) + Hosting |
| Push | `@capacitor/push-notifications` (FCM) no nativo; Notification API no web |
| Mobile | Capacitor 8 (Android) |
| Ícones | lucide-react |
| Lint/Teste | ESLint 10 (`eslint-plugin-react-hooks`), Vitest (`npm test`) |

## 3. Comandos

```bash
npm install
npm run dev            # Vite dev server
npm run lint           # ESLint (rode SEMPRE antes de finalizar)
npm run build          # build de produção em dist/
npm run test           # vitest run (se houver testes)
npm run preview        # preview do build
node gerar-jogos.js                  # (usado pelo dono) Série A + B → src/data/brasileirao.json + src/utils/escudos.js
node scripts/gerar-brasileirao.mjs   # alternativa antiga: só o brasileirao.json, sem escudos
node scripts/gerar-champions.mjs     # regenera src/data/champions-league.json
```

> **Windows/PowerShell:** para deploy evite `*>`; use `npx firebase deploy --non-interactive 2>&1 | Out-String | ForEach-Object { $_.Substring(0, [Math]::Min($_.Length, 4000)) }` com timeout alto.

## 4. Estrutura

```
src/
├── context/       AuthContext (user, loading), NotificationContext, ReadyContext
├── components/    Layout, TopBar, Navbar, AdminBoloesEspeciais, modais, guards...
├── pages/         Login, Cadastro, Dashboard, Jogos, MeusPalpites, Ranking,
│                  AoVivo, Admin, BoloesEspeciais, Perfil, Regras...
├── routes/        AppRoutes.jsx (rotas com lazy + ProtectedRoute)
├── services/      firebase.js (exporta `auth` e `database`)
├── utils/         escudos.js (getEscudo), escudosChampions.js,
│                  calcularPontuacao.js, rankingBolaoEspecial.js, evolucao.js,
│                  fases.js (competição/rodada), perfilPublico.js, migracoesAdmin.js
├── data/          brasileirao.json, champions-league.json (dados de jogos)
├── hooks/         useStreams, useUpdateChecker (aponta p/ GitHub Releases)
└── styles/        CSS (variáveis --text, --bg-elev, etc.)
scripts/           geradores de dados (mjs)
database.rules.json · firebase.json · capacitor.config.json · vite.config.js
```

## 5. Modelo de dados (Firebase Realtime Database)

Tudo em português. Registros usam o **uid** do Firebase Auth como chave onde aplicável.

- `users/{uid}` — `{ nome, email, role: "user"|"admin", createdAt, photoURL?, fcmToken?, fcmTokenUpdatedAt?, platform? }` — **privado** (só o dono e admin leem; campos fora da lista são rejeitados)
- `perfisPublicos/{uid}` — `{ nome, photoURL? }` — o que ranking/dashboard leem. Sempre gravar junto com `users/{uid}` via `salvarPerfilPublico` (`utils/perfilPublico.js`). `photoURL` só `https://`.
- `jogos/{jogoId}` — `{ id, casa, fora, fase, data (ISO c/ -03:00), estadio, lockAt (ms) }`
- `resultados/{jogoId}` — `{ casa, fora }` (placar oficial, definido pelo admin)
- `bets/{uid}/{jogoId}` — `{ casa, fora }` (palpite do bolão principal; só o dono lê)
- `palpitesPorJogo/{jogoId}/{uid}` — cópia de `bets` usada pelo ranking; legível só depois que o jogo trava. Gravar sempre via `gravarPalpite` (`services/palpites.js`), que escreve os dois caminhos de uma vez; o admin sincroniza palpites antigos ao abrir o painel
- `temporadas/{id}` — classificação final de uma temporada arquivada (`{ id, nome, competicoes, totalJogos, ranking: [{ uid, nome, photoURL?, pontos, exatos, palpites }], arquivadoEm }`); todos leem, só admin escreve. Tela `/temporadas`.
- `arquivo/{id}` — cópia completa (`jogos`, `resultados`, `bets`) da temporada arquivada; só admin.
- `notificacoes/{notifId}` — `{ id, titulo, corpo, tipo, link, createdAt }` — globais (regra rejeita `para`)
- `notificacoesUsuario/{uid}/{notifId}` — mesmo formato; direcionadas, só o destinatário (e admin) lê. `enviarNotificacao({ para })` grava aqui.
- `participantesBolao/{uid}/{bolaoId}` — `true` (índice para o convidado achar seus bolões)

### Bolões Especiais — `boloesEspeciais/{bolaoId}`

```
{
  id, nome, descricao, valorEntrada (number), status: "aberto"|"encerrado",
  criadoEm, criadoPor (uid admin),
  jogos: { [jogoId]: { casa, fora, data, fase, custom: bool, lockAt? } },   // custom = jogo personalizado; lockAt (ms) trava palpite na regra
  participantes: { [uid]: { nome, pago: bool, valorPago: number, entrouEm } },
  respostas:  { [uid]: "aceito"|"recusado" },                      // convidado escreve
  resultados: { [jogoId]: { casa, fora } },                        // admin escreve
  vencedor:   { uid, nome, premio, definidoEm } | null             // admin define
}
```

## 6. Regras e segurança (database.rules.json)

- Raiz **negada** (`.read/.write: false`); acesso é concedido por nó (padrão de cascata do RTDB: pai false **não** bloqueia filho que concede).
- **Autorização é decidida nas regras**, não no front. O front só esconde/mostra UI pelo `role`.
- Helper padrão: `root.child('users').child(auth.uid).child('role').val() == 'admin'`.
- `boloesEspeciais`: leitura admin **ou** participante; escrita só admin. Convidado escreve apenas `respostas/{uid}` (aceite/recusa). Palpites ficam fora do bolão, em `palpitesBolao/{bolaoId}/{jogoId}/{uid}` (`hooks/usePalpitesBolao.js`): o convidado escreve o próprio (só se aceito, bolão aberto, jogo existe no bolão, sem resultado e antes do `lockAt` quando houver) e lê o próprio sempre; os dos outros só depois do resultado do jogo.
- `executarMigracoesAdmin` (`utils/migracoesAdmin.js`) roda ao abrir o painel Admin: sincroniza `perfisPublicos`, move notificações legadas com `para` para `notificacoesUsuario` preenche `lockAt` dos jogos de bolões antigos, copia `bets` para `palpitesPorJogo` e move palpites antigos de bolões para `palpitesBolao`.
- `participantesBolao/{uid}`: só o próprio uid lê; admin escreve.
- **Nunca** commitar segredos. `.env` é gitignored e é o único lugar aceito para chaves. No cliente só chaves **públicas** (Firebase web config) — isso é esperado. Nunca embutir `service_role`/`sb_secret_`/token de bot.

## 7. Rotas

`/` (Login) · `/cadastro` · `/recuperar-senha` · `/dashboard` · `/jogos` · `/palpites` · `/ranking` · `/ao-vivo` · `/admin` · `/alterar-senha` · `/perfil` · `/regras` · `/boloes-especiais`

Rotas privadas usam `<ProtectedRoute>`. Lazy loading em `src/routes/AppRoutes.jsx`. Navegação via `HashRouter`.

## 8. Regras de negócio

- **Pontuação** (`utils/calcularPontuacao.js`): placar exato = **10**, vencedor certo = **5**, resto = **0**.
- **Palpite salva sozinho** em `Jogos.jsx` (debounce ~0,7s quando os dois placares estão preenchidos). `/palpites` é o **histórico** (pontos por rodada), não tela de palpitar.
- **Palpite trava** quando: o jogo começa (`lockAt`/`data`), já existe resultado, ou o bolão/jogo encerrou.
- **Ranking do bolão especial** (`utils/rankingBolaoEspecial.js`): `calcularRankingBolao(bolao)` soma os pontos de cada participante e ordena; usado no Admin e na página do convidado.

## 9. Fluxo do Bolão Especial

1. **Admin** (aba "Bolões Especiais" em `Admin.jsx` → `AdminBoloesEspeciais.jsx`): cria o bolão (nome, valor, descrição), adiciona **jogos futuros da lista** ou **jogos personalizados** (com escudo), seleciona **usuários cadastrados** e salva. Dispara **notificação direcionada** a cada convidado.
2. **Convidado** (`pages/BoloesEspeciais.jsx`): recebe o convite, **aceita/recusa**, dá os **palpites de placar** (só após aceitar) e vê o **ranking**.
3. **Admin** lança os **resultados** por jogo, e o **vencedor sugerido** pelo ranking é pré-selecionado — o admin confirma (define prêmio) e encerra.
4. Pagamentos: o admin marca **Pago/Não pago** e o **valor pago** por participante (botão na lista de participantes). Dinheiro é tratado **offline**.

## 10. PWA, auto-update e Capacitor

- `vite.config.js`: `registerType: 'autoUpdate'`, `injectRegister: false`, workbox com `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`.
- `src/main.jsx`: registro **manual** do SW (`/sw.js`, `updateViaCache: 'none'`), reload em `controllerchange`, checagem periódica + em `visibilitychange`.
- `firebase.json`: headers `Cache-Control: no-cache` para `/index.html` e `/sw.js`.
- `capacitor.config.json` usa `server.url = https://bolao26-bbe2c.web.app` → o APK carrega o site remoto, então **mudanças web chegam sem novo APK**. Rebuild só é necessário para mudanças **nativas** (plugins, ícone, splash, config). O PWA/APK instalado pode precisar de **1 refresh manual** na primeira atualização após mudar o SW.

## 11. Deploy

Project: `bolao26-bbe2c` · Realtime DB instance: `bolao26-bbe2c-default-rtdb` · Hosting: `https://bolao26-bbe2c.web.app`

```bash
npm run build
npx firebase deploy --only hosting      # só o site
npx firebase deploy --only database     # só regras (publica na hora, mesmo em dev)
npx firebase deploy                     # hosting + database
# APK:
npx cap sync android && npx cap open android
```

> **Atenção:** o dev (`npm run dev`) usa o **mesmo Firebase de produção**. Ao testar recursos novos que dependem de regras, publique as regras com `--only database`.

## 12. Convenções de código

- **Functional components + hooks.** Sem classes. Rotas com lazy.
- **Cores só por tokens** (`src/styles/tokens.css`, temas claro e escuro): `var(--c-*)`, nunca hex no componente. Cada cor tem um papel (ex.: `--c-gold` só pódio, `--c-live` só "ao vivo"). Prefira classes no CSS a `style={{…}}`; ao mexer num componente, troque o estilo inline que tocar.
- **Regras de jogo** (duração, status, trava do palpite) ficam em `utils/jogo.js`; o relógio da tela vem de `useAgora` (render puro, sem `new Date()` no corpo).
- **Sem comentários no código** salvo quando estritamente necessário. Código autoexplicativo.
- Nomes de domínio em **português** (`jogos`, `palpites`, `boloes`, `participantes`).
- Firebase: `onValue`/`ref` para leitura em tempo real, `set`/`update`/`remove` para escrita, `push` para gerar id.
- **Lint é estrito** (`react-hooks`): evite `set-state-in-effect` (não chame `setState` sincronamente no corpo de `useEffect`) e `purity` (não chame `Date.now()`/`new Date()` no render — faça dentro de callbacks/efeitos). Rode `npm run lint` antes de concluir.

## 13. Armadilhas (gotchas)

- **Notificações direcionadas** ficam em `notificacoesUsuario/{uid}` (protegidas por regra). `/notificacoes` é legível por qualquer autenticado — só conteúdo global.
- **Escudos**: `getEscudo(nome)` retorna URL ou `undefined` (UI cai em 🏳️). Times = chaves de `escudos` (Brasileirão) + `escudosChampions`. Use `<datalist>` para sugerir nomes e casar o escudo.
- **Jogos encerrados** não devem aparecer para criar bolão (filtro por `lockAt`/`data > agora`).
- **Chaves de notificação** incluem sufixo aleatório para evitar colisão no mesmo ms.
- Ao adicionar participante a um bolão, **sempre** criar também o índice `participantesBolao/{uid}/{bolaoId}`; ao remover o bolão, limpar os índices.
- **Não commitar** sem autorização explícita do usuário. Nunca commitar `.env`, keystore ou `google-services.json`.

## 14. Estado atual / roadmap

- Feature mais recente: **Bolões Especiais** (criar/convite/aceite/palpites/ranking/resultados/vencedor) — implementada e em produção.
- A feature **Apostas/Odds** foi **removida** por completo (página, rota, nó `apostas` no banco). Não recriar sem pedido explícito.
- `README.md` pode estar desatualizado em relação ao Bolão Especial — este arquivo é a fonte primária para agentes.

## Virada de temporada (Brasileirão)

Os IDs do Brasileirão não têm ano (`seriea-r1-casa-fora`), então a temporada seguinte reaproveitaria os mesmos IDs. Ao fim do Série A/B:

1. Importe as últimas rodadas e lance todos os resultados.
2. No Admin, **Arquivar temporada** (`services/temporadas.js` + `utils/temporada.js`): grava `arquivo/brasileirao-{ano}` e `temporadas/brasileirao-{ano}` e remove do ativo jogos, resultados, `bets` e `palpitesPorJogo` do Brasileirão (incluindo IDs legados com data). A Champions (`ucl-...`) continua no ranking.
3. Só então importe a temporada nova. A importação recusa jogos cujo ID já existe com data de outro ano (`colisoesDeTemporada`).

