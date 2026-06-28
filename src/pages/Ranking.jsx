import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { database } from "../services/firebase";
import { Trophy, Medal } from "lucide-react";
import Avatar from "../components/Avatar";

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
          fotoUrl: usuario.photoURL || usuario.fotoUrl || null,
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
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={22} /> Ranking Geral
            </h2>
            <p>Os melhores apostadores da plataforma</p>
          </div>
        </div>

        {/* PODIUM */}
        {ranking.length >= 3 && (
          <div className="podium">

            {/* 2º */}
            <div className="podium-card silver">
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar nome={ranking[1]?.nome} fotoUrl={ranking[1]?.fotoUrl} size={48} />
                <Medal size={18} color="#C0C0C0" style={{ position: "absolute", bottom: -4, right: -4, background: "#0b0f14", borderRadius: "50%", padding: 2 }} />
              </div>
              <h3>{ranking[1]?.nome}</h3>
              <p>{ranking[1]?.pontos} pts</p>
            </div>

            {/* 1º */}
            <div className="podium-card gold big">
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar nome={ranking[0]?.nome} fotoUrl={ranking[0]?.fotoUrl} size={56} />
                <Medal size={20} color="#FFD700" style={{ position: "absolute", bottom: -4, right: -4, background: "#0b0f14", borderRadius: "50%", padding: 2 }} />
              </div>
              <h3>{ranking[0]?.nome}</h3>
              <p>{ranking[0]?.pontos} pts</p>
            </div>

            {/* 3º */}
            <div className="podium-card bronze">
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar nome={ranking[2]?.nome} fotoUrl={ranking[2]?.fotoUrl} size={48} />
                <Medal size={18} color="#CD7F32" style={{ position: "absolute", bottom: -4, right: -4, background: "#0b0f14", borderRadius: "50%", padding: 2 }} />
              </div>
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

              <Avatar nome={usuario.nome} fotoUrl={usuario.fotoUrl} size={32} />

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