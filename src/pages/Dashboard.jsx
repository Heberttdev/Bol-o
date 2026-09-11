import { useAuth } from "../context/AuthContext";
import { useReady } from "../context/ReadyContext";
import Layout from "../components/Layout";
import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../services/firebase";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { Navigate, useNavigate } from "react-router-dom";
import { getEscudo } from "../utils/escudos";
import { montarEvolucao } from "../utils/evolucao";
import { Trophy, Medal, Radio, TrendingUp, TrendingDown } from "lucide-react";
import Loading from "../components/Loading";

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
  const [proximoPalpite, setProximoPalpite] = useState(null);
  const [infoEvolucao, setInfoEvolucao] = useState(null);

  const snapshotData = useRef({
    users: {},
    bets: {},
    resultados: {},
    jogos: {},
  });

  useEffect(() => {
    if (!user) return;

    let initialCount = 0;
    const processarDashboard = () => {
      const { users, bets, resultados, jogos: jogosObj } = snapshotData.current;
      const jogosList = Object.entries(jogosObj || {}).map(([id, j]) => ({ id, ...j }));

      const agora = new Date();
      const futuros = jogosList
        .filter((j) => j?.data && new Date(j.data) >= agora)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

      const betsDoUsuario = bets[user.uid] || {};
      setProximosJogos(futuros.slice(0, 3));
      setProximoPalpite(futuros.find((jogo) => !betsDoUsuario[jogo.id]) || null);

      const listaRanking = [];
      Object.keys(users).forEach((uid) => {
        let pontos = 0;
        let exatos = 0;
        const betsUsuario = bets[uid] || {};
        Object.keys(betsUsuario).forEach((jogoId) => {
          const pts = calcularPontuacao(betsUsuario[jogoId], resultados[jogoId]);
          pontos += pts;
          if (pts >= 10) exatos += 1;
        });
        listaRanking.push({ uid, nome: users[uid]?.nome || "Jogador", pontos, exatos });
        if (uid === user.uid) {
          setDadosUsuario(users[uid]);
          setPontuacao(pontos);
          setTotalPalpites(Object.keys(betsUsuario).length);
        }
      });

      listaRanking.sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos || a.nome.localeCompare(b.nome));
      setTopRanking(listaRanking.slice(0, 3));
      const indice = listaRanking.findIndex((item) => item.uid === user.uid);
      setPosicao(indice >= 0 ? indice + 1 : "-");

      setInfoEvolucao(
        montarEvolucao({
          users,
          bets,
          resultados,
          jogos: jogosList,
          uid: user.uid,
        })
      );

      initialCount++;
      if (initialCount >= 4) {
        marcarComoPronto();
      }
    };

    const unsubUsers = onValue(
      ref(database, "users"),
      (snap) => {
        snapshotData.current.users = snap.val() || {};
        processarDashboard();
      },
      (err) => console.error("Erro ao carregar users no dashboard:", err)
    );

    const unsubBets = onValue(
      ref(database, "bets"),
      (snap) => {
        snapshotData.current.bets = snap.val() || {};
        processarDashboard();
      },
      (err) => console.error("Erro ao carregar bets no dashboard:", err)
    );

    const unsubResultados = onValue(
      ref(database, "resultados"),
      (snap) => {
        snapshotData.current.resultados = snap.val() || {};
        processarDashboard();
      },
      (err) => console.error("Erro ao carregar resultados no dashboard:", err)
    );

    const unsubJogos = onValue(
      ref(database, "jogos"),
      (snap) => {
        snapshotData.current.jogos = snap.val() || {};
        processarDashboard();
      },
      (err) => console.error("Erro ao carregar jogos no dashboard:", err)
    );

    return () => {
      unsubUsers();
      unsubBets();
      unsubResultados();
      unsubJogos();
    };
  }, [user, marcarComoPronto]);

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" />;

  const corMedalha = (i) => (i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32");

  return (
    <Layout>
      <div className="dashboard-container">
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text)" }}>
            Olá, {dadosUsuario?.nome?.split(" ")[0] || "Jogador"} 👋
          </h2>
        </div>

        {proximoPalpite && (
          <section className="action-hero">
            <span className="badge green">Próximo palpite</span>
            <h3>{proximoPalpite.casa} x {proximoPalpite.fora}</h3>
            <p>{new Date(proximoPalpite.data).toLocaleString("pt-BR")} - {proximoPalpite.fase}</p>
            <button className="btn-bet" onClick={() => navigate(`/jogos?jogo=${proximoPalpite.id}`)}>
              Dar meu palpite
            </button>
          </section>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
          <div className="card glow-green"><h2>{pontuacao}</h2><p>Pontos</p></div>
          <div className="card glow-gold"><h2>{posicao}º</h2><p>Ranking</p></div>
          <div className="card glow-blue"><h2>{totalPalpites}</h2><p>Palpites</p></div>
        </div>

        {infoEvolucao?.faseAtual && (
          <div className="minha-rodada">
            <div>
              <strong style={{ fontSize: "0.9rem" }}>{infoEvolucao.faseAtual}</strong>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Posição na rodada: {infoEvolucao.posAtual ? `#${infoEvolucao.posAtual}` : "-"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {infoEvolucao.delta != null && infoEvolucao.delta !== 0 && (
                <span className={`delta-badge ${infoEvolucao.delta > 0 ? "up" : "down"}`}>
                  {infoEvolucao.delta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(infoEvolucao.delta)}
                </span>
              )}
              <span className="pts-rodada">{infoEvolucao.pontosFaseAtual} pts</span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 10px", fontSize: "0.95rem", color: "var(--text-muted)" }}>
            <Trophy size={16} /> Top 3
          </h3>
          {topRanking.map((item, i) => (
            <div key={item.uid} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", borderRadius: "8px", marginBottom: "4px",
              background: item.uid === user.uid ? "rgba(0,255,136,0.07)" : "var(--bg-elev)",
              border: item.uid === user.uid ? "1px solid rgba(0,255,136,0.2)" : "1px solid transparent",
            }}>
              <Medal size={18} color={corMedalha(i)} />
              <span style={{ flex: 1, fontSize: "0.9rem", color: item.uid === user.uid ? "#00ff88" : "var(--text)" }}>
                {item.nome}
              </span>
              <strong style={{ color: "#FFD700", fontSize: "0.85rem" }}>{item.pontos} pts</strong>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 10px", fontSize: "0.95rem", color: "var(--text-muted)" }}>
            <Radio size={16} /> Próximos Jogos
          </h3>
          {proximosJogos.length === 0 ? (
            <p style={{ color: "var(--text-soft)", fontSize: "0.85rem" }}>Nenhum jogo agendado.</p>
          ) : (
            proximosJogos.map(jogo => (
              <div key={jogo.id} style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-elev)", marginBottom: "4px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <EscudoTime nome={jogo.casa} /> {jogo.casa}
                  <span style={{ color: "var(--text-soft)" }}>vs</span>
                  <EscudoTime nome={jogo.fora} /> {jogo.fora}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-soft)" }}>
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
