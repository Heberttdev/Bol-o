// gerar-jogos.js
// Roda na raiz do projeto: node gerar-jogos.js
// Gera src/data/brasileirao.json E src/utils/escudos.js (escudos da própria API)

import { getCompetition } from 'campeonato-brasileiro-api';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function formatarHora(time) {
  return `${time || "00:00"} UTC-3`;
}

function gerarIdJogo(date, team1, team2) {
  const t1 = team1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const t2 = team2.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${date.replace(/-/g, "")}-${t1}-${t2}`;
}

function converterJogo(match, serie, roundNumber) {
  const team1 = match.homeTeam?.name || "A Definir";
  const team2 = match.awayTeam?.name || "A Definir";
  return {
    id: gerarIdJogo(match.date || "0000-00-00", team1, team2),
    round: `Série ${serie.toUpperCase()} - Rodada ${roundNumber}`,
    date: match.date || "",
    time: formatarHora(match.time),
    team1,
    team2,
    ground: match.venue || "",
    ...(match.status === "finished" && match.score
      ? { score: { ft: [match.score.home, match.score.away] } }
      : {}),
  };
}

// Extrai os escudos (badges) que a API retorna junto com a classificação
function extrairEscudos(data) {
  const mapa = {};
  for (const table of data.tables || []) {
    for (const entry of table.entries || []) {
      if (entry.team?.name && entry.team?.badge) {
        mapa[entry.team.name] = entry.team.badge;
      }
    }
  }
  return mapa;
}

async function buscarSerie(serie) {
  const jogos = [];
  let escudos = {};
  try {
    console.log(`Buscando Série ${serie.toUpperCase()}...`);
    const data = await getCompetition(serie);
    escudos = extrairEscudos(data);
    for (const round of data.rounds || []) {
      if (!round.matches) continue;
      for (const match of round.matches) {
        jogos.push(converterJogo(match, serie, round.number));
      }
    }
    console.log(`✓ Série ${serie.toUpperCase()}: ${jogos.length} jogos | ${Object.keys(escudos).length} escudos`);
  } catch (err) {
    console.error(`Erro na Série ${serie.toUpperCase()}:`, err.message);
  }
  return { jogos, escudos };
}

async function main() {
  console.log("Buscando dados do Brasileirão 2026...\n");

  const [serieA, serieB] = await Promise.all([buscarSerie("a"), buscarSerie("b")]);

  const todos = [...serieA.jogos, ...serieB.jogos];
  const escudos = { ...serieA.escudos, ...serieB.escudos };

  if (todos.length === 0) {
    console.error("Nenhum jogo encontrado. Verifique sua conexão.");
    process.exit(1);
  }

  todos.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  // 1) Salva os jogos
  mkdirSync(resolve(__dirname, "src/data"), { recursive: true });
  writeFileSync(
    resolve(__dirname, "src/data/brasileirao.json"),
    JSON.stringify({ matches: todos }, null, 2),
    "utf-8"
  );

  // 2) Gera o escudos.js automaticamente com os badges da API
  const conteudo = `// GERADO AUTOMATICAMENTE por gerar-jogos.js — não edite à mão
export const escudos = ${JSON.stringify(escudos, null, 2)};

export function getEscudo(nomeTime) {
  return escudos[nomeTime] || null;
}
`;
  writeFileSync(resolve(__dirname, "src/utils/escudos.js"), conteudo, "utf-8");

  console.log(`\n✅ ${todos.length} jogos salvos em src/data/brasileirao.json`);
  console.log(`✅ ${Object.keys(escudos).length} escudos salvos em src/utils/escudos.js`);
}

main();