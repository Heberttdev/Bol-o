import { ref, get, set, update, remove } from "firebase/database";
import { database } from "../services/firebase";
import { montarPerfilPublico } from "./perfilPublico";

async function lerNo(caminho) {
  const snap = await get(ref(database, caminho));
  return snap.exists() ? snap.val() : {};
}

function mesmoPerfil(a, b) {
  return a?.nome === b?.nome && (a?.photoURL || null) === (b?.photoURL || null);
}

export async function executarMigracoesAdmin() {
  const [users, perfis, notificacoes, boloes, jogos] = await Promise.all([
    lerNo("users"),
    lerNo("perfisPublicos"),
    lerNo("notificacoes"),
    lerNo("boloesEspeciais"),
    lerNo("jogos"),
  ]);

  const tarefas = [];

  Object.entries(users).forEach(([uid, dados]) => {
    const perfil = montarPerfilPublico(dados);
    if (!mesmoPerfil(perfil, perfis[uid])) {
      tarefas.push(() => set(ref(database, `perfisPublicos/${uid}`), perfil));
    }
  });

  Object.entries(notificacoes).forEach(([id, n]) => {
    if (!n?.para) return;
    const { para, ...resto } = n;
    tarefas.push(async () => {
      await set(ref(database, `notificacoesUsuario/${para}/${id}`), resto).catch(() => {});
      await remove(ref(database, `notificacoes/${id}`));
    });
  });

  Object.entries(boloes).forEach(([bolaoId, bolao]) => {
    Object.entries(bolao?.jogos || {}).forEach(([jogoId, j]) => {
      const lockAt = jogos[jogoId]?.lockAt;
      if (j?.custom || j?.lockAt != null || typeof lockAt !== "number") return;
      tarefas.push(() => update(ref(database, `boloesEspeciais/${bolaoId}/jogos/${jogoId}`), { lockAt }));
    });
  });

  const resultados = await Promise.allSettled(tarefas.map((t) => t()));
  const falhas = resultados.filter((r) => r.status === "rejected").length;
  if (falhas) console.warn(`Migrações admin: ${falhas} de ${tarefas.length} falharam.`);
  return { total: tarefas.length, falhas };
}

const sanitizarTime = (nome) => (nome || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const parDeTimes = (a, b) => `${sanitizarTime(a)}-${sanitizarTime(b)}`;

// Remove APENAS as duplicatas de ID-legado (prefixo de data, ex.: "20261031-...")
// cujo par de times bate com um jogo da lista atual — ou seja, a entrada antiga
// do mesmo jogo que foi reimportado com o ID estável novo. Rodadas passadas e
// Champions ficam intactas. NÃO toca em `resultados` nem `bets`: o ranking soma
// palpite×resultado por ID, então apagar esses zeraria pontos do histórico.
// Jogo órfão some só da lista de jogos; o ponto do ranking permanece.
export async function limparJogosOrfaos(matchesAtuais) {
  const paresAtuais = new Set(
    (matchesAtuais || []).map((m) => parDeTimes(m.team1, m.team2))
  );
  const jogos = await lerNo("jogos");
  const orfaos = Object.entries(jogos)
    .filter(([id, j]) => /^\d{8}-/.test(id) && paresAtuais.has(parDeTimes(j?.casa, j?.fora)))
    .map(([id]) => id);
  const resultado = await Promise.allSettled(
    orfaos.map((id) => remove(ref(database, `jogos/${id}`)))
  );
  const falhas = resultado.filter((r) => r.status === "rejected").length;
  return { removidos: orfaos.length - falhas, falhas, ids: orfaos };
}
