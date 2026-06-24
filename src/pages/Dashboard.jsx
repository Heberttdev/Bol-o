import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../services/firebase";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { Navigate, useNavigate } from "react-router-dom";
import { bandeiras } from "../utils/bandeiras";

export default function Dashboard() {
  console.log("INICIO DASHBOARD");
  const { user, loading } = useAuth();
  console.log("USER DASH:", user);
console.log("LOADING DASH:", loading);
  const navigate = useNavigate();

  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [pontuacao, setPontuacao] = useState(0);
  const [totalPalpites, setTotalPalpites] = useState(0);
  const [posicao, setPosicao] = useState("-");
  const [topRanking, setTopRanking] = useState([]);
  const [proximosJogos, setProximosJogos] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(false);

  useEffect(() => {
    if (user) {
      carregarDashboard();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      carregarDashboard();
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <h2>Carregando...</h2>;
 if (!user) return <Navigate to="/" />;

  async function carregarDashboard() {
    if (carregandoDados) return;

    setCarregandoDados(true);

    try {
      const [usersSnap, betsSnap, resultadosSnap, jogosSnap] =
        await Promise.all([
          get(ref(database, "users")),
          get(ref(database, "bets")),
          get(ref(database, "resultados")),
          get(ref(database, "jogos")),
        ]);

      const usuarios = usersSnap.val() || {};
      const apostas = betsSnap.val() || {};
      const resultados = resultadosSnap.val() || {};
      const jogos = Object.entries(jogosSnap.val() || {}).map(([id, jogo]) => ({
        id,
        ...jogo,
      }));
      const futuros = jogos
        .filter((j) => j?.data)
        .filter((j) => new Date(j.data) >= new Date())
        .sort((a, b) => new Date(a.data) - new Date(b.data))
        .slice(0, 5);

      setProximosJogos(futuros);

      const listaRanking = [];

      Object.keys(usuarios).forEach((uid) => {
        let pontos = 0;

        const betsUsuario = apostas[uid] || {};

        Object.keys(betsUsuario).forEach((jogoId) => {
          pontos += calcularPontuacao(betsUsuario[jogoId], resultados[jogoId]);
        });

        listaRanking.push({
          uid,
          nome: usuarios[uid]?.nome || "Jogador",
          pontos,
        });

        if (uid === user.uid) {
          setDadosUsuario(usuarios[uid]);
          setPontuacao(pontos);
          setTotalPalpites(Object.keys(betsUsuario).length);
        }
      });

      listaRanking.sort((a, b) => b.pontos - a.pontos);

      setTopRanking(listaRanking.slice(0, 5));

      const indice = listaRanking.findIndex((item) => item.uid === user.uid);

      setPosicao(indice >= 0 ? indice + 1 : "-");
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setCarregandoDados(false);
    }
  }

  return (
    <Layout>
      <div className="dashboard-container">
        {/* HEADER */}
        <div className="dash-header">
          <div className="user-box">
            <img
              src={user?.photoURL || "https://ui-avatars.com/api/?name=Jogador"}
              className="avatar-glow"
              alt="perfil"
            />

            <div>
              <h2>Bem-vindo, {dadosUsuario?.nome || "Jogador"}</h2>

              <p>🔥 Bora subir nesse ranking</p>
            </div>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate("/jogos")}>⚽ Jogos</button>

            <button onClick={() => navigate("/ranking")}>🏆 Ranking</button>
          </div>
        </div>

        {/* CARDS */}
        <div className="cards-grid">
          <div className="card glow-green">
            <h2>{pontuacao}</h2>
            <p>Pontos</p>
          </div>

          <div className="card glow-gold">
            <h2>{posicao}º</h2>
            <p>Ranking</p>
          </div>

          <div className="card glow-blue">
            <h2>{totalPalpites}</h2>
            <p>Palpites</p>
          </div>
        </div>

        {/* TOP 5 */}
        <div className="ranking-card">
          <h2>🏆 Top 5 Ranking</h2>

          {topRanking.map((item, index) => (
            <div key={item.uid} className={`ranking-item rank-${index + 1}`}>
              <span>
                {index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : `#${index + 1}`}{" "}
                {item.nome}
              </span>

              <strong>{item.pontos} pts</strong>
            </div>
          ))}
        </div>

        {/* PRÓXIMOS JOGOS */}
        <div className="live-card">
          <h2>📡 Próximos Jogos</h2>

          {proximosJogos.length === 0 ? (
            <p>Nenhum jogo agendado.</p>
          ) : (
            proximosJogos.map((jogo) => (
              <div key={jogo.id} className="live-item">
                <div className="match">
                  {bandeiras[jogo.casa] || "🏳️"} {jogo.casa}
                  <span
                    style={{
                      margin: "0 10px",
                      color: "#888",
                    }}
                  >
                    VS
                  </span>
                  {bandeiras[jogo.fora] || "🏳️"} {jogo.fora}
                </div>

                <small>{new Date(jogo.data).toLocaleString("pt-BR")}</small>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "10px",
                  }}
                >
                  <div className="live-dot" />

                  <button
                    className="btn-bet"
                    onClick={() => navigate(`/jogos?jogo=${jogo.id}`)}
                  >
                    Palpitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
