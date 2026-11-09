# Bolão Green — Redesign, rodada 2 (correções pós-auditoria de 08/11/2026)

> Coloque este arquivo em `docs/REDESIGN-2.md` e peça ao Claude Code:
> **"Leia docs/REDESIGN-2.md e execute o Bloco A. Pare ao final de cada bloco e me mostre o diff."**

## Contexto

- App: https://bolao26-bbe2c.web.app (React + Vite, Firebase, `HashRouter`, `lucide-react`).
- A rodada 1 (`docs/REDESIGN.md`) já foi aplicada e funcionou. Medido em 08/11: CLS 0,016 (era 0,416), 5 itens na navegação, 5 tamanhos de fonte, `<main>`/`<h1>` presentes, cache `immutable`, 0 falhas de contraste. **Nada disso pode regredir.**
- Esta rodada corrige 11 pontos encontrados na auditoria de 08/11.

## Regras para o Claude Code

1. Antes de editar, localize os arquivos de cada item (tela de palpite, menu "Mais", rotas, Ranking, Dashboard, header/avatar, tokens). Liste-os e espere aprovação.
2. **Não altere regras de negócio**: cálculo de pontos, prazos de palpite, consultas ao Firestore e autenticação ficam como estão. O item A2 muda só a interface: o valor salvo continua sendo o mesmo tipo de dado.
3. Use os tokens de `src/styles/tokens.css`. Não crie cores novas fora deles.
4. Um commit por bloco. Ao final de cada bloco rode `npm run build` e `npm run lint` (se existir) e corrija os erros.
5. Mantenha o tema claro funcionando em tudo que tocar.

---

## Bloco A — Tela de palpite (prioridade máxima)

### A1. Restaurar o placar grande
**Hoje:** a ordem vertical é `−` (em cima), `+`, e o número é um `<input>` de 16 px com 56×33 px — o placar é o elemento menos visível da tela.
**Fazer:** para cada time, de cima para baixo: escudo → nome → botão **+** (56×56) → **número** → botão **−** (56×56).
- O número usa `--font-display`, `font-variant-numeric: tabular-nums`, peso 700, **≥ 64 px**, dentro de `<output aria-live="polite">`.
- A digitação continua disponível como alternativa acessível: tocar no número abre a edição (`inputmode="numeric"`, 0–15), com área de toque ≥ 44×44.
- Um `×` em `--c-text-3` entre os dois placares.
- Em tela de 390×844 o placar inteiro (os dois times, botões e números) cabe sem rolar, acima do botão Salvar.

### A2. Impedir salvar 0 × 0 sem querer
**Hoje:** o botão nasce como "Salvar palpite 0 × 0"; um toque grava esse placar.
**Fazer:**
- Palpite novo: placares começam **vazios** (exibir `–`). O botão fica desabilitado com o texto **"Escolha o placar"** até os dois lados terem valor. Tocar em `+` num lado vazio define 1; tocar em `−` num lado vazio define 0.
- Palpite existente: carregar os valores salvos e mostrar "Salvar alteração 2 × 0" só depois de alguma mudança; sem mudança, o botão diz "Palpite salvo" e fica desabilitado.
- Os atalhos (1×0, 1×1, 2×1, 2×0) preenchem os dois lados de uma vez.
- 0 × 0 continua sendo um palpite válido quando escolhido de propósito.

### A3. Ícone do prazo
**Hoje:** "Fecha em 4h 33min" usa um cadeado, que sugere jogo já fechado.
**Fazer:** usar o ícone `Clock` do lucide enquanto o palpite está aberto. O cadeado (`Lock`) só aparece quando o prazo já passou, com o texto "Palpites encerrados".

**Aceite do Bloco A:** em 390×844 o placar fica visível sem rolar; não é possível salvar sem escolher os dois valores num palpite novo; o fluxo Início → palpite → salvo continua em ≤ 3 toques.

---

## Bloco B — Navegação e robustez

### B1. Menu "Mais" acessível
**Hoje:** sem `role="dialog"`, o Esc não fecha, o foco fica no botão "Mais" e não há botão Fechar.
**Fazer:**
- Container com `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apontando para um título visível ("Mais").
- Ao abrir, mover o foco para o primeiro item; prender o foco dentro do menu enquanto estiver aberto.
- Fechar com **Esc**, toque no fundo escurecido e um botão **Fechar** (44×44, `aria-label="Fechar menu"`).
- Ao fechar, devolver o foco ao botão "Mais".
- Bloquear a rolagem do fundo enquanto aberto.

### B2. Rotas desconhecidas
**Hoje:** `#/mais` (e qualquer rota inexistente) mostra uma tela totalmente vazia, sem navegação.
**Fazer:** adicionar uma rota coringa `path="*"` dentro do layout autenticado que mostra "Página não encontrada" com um botão primário "Voltar ao início" (e mantém a barra inferior). Para usuário não logado, redirecionar ao login.

### B3. Foco escondido pela barra inferior
**Hoje:** navegando com Tab, o item focado para atrás da barra inferior fixa (WCAG 2.4.11).
**Fazer:** em `html`, `scroll-padding-bottom: calc(var(--altura-barra-inferior) + 16px)` e `scroll-padding-top` igual à altura do header. Definir `--altura-barra-inferior` no layout.

**Aceite do Bloco B:** menu "Mais" abre, fecha com Esc e devolve o foco; `#/qualquer-coisa` mostra a página de erro com navegação; ao tabular pela Início, nenhum item focado fica coberto.

---

## Bloco C — Textos e dados

### C1. Plural e preposição
- "26 placar exatos" → **"26 placares exatos"**. Criar um helper `plural(n, 'placar exato', 'placares exatos')` e usar em todo lugar que mostra contagem (palpites, jogos, pontos, placares).
- "#3 EM ESTA SEMANA" → **"3º nesta semana"**.
- Rodar uma busca no código por outras contagens concatenadas sem tratar o singular/plural.

### C2. Uma única notação de posição
**Hoje:** "#3" e "3º" aparecem na mesma tela.
**Fazer:** usar **"3º"** em todo o app (Início, Ranking, cards de evolução, compartilhamento). Criar `formatarPosicao(n)`.

### C3. Gráfico "Sua evolução" sem semanas faltando
**Hoje:** o eixo pula 21/09 e 12/10 — semanas sem pontos somem e o gráfico engana.
**Fazer:** gerar a série com **todas** as semanas entre a primeira e a atual, preenchendo com 0 as semanas sem pontos. Destacar a semana atual. Não alterar como os pontos são calculados.

### C4. Contador de pendentes
**Hoje:** o chip diz "75 palpites pendentes" acima de um único jogo.
**Fazer:** contar só os jogos dos **próximos 7 dias** sem palpite: "3 pendentes esta semana". Se houver mais jogos abertos depois disso, um link discreto "Ver todos os jogos abertos (75)" leva à aba Jogos.

**Aceite do Bloco C:** nenhuma ocorrência de "placar exatos", "#3" ou "em esta" no app; o gráfico tem uma barra por semana, sem saltos.

---

## Bloco D — Detalhes visuais e performance

### D1. Avatar do header
**Hoje:** mostra "?", enquanto o Ranking mostra "TC" para o mesmo usuário.
**Fazer:** extrair a lógica de iniciais do Ranking para um componente `Avatar` único (foto → iniciais do nome → inicial do e-mail) e usar no header, no Ranking e na Início. O botão do header tem `aria-label="Seu perfil"`.

### D2. Alvo de toque "Ver todos"
**Hoje:** 59×21 px.
**Fazer:** `min-height: var(--tap-min)` e padding horizontal, mantendo a aparência de link.

### D3. Barra fixa "Você" no Ranking
**Hoje:** cobre o gráfico mesmo quando o usuário já aparece na lista.
**Fazer:** mostrar a barra fixa só quando a linha do usuário na lista **não** estiver visível (`IntersectionObserver`). Ela fica acima da barra inferior, nunca sobre o gráfico.

### D4. Cores fora dos tokens
- "Sair" usa `#FF3B3B` → criar `--c-danger` em `tokens.css` (escuro e claro, contraste ≥ 4,5:1 sobre `--c-surface`) e usar só para ações destrutivas.
- Rótulos inativos da barra inferior usam `rgba(255,255,255,.72)` → `--c-text-2`.
- Buscar no código por cores literais (`#`, `rgb(`, `rgba(`) fora de `tokens.css` e substituir pelos tokens.

### D5. Textos redundantes e semântica
- Card "Bolões entre amigos": trocar o subtítulo repetido por algo útil, ex.: "Crie um bolão e convide a galera" ou "Você participa de N bolões".
- Na Início, o título da partida (hoje `<h3>`) vem antes dos `<h2>` "Hoje" e "Classificação": tornar o card de palpite uma `<section>` com `<h2>` (visualmente igual), para a ordem ficar h1 → h2.

### D6. Logo
**Hoje:** `logo-bolao.png` 300×300 exibido a 32×32, sem `width`/`height`.
**Fazer:** gerar versões 32/64 px (ou usar SVG), `srcset` com 1x/2x, e `width="32" height="32"` no `<img>`.

**Aceite do Bloco D:** o header mostra as iniciais corretas; nenhum controle abaixo de 44 px; nenhuma cor literal fora de `tokens.css`.

---

## Checklist final (colar os números no PR)

- [ ] Lighthouse **mobile**: CLS < 0,1, LCP < 2,5 s, Acessibilidade 100.
- [ ] Nada da rodada 1 regrediu: 5 itens na navegação, ≤ 6 tamanhos de fonte, `<main>` e um `<h1>`, cache `immutable`, 0 falhas de contraste.
- [ ] Palpite novo não salva sem escolha; 0 × 0 continua possível de propósito.
- [ ] Menu "Mais" funciona só com teclado.
- [ ] Rota inexistente mostra a página de erro.
- [ ] Textos: plural correto, "3º" em todo o app, gráfico sem semanas faltando.
- [ ] Tema claro e escuro conferidos em 390 px e 1280 px.
- [ ] `npm run build` sem erros; pontuação e prazos inalterados.
