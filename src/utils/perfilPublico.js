import { ref, set } from "firebase/database";
import { database } from "../services/firebase";

const MAX_NOME = 80;
const MAX_URL = 1000;

export function fotoSegura(url) {
  return typeof url === "string" && url.startsWith("https://") && url.length <= MAX_URL ? url : null;
}

export function montarPerfilPublico(dados) {
  const nome = String(dados?.nome || "").trim().slice(0, MAX_NOME) || "Jogador";
  const foto = fotoSegura(dados?.photoURL) || fotoSegura(dados?.fotoUrl);
  return foto ? { nome, photoURL: foto } : { nome };
}

export function salvarPerfilPublico(uid, dados) {
  return set(ref(database, `perfisPublicos/${uid}`), montarPerfilPublico(dados));
}
