import { useAuth } from "../context/AuthContext";
import { useReady } from "../context/ReadyContext";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../services/firebase";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { Navigate, useNavigate } from "react-router-dom";
import { getEscudo } from "../utils/escudos";
import { Trophy, Medal, Radio } from "lucide-react";

function EscudoTime({ nome, size = 18 }) {
  const url = getEscudo(nome);
  return url
    ? <img src={url} alt={nome} style={{ width: size, height: size, objectFit: "contain", verticalAlign: "middle" }} />
    : <span style={{ fontSize: size * 0.7 }}>🏳️</span>;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { marcarComoPronto } = useReady();
  const navigate = useNavigate();

  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [pontuacao, setPontuacao] = useState(0);
  const [totalPalpites, setTotalPalpites] = useState(0);
  const [posicao, setPosicao] = useState("-");
  const [topRanking, setTopRanking] = useState([]);
  const [proximosJogos, setProximosJogos] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(false);

  useEffect(() => { if (user) carregarDashboard(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => carregarDashboard(), 15000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <h2>Carregando...</h2>;
  if (!user) return <Navigate to="/" />;

  async function carregarDashboard() {
    if (carregandoDados) return;
    setCarregandoDados(true);
    try {
      const [usersSnap, betsSnap, resultadosSnap, jogosSnap] = await Promise.all([
        get(ref(database, "users")),
        get(ref(database, "bets")),
        get(ref(database, "resultados")),
        get(ref(database, "jogos")),
      ]);

      const usuarios = usersSnap.val() || {};
      const apostas = betsSnap.val() || {};
      const resultados = resultadosSnap.val() || {};
      const jogos = Object.entries(jogosSnap.val() || {}).map(([id, j]) => ({ id, ...j }));

      const futuros = jogos
        .filter(j => j?.data && new Date(j.data) >= new Date())
        .sort((a, b) => new Date(a.data) - new Date(b.data))
        .slice(0, 3);
      setProximosJogos(futuros);

      const listaRanking = [];
      Object.keys(usuarios).forEach(uid => {
        let pontos = 0;
        const betsUsuario = apostas[uid] || {};
        Object.keys(betsUsuario).forEach(jogoId => {
          pontos += calcularPontuacao(betsUsuario[jogoId], resultados[jogoId]);
        });
        listaRanking.push({ uid, nome: usuarios[uid]?.nome || "Jogador", pontos });
        if (uid === user.uid) {
          setDadosUsuario(usuarios[uid]);
          setPontuacao(pontos);
          setTotalPalpites(Object.keys(betsUsuario).length);
        }
      });

      listaRanking.sort((a, b) => b.pontos - a.pontos);
      setTopRanking(listaRanking.slice(0, 3));
      const indice = listaRanking.findIndex(item => item.uid === user.uid);
      setPosicao(indice >= 0 ? indice + 1 : "-");
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setCarregandoDados(false);
      marcarComoPronto();
    }
  }

  const corMedalha = i => i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32";

  return (
    <Layout>
      <div className="dashboard-container">

        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#fff" }}>
            Olá, {dadosUsuario?.nome?.split(" ")[0] || "Jogador"} 👋
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
          <div className="card glow-green"><h2>{pontuacao}</h2><p>Pontos</p></div>
          <div className="card glow-gold"><h2>{posicao}º</h2><p>Ranking</p></div>
          <div className="card glow-blue"><h2>{totalPalpites}</h2><p>Palpites</p></div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 10px", fontSize: "0.95rem", color: "#aab" }}>
            <Trophy size={16} /> Top 3
          </h3>
          {topRanking.map((item, i) => (
            <div key={item.uid} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", borderRadius: "8px", marginBottom: "4px",
              background: item.uid === user.uid ? "rgba(0,255,136,0.07)" : "#0f141e",
              border: item.uid === user.uid ? "1px solid rgba(0,255,136,0.2)" : "1px solid transparent",
            }}>
              <Medal size={18} color={corMedalha(i)} />
              <span style={{ flex: 1, fontSize: "0.9rem", color: item.uid === user.uid ? "#00ff88" : "#eee" }}>
                {item.nome}
              </span>
              <strong style={{ color: "#FFD700", fontSize: "0.85rem" }}>{item.pontos} pts</strong>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 10px", fontSize: "0.95rem", color: "#aab" }}>
            <Radio size={16} /> Próximos Jogos
          </h3>
          {proximosJogos.length === 0 ? (
            <p style={{ color: "#555", fontSize: "0.85rem" }}>Nenhum jogo agendado.</p>
          ) : (
            proximosJogos.map(jogo => (
              <div key={jogo.id} style={{ padding: "10px 12px", borderRadius: "8px", background: "#0f141e", marginBottom: "4px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <EscudoTime nome={jogo.casa} /> {jogo.casa}
                  <span style={{ color: "#555" }}>vs</span>
                  <EscudoTime nome={jogo.fora} /> {jogo.fora}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "0.72rem", color: "#666" }}>
                    {jogo.data && new Date(jogo.data).toLocaleString("pt-BR")}
                  </span>
                  <button className="btn-bet" style={{ padding: "5px 14px", fontSize: "0.78rem", whiteSpace: "nowrap", flex: "none", width: "auto" }}
                    onClick={() => navigate(`/jogos?jogo=${jogo.id}`)}>
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