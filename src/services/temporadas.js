import { ref, get, set, update } from "firebase/database";
import { database } from "./firebase";
import { planejarTodas } from "../utils/temporada";

async function lerNo(caminho) {
  const snap = await get(ref(database, caminho));
  return snap.exists() ? snap.val() : {};
}

export async function carregarPlanosArquivamento() {
  const [jogos, resultados, bets, perfis, temporadas] = await Promise.all([
    lerNo("jogos"),
    lerNo("resultados"),
    lerNo("bets"),
    lerNo("perfisPublicos"),
    lerNo("temporadas"),
  ]);
  return planejarTodas({ jogos, resultados, bets, perfis }).map((plano) => ({
    ...plano,
    finalizada: (plano.id && temporadas[plano.id]) || null,
  }));
}

// Registra campeão e classificação final. Os jogos continuam no ranking geral
// até a virada de temporada (limparDoRanking).
export async function finalizarCampeonato(plano) {
  if (!plano?.id) throw new Error("Nenhum jogo deste campeonato para finalizar.");
  const existente = await get(ref(database, `temporadas/${plano.id}`));
  if (existente.exists()) throw new Error(`${plano.temporada.nome} já foi finalizado.`);
  const arquivadoEm = Date.now();
  await set(ref(database, `arquivo/${plano.id}`), { ...plano.arquivo, arquivadoEm });
  await set(ref(database, `temporadas/${plano.id}`), { ...plano.temporada, arquivadoEm });
}

// Virada de temporada: atualiza a cópia guardada e tira o campeonato do ativo
// numa escrita única (ou sai tudo, ou nada).
export async function limparDoRanking(plano) {
  if (!plano?.id) throw new Error("Nenhum jogo deste campeonato para remover.");
  const existente = await get(ref(database, `temporadas/${plano.id}`));
  if (!existente.exists()) throw new Error(`Finalize ${plano.temporada.nome} antes de tirar do ranking.`);
  await set(ref(database, `arquivo/${plano.id}`), { ...plano.arquivo, arquivadoEm: existente.val().arquivadoEm || Date.now() });
  await update(ref(database), { ...plano.remocoes, [`temporadas/${plano.id}/removidoDoAtivoEm`]: Date.now() });
}
