import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { getEscudo } from "../utils/escudos";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { useNavigate } from "react-router-dom";
import { Target, CircleDot, Calendar, Check, Lock, Loader2, Radio } from "lucide-react";

const DURACAO_JOGO_MS = 2 * 60 * 60 * 1000;

function obterStatusJogo(jogo, resultado, agora) {
  if (resultado) return "encerrado";
  if (!jogo.data) return "aberto";
  const inicio = new Date(jogo.data);
  const fim = new Date(inicio.getTime() + DURACAO_JOGO_MS);
  if (agora >= fim) return "encerrado";
  if (agora >= inicio) return "em_andamento";
  return "aberto";
}

function EscudoTime({ nome, size = 22 }) {
  const url = getEscudo(nome);
  return url
    ? <img src={url} alt={nome} style={{ width: size, height: size, objectFit: "contain", verticalAlign: "middle" }} />
    : <span style={{ fontSize: size * 0.7 }}>🏳️</span>;
}

export default function MeusPalpites() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jogos, setJogos] = useState([]);
  const [palpites, setPalpites] = useState({});
  const [resultados, setResultados] = useState({});
  const [loading, setLoading] = useState(true);
  const [agora, setAgora] = useState(new Date());
  const [faseSelecionada, setFaseSelecionada] = useState("Todas");
  const [filtro, setFiltro] = useState("pendentes");

  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    let carregados = 0;
    const checarLoading = () => {
      carregados++;
      if (carregados >= 3) setLoading(false);
    };

    const unsubJogos = onValue(
      ref(database, "jogos"),
      (snap) => {
        if (snap.exists()) {
          const lista = Object.values(snap.val());
          lista.sort((a, b) => new Date(a.data) - new Date(b.data));
          setJogos(lista);
        } else {
          setJogos([]);
        }
        checarLoading();
      },
      (err) => {
        console.error("Erro ao carregar jogos em MeusPalpites:", err);
        checarLoading();
      }
    );

    const unsubBets = onValue(
      ref(database, `bets/${user.uid}`),
      (snap) => {
        setPalpites(snap.exists() ? snap.val() : {});
        checarLoading();
      },
      (err) => {
        console.error("Erro ao carregar palpites em MeusPalpites:", err);
        checarLoading();
      }
    );

    const unsubResultados = onValue(
      ref(database, "resultados"),
      (snap) => {
        setResultados(snap.exists() ? snap.val() : {});
        checarLoading();
      },
      (err) => {
        console.error("Erro ao carregar resultados em MeusPalpites:", err);
        checarLoading();
      }
    );

    return () => {
      unsubJogos();
      unsubBets();
      unsubResultados();
    };
  }, [user]);

  if (loading) return (
    <Layout><div className="dashboard-container">
      <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Loader2 size={20} /> Carregando seus palpites...
      </h2>
    </div></Layout>
  );

  const jogosComStatus = jogos.map(jogo => {
    const palpite = palpites[jogo.id];
    const resultado = resultados[jogo.id];
    const apostado = !!palpite;
    const pontos = apostado && resultado ? calcularPontuacao(palpite, resultado) : null;
    const statusJogo = obterStatusJogo(jogo, resultado, agora);
    let status;
    if (apostado) status = "apostado";
    else if (statusJogo === "aberto") status = "pendente";
    else status = "encerrado_sem_palpite";
    return { jogo, palpite, resultado, apostado, pontos, statusJogo, status };
  });

  const fases = ["Todas", ...new Set(jogos.map(j => j.fase).filter(Boolean))];

  const jogosFiltrados = jogosComStatus
    .filter(item => faseSelecionada === "Todas" ? true : item.jogo.fase === faseSelecionada)
    .filter(item => {
      if (filtro === "apostados") return item.status === "apostado";
      if (filtro === "pendentes") return item.status === "pendente";
      if (filtro === "encerrados") return item.status === "encerrado_sem_palpite";
      return true;
    });

  const totalApostados = jogosComStatus.filter(j => j.status === "apostado").length;
  const totalPendentes = jogosComStatus.filter(j => j.status === "pendente").length;
  const totalPerdidos = jogosComStatus.filter(j => j.status === "encerrado_sem_palpite").length;

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dash-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Target size={22} /> Meus Palpites
            </h2>
            <p>Acompanhe o que já apostou e o que ainda falta</p>
          </div>
          <div className="quick-actions">
            <button onClick={() => navigate("/jogos")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CircleDot size={16} /> Ir para Jogos
            </button>
          </div>
        </div>

        <div className="cards-grid">
          <div className="card glow-blue"><h2>{jogosComStatus.length}</h2><p>Total</p></div>
          <div className="card glow-green"><h2>{totalApostados}</h2><p>Apostados</p></div>
          <div className="card glow-gold"><h2>{totalPendentes}</h2><p>Pendentes</p></div>
          <div className="card"><h2>{totalPerdidos}</h2><p>Encerrados</p></div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "nowrap" }}>
          <select value={faseSelecionada} onChange={e => setFaseSelecionada(e.target.value)} className="filter-select" style={{ flex: 1, minWidth: 0 }}>
            {fases.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={filtro} onChange={e => setFiltro(e.target.value)} className="filter-select" style={{ flex: 1, minWidth: 0 }}>
            <option value="pendentes">Pendentes</option>
            <option value="apostados">Já apostados</option>
            <option value="encerrados">Encerrados sem palpite</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        <div className="games-grid">
          {jogosFiltrados.map(({ jogo, palpite, resultado, status, statusJogo, pontos }) => (
            <div key={jogo.id} className="game-card-bet">
              <div className="game-top">
                <span className="badge">{jogo.fase}</span>
                {status === "apostado" && statusJogo === "em_andamento" && (
                  <span className="badge" style={{ background: "#00bfff", color: "#000", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Radio size={12} /> Em andamento
                  </span>
                )}
                {status === "apostado" && statusJogo !== "em_andamento" && (
                  <span className="badge green" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Check size={12} /> Apostado
                  </span>
                )}
                {status === "pendente" && (
                  <span className="badge" style={{ background: "#3a2f0f", color: "#ffd700" }}>Pendente</span>
                )}
                {status === "encerrado_sem_palpite" && (
                  <span className="badge red" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Lock size={12} /> Encerrado
                  </span>
                )}
              </div>

              <div className="game-title">
                <EscudoTime nome={jogo.casa} /> {jogo.casa}
                <span> VS </span>
                <EscudoTime nome={jogo.fora} /> {jogo.fora}
              </div>

              {jogo.data && (
                <p className="game-date" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} /> {new Date(jogo.data).toLocaleString("pt-BR")}
                </p>
              )}

              {status === "apostado" && (
                <div className="palpite-info">
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Check size={14} /> Seu palpite: {palpite.casa} x {palpite.fora}
                  </span>
                  {resultado && (
                    <>
                      <div className="result-box" style={{ marginTop: 6 }}>
                        Resultado: {resultado.casa} x {resultado.fora}
                      </div>
                      <div className="points" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Target size={14} /> {pontos} pts
                      </div>
                    </>
                  )}
                  {!resultado && <p style={{ color: "#888", fontSize: "0.85rem", marginTop: 4 }}>Aguardando resultado oficial</p>}
                </div>
              )}

              {status === "pendente" && (
                <button className="btn-bet" style={{ marginTop: 10 }} onClick={() => navigate(`/jogos?jogo=${jogo.id}`)}>
                  Fazer palpite
                </button>
              )}

              {status === "encerrado_sem_palpite" && (
                <p style={{ color: "#ff4d4d", fontSize: "0.85rem", marginTop: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Lock size={14} /> Você não apostou — palpites encerrados
                </p>
              )}
            </div>
          ))}

          {jogosFiltrados.length === 0 && (
            <p style={{ color: "#888" }}>Nenhum jogo encontrado para esse filtro.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}