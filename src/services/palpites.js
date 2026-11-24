import { ref, onValue, update } from "firebase/database";
import { database } from "./firebase";

// `bets/{uid}` só é legível pelo dono. A cópia em `palpitesPorJogo/{jogoId}`
// só abre para os outros depois que o jogo trava, então o ranking nunca vê
// palpites de jogos em aberto. As regras exigem que as duas cópias sejam iguais.
export function gravarPalpite(uid, jogoId, palpite) {
  return update(ref(database), {
    [`bets/${uid}/${jogoId}`]: palpite,
    [`palpitesPorJogo/${jogoId}/${uid}`]: palpite,
  });
}

// Entrega `{ [uid]: { [jogoId]: palpite } }` como o antigo nó `bets`: todos os
// palpites dos jogos com resultado + todos os palpites do próprio usuário.
export function escutarPalpitesDoRanking(uid, aoMudar, aoErro) {
  let meus = {};
  const porJogo = {};
  const assinaturas = new Map();
  let agendado = null;

  const emitir = () => {
    if (agendado) return;
    agendado = setTimeout(() => {
      agendado = null;
      const bets = {};
      Object.entries(porJogo).forEach(([jogoId, palpites]) => {
        Object.entries(palpites).forEach(([u, palpite]) => {
          (bets[u] ||= {})[jogoId] = palpite;
        });
      });
      if (uid) bets[uid] = { ...(bets[uid] || {}), ...meus };
      aoMudar(bets);
    }, 0);
  };

  const pararMeus = uid
    ? onValue(ref(database, `bets/${uid}`), (snap) => {
        meus = snap.val() || {};
        emitir();
      }, aoErro)
    : () => {};

  const pararResultados = onValue(ref(database, "resultados"), (snap) => {
    const ids = new Set(Object.keys(snap.val() || {}));
    ids.forEach((jogoId) => {
      if (assinaturas.has(jogoId)) return;
      assinaturas.set(jogoId, onValue(ref(database, `palpitesPorJogo/${jogoId}`), (s) => {
        porJogo[jogoId] = s.val() || {};
        emitir();
      }, aoErro));
    });
    assinaturas.forEach((parar, jogoId) => {
      if (ids.has(jogoId)) return;
      parar();
      assinaturas.delete(jogoId);
      delete porJogo[jogoId];
    });
    emitir();
  }, aoErro);

  return () => {
    clearTimeout(agendado);
    pararMeus();
    pararResultados();
    assinaturas.forEach((parar) => parar());
  };
}
