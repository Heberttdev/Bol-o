# Bolão Green — Instruções de redesign para o Claude Code

> Cole este arquivo na raiz do repositório (ex.: `docs/REDESIGN.md`) e peça ao Claude Code:
> **"Leia docs/REDESIGN.md e execute a Fase 0. Pare ao final de cada fase e me mostre o diff."**

## Contexto

- App: Bolão Green — https://bolao26-bbe2c.web.app (React + Vite/rolldown, Firebase Auth/Firestore, Capacitor, `HashRouter`, ícones `lucide-react`).
- Público: uso principal no **celular** (Lighthouse foi rodado como mobile, 412px). Desktop é secundário.
- Direção visual aprovada: **“Arquibancada noturna”** — fundo verde-escuro, uma única cor de ação, dourado só para o pódio, placar em tipografia condensada.
- Referência visual (mockups): canvas “Bolão Green — Direção Visual” no Claude (quadros: Sistema visual, Início mobile, Dar palpite).

## Regras para o Claude Code

1. **Antes de editar, explore o repositório**: encontre onde ficam o CSS global (`index.css`/`App.css`), o `Layout`, o `Dashboard`, a tela de palpite, o ranking, o login e a função `calcularPontuacao`. Liste os arquivos que pretende mudar e espere aprovação.
2. **Não altere regras de negócio**: pontuação, regras de prazo de palpite, consultas ao Firestore e autenticação ficam como estão. Isto é um redesign de interface.
3. **Não altere `firebase.json`, regras do Firestore nem configs de deploy** sem pedir.
4. Trabalhe **uma fase por vez**, com commit separado por fase.
5. Substitua estilos inline (`style={{...}}`) por classes/tokens sempre que tocar num componente.
6. Mantenha o modo claro funcionando (existe um botão “Ativar tema claro”): todo token novo precisa de valor para `[data-theme="light"]`.
7. Ao final de cada fase, rode `npm run build` e `npm run lint` (se existir) e corrija erros.

---

## Problemas medidos (base do redesign)

| # | Problema | Evidência | Lei / critério |
|---|----------|-----------|----------------|
| 1 | Layout pula ao carregar | CLS **0,416** (Lighthouse); o card “Top 3” sozinho causa **0,378**; “Próximos Jogos” 0,027 | Doherty / Core Web Vitals (bom ≤ 0,1) |
| 2 | LCP lento | **5,4 s** (bom ≤ 2,5 s); “element render delay” 2,2 s | Core Web Vitals |
| 3 | Navegação sobrecarregada | 12 itens no topo: Dashboard, Jogos, Histórico, Bolões, Ranking, Ao vivo, Regras, Admin, Notificações, Senha, tema, Sair | Lei de Hick |
| 4 | Tipografia sem escala | **16** tamanhos de fonte diferentes no dashboard (11.2px a 32px, incluindo 12.16, 12.48, 13.76…) | Consistência / Jakob |
| 5 | Cores de texto demais | 7 cores de texto; dourado `#FFD700` usado em “Sair”, botão de tema **e** Top 3 | Von Restorff (destaque perde sentido) |
| 6 | Raios inconsistentes | 6 valores: 6, 8, 10, 12, 999px, 50% | Consistência |
| 7 | Alvos pequenos | itens do menu superior com **30px** de altura | Fitts / WCAG 2.5.8 (recomendado 44px) |
| 8 | Usuário fora do Top 3 não se vê | usuário está em 4º (175 pts) e o card mostra só 1º–3º | Gradiente de meta |
| 9 | Datas difíceis de ler | `26/10/2026, 19:30:00` (segundos, ano atual) | Carga cognitiva |
| 10 | Informação duplicada | “Sua posição na semana: #3” + badge “3” | Carga cognitiva |
| 11 | Semântica errada | números `175`, `4º`, `69` estão em `<h2>`; nenhum `<h1>`; nenhum `<main>` | WCAG 1.3.1 / Lighthouse `landmark-one-main` |
| 12 | Imagem superdimensionada | `shield-*.webp` 600×600 exibido em 155×155 (~29 KiB desperdiçados) | Performance |
| 13 | Botão secundário mais forte que o primário (login) | “Entrar com Google” branco sólido vs “Entrar” verde | Hierarquia visual |
| 14 | Cache curto | assets com hash servidos com TTL de 1h | Performance |

O que **já está bom** e não deve regredir: contraste de texto (0 falhas no dashboard), todos os botões com nome acessível, `lang="pt-br"`, viewport correto.

---

## Fase 0 — Tokens de design

Crie `src/styles/tokens.css` (importado antes de todo o resto) e migre o CSS existente para usar só estes tokens.

```css
:root {
  /* Cor — cada uma tem UM papel */
  --c-bg:          #0B1410; /* fundo (noite) */
  --c-surface:     #121D18; /* cards */
  --c-surface-2:   #182720; /* inputs, botões secundários, avatares */
  --c-border:      #22352C;
  --c-border-strong:#2E4639;
  --c-text:        #ECF3EE; /* 16,6:1 sobre --c-bg */
  --c-text-2:      #A7B8AE; /* 8,3:1 sobre --c-surface */
  --c-text-3:      #7E9187; /* 5,2:1 sobre --c-surface — só texto auxiliar */
  --c-action:      #2EE27F; /* SÓ ações e estado "salvo" */
  --c-on-action:   #06120C; /* 11,2:1 sobre --c-action */
  --c-gold:        #F5C542; /* SÓ pódio / troféu */
  --c-live:        #FF7A59; /* SÓ "ao vivo" e notificação nova */
  --c-action-soft: rgba(46,226,127,.14);
  --c-live-soft:   rgba(255,122,89,.16);

  /* Tipografia — 6 tamanhos */
  --font-body:    "Barlow", system-ui, sans-serif;
  --font-display: "Barlow Condensed", "Barlow", sans-serif; /* placar e números */
  --fs-12: .75rem;  --fs-14: .875rem; --fs-16: 1rem;
  --fs-20: 1.25rem; --fs-28: 1.75rem; --fs-40: 2.5rem;
  --fw-regular: 400; --fw-semibold: 600; --fw-bold: 700;

  /* Espaço — grade de 4px */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-6: 24px; --sp-8: 32px; --sp-12: 48px;

  /* Forma — 3 raios */
  --r-sm: 8px;    /* chips, inputs, linhas */
  --r-md: 14px;   /* cards, botões */
  --r-pill: 999px;

  /* Toque */
  --tap-min: 44px;
  --tap-score: 56px;
}

[data-theme="light"] {
  --c-bg: #F4F7F5; --c-surface: #FFFFFF; --c-surface-2: #EAF0EC;
  --c-border: #D6E0DA; --c-border-strong: #B9C8BF;
  --c-text: #0F1C16; --c-text-2: #4A5C52; --c-text-3: #5F7168;
  --c-action: #12A35A; --c-on-action: #FFFFFF;
  --c-gold: #9A6F00; --c-live: #C2410C;
  --c-action-soft: rgba(18,163,90,.12); --c-live-soft: rgba(194,65,12,.12);
}

body { background: var(--c-bg); color: var(--c-text); font-family: var(--font-body); }
.num { font-family: var(--font-display); font-variant-numeric: tabular-nums; font-weight: var(--fw-bold); }
```

Fontes: adicione no `index.html`
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;600&display=swap" rel="stylesheet">
```

**Critérios de aceite**
- `grep` por `#FFD700`, `#00FF88`, `font-size:` com valores fora da escala e `border-radius` fora de 8/14/999 retorna zero ocorrências em componentes (exceto `tokens.css`).
- Verificar contraste do tema claro com uma ferramenta (≥ 4.5:1 para texto normal) e ajustar se necessário.

---

## Fase 1 — Navegação (Lei de Hick + Fitts)

Refatore o `Layout`:

- **Mobile (< 768px):** barra inferior fixa com **5 abas**: Início, Jogos, Ranking, Bolões, Mais. Altura ≥ 64px + `env(safe-area-inset-bottom)`. Cada aba: ícone lucide 22px + rótulo 12px; aba ativa em `--c-action` com `aria-current="page"`.
- **“Mais”** abre uma tela/folha com: Histórico, Ao vivo, Regras, Senha (renomear para “Conta e senha”), Tema, Admin (só para admin), Sair.
- **Topo (mobile):** logo + nome à esquerda; à direita, sino de notificações (44×44, `aria-label="Notificações"`, ponto `--c-live` quando houver não lidas) e avatar que leva ao perfil.
- **Desktop (≥ 768px):** mesmos 5 destinos no topo, altura mínima dos itens 44px; os demais num menu “Mais”.
- O dourado sai do botão “Sair” e do botão de tema.
- Envolver o conteúdo das rotas em `<main id="conteudo">`.

**Aceite:** no máximo 5 destinos visíveis na navegação principal; todos os alvos ≥ 44×44px; Lighthouse sem falha `landmark-one-main`.

---

## Fase 2 — Dashboard (Início)

Nova ordem, de cima para baixo (hierarquia = prioridade da tarefa):

1. **Saudação + meta**: `<p>Olá, {nome}</p>` e `<h1>` com distância para a próxima posição, ex.: “Você está a **35 pts** do pódio” (calcular: pontos do 3º − pontos do usuário; se já estiver no pódio, “Você está em {n}º — segure a posição”; se 1º, “Você lidera por {x} pts”). Usar `--c-gold` só no número quando o alvo for o pódio.
2. **Card de palpite pendente** (só se houver jogo sem palpite): chip “N palpites pendentes”, times, competição/rodada, data relativa, **um único botão primário** “Dar meu palpite”. Se não houver pendências, mostrar “Tudo palpitado ✓” compacto (sem botão).
3. **Hoje**: lista dos jogos do dia com horário (`19:30`), times e chip de status do palpite (`Salvo 1 × 2` / `Pendente` / `Ao vivo 34'` / `Fechado`). Linha inteira clicável (altura ≥ 64px) abre a edição. Resumo no cabeçalho: “3 jogos · 3 de 3 palpitados”.
4. **Resumo**: uma faixa com 3 colunas (pontos · posição · palpites) — usar `<p>`/`<dl>`, **não** `<h2>`; números com classe `.num`.
5. **Ranking**: Top 3 + **linha do usuário sempre visível** (destacada com `--c-action-soft` e borda), mesmo se ele estiver fora do Top 3. Link “Ver todos”. Abaixo, linha discreta: “Semana passada: 3º lugar · +40 pts” (remover o badge duplicado).
6. **Bolões entre amigos**: linha de navegação (ícone, título, subtítulo, chevron).

**Estabilidade (CLS):**
- Todo bloco que depende do Firestore renderiza um **skeleton com a mesma altura final** enquanto carrega (Top 3 = 4 linhas × 44px + padding; Hoje = n linhas × 64px; resumo = altura fixa).
- Nunca inserir blocos acima de conteúdo já renderizado depois do carregamento.
- Imagens de escudo com `width`/`height` explícitos.

**Aceite:** CLS < 0,1 no Lighthouse mobile; nenhum número em heading; existe exatamente um `<h1>`.

---

## Fase 3 — Tela de palpite

- Cabeçalho: voltar (44×44, `aria-label="Voltar"`), “Seu palpite”, competição + data relativa.
- Aviso de prazo: “Você pode editar até o apito inicial” (ou contagem “Fecha em 2h 14min” quando faltar < 24h).
- Placar: para cada time, escudo, nome, botões **+** e **−** de **56×56px** (`aria-label="Mais um gol para {time}"`), valor em `.num` 72px dentro de `<output aria-live="polite">`. Limites 0–15.
- Atalhos “Placares mais comuns”: 1×0, 1×1, 2×1, 2×0 (botões com `aria-pressed`).
- Barra inferior fixa com botão primário que mostra o valor: “Salvar palpite 2 × 0”. Após salvar: mensagem `role="status"` “Palpite salvo: Flamengo 2 × 0 Atlético-MG” e o botão vira “Voltar ao início”.
- Manter o input numérico como alternativa acessível se já existir; não remover validações atuais.

**Aceite:** salvar um palpite exige ≤ 3 toques a partir do Início; nenhuma regra de prazo foi alterada.

---

## Fase 4 — Componentes e microcopy

- Criar componentes reutilizáveis: `Button` (primary/secondary/ghost, altura 52/48/44), `StatusChip` (pendente/salvo/ao-vivo/fechado — **sempre ícone + texto**, nunca só cor), `Card`, `ListRow`, `Skeleton`, `RankRow`.
- Regra: **um botão primário por tela**.
- Utilitário `formatarDataJogo(date)`:
  - hoje → “Hoje, 19:30”; amanhã → “Amanhã, 16:00”; mesma semana → “Qua, 19:30”; mesmo ano → “24 nov, 14:45”; outro ano → “24 nov 2027, 14:45”. Nunca mostrar segundos. Usar `Intl.DateTimeFormat('pt-BR', …)`.
- Login: “Entrar” primário; “Entrar com Google” vira secundário (`--c-surface-2` + borda), mantendo o logo do Google.
- Remover rótulos em CAIXA ALTA longos; usar caixa alta só nas etiquetas de seção de 12px.

---

## Fase 5 — Performance e acessibilidade

- `shield.webp`: gerar versões 160/320px e usar `srcset`/`sizes`; o LCP deve ser descobrível no HTML ou ter `fetchpriority="high"` se for a imagem principal.
- Adicionar `<link rel="preconnect" href="https://bolao26-bbe2c.firebaseapp.com">` (Lighthouse estima −380ms no LCP).
- `firebase.json` (**pedir aprovação antes**): `Cache-Control: public, max-age=31536000, immutable` para `/assets/**` (arquivos com hash).
- Adicionar `<meta name="description" content="…">`.
- Respeitar `prefers-reduced-motion` nas animações existentes (há animações de `filter`/`stroke` não compostas).
- Foco visível em todos os controles (`:focus-visible` com anel de 2px em `--c-action`, contraste ≥ 3:1).

---

## Checklist final (rodar e colar os números no PR)

- [ ] Lighthouse mobile: Performance ≥ 85, **CLS < 0,1**, **LCP < 2,5 s**, Acessibilidade 100.
- [ ] Navegação principal com 5 destinos; todos os alvos ≥ 44px.
- [ ] ≤ 6 tamanhos de fonte, 3 cores de texto, 3 raios (conferir com `getComputedStyle` em todos os elementos visíveis).
- [ ] Usuário sempre vê a própria posição no ranking da Início.
- [ ] Nenhuma data com segundos.
- [ ] Tema claro e escuro conferidos em 390px e 1280px.
- [ ] `npm run build` sem erros; regras de pontuação e prazos inalteradas.
