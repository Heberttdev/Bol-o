// scripts/gerar-champions.mjs
// Roda na raiz do projeto: node scripts/gerar-champions.mjs
// Lê o token em .env (linha FOOTDATA_TOKEN=...)
// Gera src/data/champions-league.json E src/utils/escudosChampions.js (escudos da própria API)

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_URL = "https://api.football-data.org/v4/competitions/CL/matches?season=2026";

function carregarToken() {
  const raw = readFileSync(resolve(__dirname, "../.env"), "utf-8");
  const linha = raw.split(/\r?\n/).find((l) => l.trim().startsWith("FOOTDATA_TOKEN="));
  const token = linha ? linha.slice("FOOTDATA_TOKEN=".length).trim() : "";
  if (!token) {
    console.error("FOOTDATA_TOKEN não encontrado em .env");
    process.exit(1);
  }
  return token;
}

function formatarHora(time) {
  return `${time || "00:00"} UTC-3`;
}

// Converte UTC (da API) para o horário de Brasília (UTC-3)
function converterData(utcDate) {
  const d = new Date(utcDate);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value || "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

// Gera ID estável para não perder palpites em reimportações
function gerarIdJogo(date, team1, team2) {
  const t1 = team1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const t2 = team2.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `ucl-${date.replace(/-/g, "")}-${t1}-${t2}`;
}

const NOME_FASES = {
  ROUND_OF_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinais",
  FINAL: "Final",
  QUALIFICATION: "Eliminatórias",
};

function converterJogo(match, escudos) {
  const team1 = match.homeTeam?.name || "A Definir";
  const team2 = match.awayTeam?.name || "A Definir";
  const { date, time } = converterData(match.utcDate);
  const id = gerarIdJogo(date, team1, team2);

  if (match.homeTeam?.crest) escudos[team1] = match.homeTeam.crest;
  if (match.awayTeam?.crest) escudos[team2] = match.awayTeam.crest;

  const round =
    match.stage === "LEAGUE_STAGE"
      ? `Liga dos Campeões - Rodada ${match.matchday || 1}`
      : `Liga dos Campeões - ${NOME_FASES[match.stage] || match.stage || "Rodada"}`;

  return {
    id,
    round,
    date,
    time: formatarHora(time),
    team1,
    team2,
    ground: match.venue || "",
    ...(match.status === "FINISHED" && match.score?.fullTime?.home != null
      ? { score: { ft: [match.score.fullTime.home, match.score.fullTime.away] } }
      : {}),
  };
}

async function main() {
  const token = carregarToken();
  console.log("Buscando jogos da UEFA Champions League 2026-27...\n");

  const res = await fetch(API_URL, { headers: { "X-Auth-Token": token } });
  if (!res.ok) {
    const texto = (await res.text()).slice(0, 300);
    console.error(`Erro da API (HTTP ${res.status}):`, texto);
    process.exit(1);
  }
  const data = await res.json();
  const matches = data.matches || [];

  if (matches.length === 0) {
    console.error("Nenhum jogo encontrado. Verifique token e temporada.");
    process.exit(1);
  }

  const escudos = {};
  const todos = matches.map((m) => converterJogo(m, escudos));
  todos.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  // 1) Salva os jogos
  const caminhoJogos = resolve(__dirname, "../src/data/champions-league.json");
  mkdirSync(dirname(caminhoJogos), { recursive: true });
  writeFileSync(caminhoJogos, JSON.stringify({ matches: todos }, null, 2), "utf-8");

  // 2) Gera os escudos da Champions
  const caminhoEscudos = resolve(__dirname, "../src/utils/escudosChampions.js");
  const conteudo = `// GERADO AUTOMATICAMENTE por scripts/gerar-champions.mjs — não edite à mão
export const escudosChampions = ${JSON.stringify(escudos, null, 2)};
`;
  writeFileSync(caminhoEscudos, conteudo, "utf-8");

  const fases = [...new Set(todos.map((j) => j.round))];
  console.log(`\n✅ ${todos.length} jogos gerados em src/data/champions-league.json`);
  console.log(`✅ ${Object.keys(escudos).length} escudos salvos em src/utils/escudosChampions.js`);
  console.log(`   Fases: ${fases.join(" | ")}`);
  console.log(`   Jogos com placar: ${todos.filter((j) => j.score).length}`);
}

main();