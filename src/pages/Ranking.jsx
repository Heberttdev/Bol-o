import Layout from "../components/Layout";
import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { database } from "../services/firebase";
import { Trophy, Medal, Loader2 } from "lucide-react";
import Avatar from "../components/Avatar";

export default function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  const snapshotData = useRef({
    users: {},
    bets: {},
    resultados: {},
  });

  useEffect(() => {
    let initialCount = 0;
    const processarRanking = () => {
      const { users, bets, resultados } = snapshotData.current;
      const listaRanking = [];

      Object.keys(users).forEach((uid) => {
        const usuario = users[uid];
        const betsUsuario = bets[uid] || {};

        let pontos = 0;
        Object.keys(betsUsuario).forEach((jogoId) => {
          pontos += calcularPontuacao(betsUsuario[jogoId], resultados[jogoId]);
        });

        listaRanking.push({
          uid,
          nome: usuario.nome || "Jogador",
          email: usuario.email || "",
          fotoUrl: usuario.photoURL || usuario.fotoUrl || null,
          pontos,
        });
      });

      listaRanking.sort((a, b) => b.pontos - a.pontos);
      setRanking(listaRanking);

      initialCount++;
      if (initialCount >= 3) {
        setLoading(false);
      }
    };

    const unsubUsers = onValue(
      ref(database, "users"),
      (snap) => {
        snapshotData.current.users = snap.val() || {};
        processarRanking();
      },
      (err) => {
        console.error("Erro ao escutar users no ranking:", err);
        setLoading(false);
      }
    );

    const unsubBets = onValue(
      ref(database, "bets"),
      (snap) => {
        snapshotData.current.bets = snap.val() || {};
        processarRanking();
      },
      (err) => {
        console.error("Erro ao escutar bets no ranking:", err);
        setLoading(false);
      }
    );

    const unsubResultados = onValue(
      ref(database, "resultados"),
      (snap) => {
        snapshotData.current.resultados = snap.val() || {};
        processarRanking();
      },
      (err) => {
        console.error("Erro ao escutar resultados no ranking:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubUsers();
      unsubBets();
      unsubResultados();
    };
  }, []);

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

        {loading ? (
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#aab", fontSize: "1rem" }}>
              <Loader2 size={18} /> Carregando classificação...
            </h3>
            <div style={{ marginTop: "16px" }}>
              <div className="skeleton" style={{ marginBottom: "8px" }} />
              <div className="skeleton" style={{ marginBottom: "8px" }} />
              <div className="skeleton" />
            </div>
          </div>
        ) : (
          <>
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
              {ranking.length === 0 && (
                <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>Nenhum apostador encontrado.</p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}