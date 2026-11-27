const HOSTS_PERMITIDOS = (import.meta.env.VITE_STREAMS_EMBED_HOSTS || "esportesembed.cc")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export function urlDeEmbedPermitida(valor) {
  if (typeof valor !== "string") return null;
  let url;
  try {
    url = new URL(valor);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  return HOSTS_PERMITIDOS.some((h) => host === h || host.endsWith(`.${h}`)) ? url.href : null;
}
