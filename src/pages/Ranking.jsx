import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { database } from "../services/firebase";

export default function Ranking() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    carregarRanking();
  }, []);

  async function carregarRanking() {
    try {
      const [usersSnap, betsSnap, resultadosSnap] = await Promise.all([
        get(ref(database, "users")),
        get(ref(database, "bets")),
        get(ref(database, "resultados")),
      ]);

      const usuarios = usersSnap.val() || {};
      const apostas = betsSnap.val() || {};
      const resultados = resultadosSnap.val() || {};

      const listaRanking = [];

      Object.keys(usuarios).forEach((uid) => {
        const usuario = usuarios[uid];
        const betsUsuario = apostas[uid] || {};

        let pontos = 0;

        Object.keys(betsUsuario).forEach((jogoId) => {
          pontos += calcularPontuacao(
            betsUsuario[jogoId],
            resultados[jogoId]
          );
        });

        listaRanking.push({
          uid,
          nome: usuario.nome,
          email: usuario.email,
          pontos,
        });
      });

      listaRanking.sort((a, b) => b.pontos - a.pontos);

      setRanking(listaRanking);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Layout>
      <div className="dashboard-container">

        {/* HEADER estilo painel */}
        <div className="dash-header">
          <div>
            <h2>🏆 Ranking Geral</h2>
            <p>Os melhores apostadores da plataforma</p>
          </div>
        </div>

        {/* PODIUM */}
        {ranking.length >= 3 && (
          <div className="podium">

            {/* 2º */}
            <div className="podium-card silver">
              <h2>🥈</h2>
              <h3>{ranking[1]?.nome}</h3>
              <p>{ranking[1]?.pontos} pts</p>
            </div>

            {/* 1º */}
            <div className="podium-card gold big">
              <h2>🥇</h2>
              <h3>{ranking[0]?.nome}</h3>
              <p>{ranking[0]?.pontos} pts</p>
            </div>

            {/* 3º */}
            <div className="podium-card bronze">
              <h2>🥉</h2>
              <h3>{ranking[2]?.nome}</h3>
              <p>{ranking[2]?.pontos} pts</p>
            </div>

          </div>
        )}

        {/* LISTA COMPLETA */}
        <div className="ranking-list">
          {ranking.map((usuario, index) => (
            <div key={usuario.uid} className="ranking-row">

              <div className="rank-pos">
                #{index + 1}
              </div>

              <div className="rank-name">
                {usuario.nome}
              </div>

              <div className="rank-points">
                {usuario.pontos} pts
              </div>

            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}