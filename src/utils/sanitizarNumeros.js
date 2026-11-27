const MAX_PLACAR_DIGITOS = 2;
const MAX_VALOR_DIGITOS = 7;

export function sanitizarPlacar(valor) {
  return String(valor ?? "").replace(/\D/g, "").slice(0, MAX_PLACAR_DIGITOS);
}

export function sanitizarValor(valor) {
  return String(valor ?? "").replace(/\D/g, "").slice(0, MAX_VALOR_DIGITOS);
}
