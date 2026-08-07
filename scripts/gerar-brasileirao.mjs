// scripts/gerar-brasileirao.mjs
import { getCompetition } from 'campeonato-brasileiro-api';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function formatarHora(time) {
  return `${time || "00:00"} UTC-3`;
}

// Gera ID estável para não perder palpites em reimportações
function gerarIdJogo(date, team1, team2) {
  const t1 = team1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const t2 = team2.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${date.replace(/-/g, "")}-${t1}-${t2}`;
}

function converterJogo(match, serie, roundNumber) {
  const team1 = match.homeTeam?.name || "A Definir";
  const team2 = match.awayTeam?.name || "A Definir";
  const id = gerarIdJogo(match.date || "0000-00-00", team1, team2);
  
  return {
    id,
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

async function buscarTodosJogos(serie) {
  const jogos = [];
  try {
    console.log(`Buscando Série ${serie.toUpperCase()}...`);
    const data = await getCompetition(serie);
    if (!data?.rounds?.length) {
      console.warn(`Nenhuma rodada encontrada para Série ${serie.toUpperCase()}`);
      return jogos;
    }
    for (const round of data.rounds) {
      if (!round.matches) continue;
      for (const match of round.matches) {
        jogos.push(converterJogo(match, serie, round.number));
      }
    }
    console.log(`✓ Série ${serie.toUpperCase()}: ${jogos.length} jogos encontrados`);
  } catch (err) {
    console.error(`Erro na Série ${serie.toUpperCase()}:`, err.message);
  }
  return jogos;
}

async function main() {
  console.log("Buscando jogos do Brasileirão 2026...\n");
  
  const [jogosA, jogosB] = await Promise.all([
    buscarTodosJogos("a"),
    buscarTodosJogos("b"),
  ]);
  
  const todos = [...jogosA, ...jogosB];
  
  if (todos.length === 0) {
    console.error("Nenhum jogo encontrado. Verifique sua conexão.");
    process.exit(1);
  }
  
  // Ordena por data
  todos.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  
  const caminho = resolve(__dirname, "../src/data/brasileirao.json");
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, JSON.stringify({ matches: todos }, null, 2), "utf-8");
  
  console.log(`\n✅ ${todos.length} jogos gerados em src/data/brasileirao.json`);
  console.log(`   Série A: ${jogosA.length} jogos`);
  console.log(`   Série B: ${jogosB.length} jogos`);
}

main();