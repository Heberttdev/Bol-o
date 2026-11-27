import { ref, get, set, update } from "firebase/database";
import { database } from "./firebase";
import { planejarTodas } from "../utils/temporada";

async function lerNo(caminho) {
  const snap = await get(ref(database, caminho));
  return snap.exists() ? snap.val() : {};
}

export async function carregarPlanosArquivamento() {
  const [jogos, resultados, bets, perfis] = await Promise.all([
    lerNo("jogos"),
    lerNo("resultados"),
    lerNo("bets"),
    lerNo("perfisPublicos"),
  ]);
  return planejarTodas({ jogos, resultados, bets, perfis });
}

// Ordem: cópia completa (só admin) → classificação final (todos) → remoção do ativo.
// A remoção é uma escrita única: ou sai tudo do ranking ativo, ou nada.
export async function executarArquivamento(plano) {
  if (!plano?.id) throw new Error("Nenhum jogo deste campeonato para encerrar.");
  const existente = await get(ref(database, `temporadas/${plano.id}`));
  if (existente.exists()) throw new Error(`${plano.temporada.nome} já foi encerrado.`);
  const arquivadoEm = Date.now();
  await set(ref(database, `arquivo/${plano.id}`), { ...plano.arquivo, arquivadoEm });
  await set(ref(database, `temporadas/${plano.id}`), { ...plano.temporada, arquivadoEm });
  await update(ref(database), plano.remocoes);
}
