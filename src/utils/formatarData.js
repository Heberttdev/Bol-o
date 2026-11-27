// Formatação de datas de jogo em pt-BR, sem segundos, relativa quando perto.
// hoje → "Hoje, 19:30"; amanhã → "Amanhã, 16:00"; mesma semana → "Qua, 19:30";
// mesmo ano → "24 nov, 14:45"; outro ano → "24 nov 2027, 14:45".

const fmtHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fmtDiaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const fmtDiaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const fmtDiaMesAno = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function soData(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function capitalizar(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Só o horário ("19:30").
export function horaJogo(data) {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";
  return fmtHora.format(d);
}

export function formatarDataJogo(data) {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";

  const hoje = soData(new Date());
  const alvo = soData(d);
  const diffDias = Math.round((alvo - hoje) / 86400000);
  const hora = fmtHora.format(d);

  if (diffDias === 0) return `Hoje, ${hora}`;
  if (diffDias === 1) return `Amanhã, ${hora}`;
  if (diffDias > 1 && diffDias < 7) {
    return `${capitalizar(fmtDiaSemana.format(d).replace(".", ""))}, ${hora}`;
  }
  if (d.getFullYear() === new Date().getFullYear()) {
    return `${fmtDiaMes.format(d).replace(".", "")}, ${hora}`;
  }
  return `${fmtDiaMesAno.format(d).replace(".", "")}, ${hora}`;
}

// Mesmo dia-calendário que agora?
export function ehHoje(data) {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return false;
  return soData(d).getTime() === soData(new Date()).getTime();
}
