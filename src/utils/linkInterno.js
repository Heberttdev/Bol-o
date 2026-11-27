export const ROTAS_INTERNAS = [
  "/dashboard",
  "/jogos",
  "/palpites",
  "/ranking",
  "/ao-vivo",
  "/boloes-especiais",
  "/regras",
  "/temporadas",
  "/perfil",
];

// Aceita só rotas do app (com query simples opcional), ex.: "/jogos?jogo=abc".
export function linkInterno(link) {
  if (typeof link !== "string") return null;
  let r = link.trim();
  if (r.startsWith("#")) r = r.slice(1);
  if (!r) return null;
  if (!r.startsWith("/")) r = "/" + r;
  const m = r.match(/^(\/[a-z-]+)(\?[A-Za-z0-9=&_-]*)?$/);
  return m && ROTAS_INTERNAS.includes(m[1]) ? r : null;
}
