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
