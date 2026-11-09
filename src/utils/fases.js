export function competicaoDaFase(fase) {
  const texto = String(fase || "").trim();
  if (!texto) return "Outros";
  const partes = texto.split(" - ");
  return partes.length > 1 ? partes[0] : texto;
}

export function nomeCurtoDaFase(fase) {
  const m = /rodada\s*(\d+)/i.exec(fase || "");
  return m ? `Rodada ${m[1]}` : fase;
}

export function ordenarFases(jogos) {
  const inicio = {};
  jogos.forEach((j) => {
    if (!j.fase) return;
    const t = new Date(j.data).getTime();
    if (!Number.isFinite(t)) return;
    if (inicio[j.fase] == null || t < inicio[j.fase]) inicio[j.fase] = t;
  });
  return Object.keys(inicio).sort((a, b) => inicio[a] - inicio[b]);
}

export function fasesAtuaisPorCompeticao(jogos, agora) {
  const atuais = {};
  [...jogos]
    .filter((j) => j?.data && new Date(j.data) >= agora)
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .forEach((j) => {
      const c = competicaoDaFase(j.fase);
      if (!atuais[c]) atuais[c] = j.fase;
    });
  return atuais;
}
