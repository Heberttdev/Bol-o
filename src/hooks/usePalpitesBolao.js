import { useEffect, useMemo, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { database } from "../services/firebase";

// Palpites em `palpitesBolao/{bolaoId}/{jogoId}/{uid}`. Cada participante lê o
// próprio palpite sempre; os dos outros só depois do resultado do jogo.
export function gravarPalpiteBolao(bolaoId, jogoId, uid, palpite) {
  return set(ref(database, `palpitesBolao/${bolaoId}/${jogoId}/${uid}`), palpite);
}

// Converte `{ [jogoId]: { [uid]: palpite } }` no formato `{ [uid]: { [jogoId]: palpite } }`.
export function porParticipante(porJogo) {
  const saida = {};
  Object.entries(porJogo || {}).forEach(([jogoId, palpites]) => {
    Object.entries(palpites || {}).forEach(([uid, p]) => {
      (saida[uid] ||= {})[jogoId] = p;
    });
  });
  return saida;
}

// Retorna `{ [bolaoId]: { [uid]: { [jogoId]: palpite } } }` para os bolões do usuário.
export function usePalpitesBolao(boloes, uid) {
  const [porBolao, setPorBolao] = useState({});

  const assinaturas = useMemo(() => {
    if (!uid) return "";
    return Object.entries(boloes || {})
      .flatMap(([bolaoId, b]) =>
        Object.keys(b?.jogos || {}).map((jogoId) => `${bolaoId}/${jogoId}/${b?.resultados?.[jogoId] ? 1 : 0}`)
      )
      .sort()
      .join(",");
  }, [boloes, uid]);

  useEffect(() => {
    if (!assinaturas) return undefined;
    const dados = {};
    const parar = assinaturas.split(",").map((item) => {
      const [bolaoId, jogoId, comResultado] = item.split("/");
      const todos = comResultado === "1";
      const caminho = todos ? `palpitesBolao/${bolaoId}/${jogoId}` : `palpitesBolao/${bolaoId}/${jogoId}/${uid}`;
      return onValue(
        ref(database, caminho),
        (snap) => {
          const v = snap.val();
          const doJogo = todos ? v || {} : v ? { [uid]: v } : {};
          const bolao = (dados[bolaoId] ||= {});
          Object.values(bolao).forEach((jogos) => delete jogos[jogoId]);
          Object.entries(doJogo).forEach(([u, p]) => {
            (bolao[u] ||= {})[jogoId] = p;
          });
          const copia = Object.fromEntries(Object.entries(bolao).map(([u, jogos]) => [u, { ...jogos }]));
          setPorBolao((ant) => ({ ...ant, [bolaoId]: copia }));
        },
        (err) => console.error(`Erro ao carregar palpites do bolão (${caminho}):`, err)
      );
    });
    return () => parar.forEach((p) => p());
  }, [assinaturas, uid]);

  return porBolao;
}
