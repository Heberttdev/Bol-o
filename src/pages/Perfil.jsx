import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../services/firebase";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [totalPalpites, setTotalPalpites] = useState(0);
  const [pontuacao, setPontuacao] = useState(0);

  useEffect(() => {
    if (user) carregarPerfil();
  }, [user]);

  async function carregarPerfil() {
    try {
      const [userSnap, betsSnap, resultadosSnap] = await Promise.all([
        get(ref(database, `users/${user.uid}`)),
        get(ref(database, `bets/${user.uid}`)),
        get(ref(database, "resultados")),
      ]);

      if (userSnap.exists()) {
        setDadosUsuario(userSnap.val());
      }

      if (betsSnap.exists()) {
        setTotalPalpites(Object.keys(betsSnap.val()).length);
      }

      if (betsSnap.exists() && resultadosSnap.exists()) {
        const bets = betsSnap.val();
        const resultados = resultadosSnap.val();

        let totalPontos = 0;

        Object.keys(bets).forEach((jogoId) => {
          totalPontos += calcularPontuacao(
            bets[jogoId],
            resultados[jogoId]
          );
        });

        setPontuacao(totalPontos);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Layout>
      <div className="dashboard-container">

        {/* HEADER estilo bet */}
        <div className="dash-header">
          <div>
            <h2>👤 Meu Perfil</h2>
            <p>Acompanhe sua performance no bolão</p>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate("/dashboard")}>
              📊 Dashboard
            </button>

            <button onClick={() => navigate("/ranking")}>
              🏆 Ranking
            </button>
          </div>
        </div>

        {/* USER CARD */}
        <div className="profile-card">

          <div className="profile-info">
            <img
              src={user?.photoURL || "https://ui-avatars.com/api/?name=Jogador"}
              className="avatar-glow"
              alt="perfil"
            />

            <div>
              <h3>{dadosUsuario?.nome || "-"}</h3>
              <p>{dadosUsuario?.email || "-"}</p>
            </div>
          </div>

        </div>

        {/* STATS */}
        <div className="cards-grid">

          <div className="card glow-blue">
            <h2>{totalPalpites}</h2>
            <p>Palpites</p>
          </div>

          <div className="card glow-gold">
            <h2>{pontuacao}</h2>
            <p>Pontos</p>
          </div>

          <div className="card glow-green">
            <h2>
              {pontuacao > 0
                ? (pontuacao / (totalPalpites || 1)).toFixed(2)
                : 0}
            </h2>
            <p>Média</p>
          </div>

        </div>

      </div>
    </Layout>
  );
}