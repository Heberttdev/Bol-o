import { useEffect, useState, useRef } from "react";
import { ref, get, set } from "firebase/database";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { bandeiras } from "../utils/bandeiras";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleDot, LayoutDashboard, Trophy, Target, MapPin, Calendar, Lock, Check, Loader2, Radio } from "lucide-react";

const DURACAO_JOGO_MS = 2 * 60 * 60 * 1000; // 2 horas

function obterStatusJogo(jogo, resultado) {
  if (resultado) return "encerrado";

  if (!jogo.data) return "aberto";

  const inicio = new Date(jogo.data);
  const fim = new Date(inicio.getTime() + DURACAO_JOGO_MS);
  const agora = new Date();

  if (agora >= fim) return "encerrado";
  if (agora >= inicio) return "em_andamento";
  return "aberto";
}

export default function Jogos() {
  const [jogos, setJogos] = useState([]);
  const [faseSelecionada, setFaseSelecionada] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [palpites, setPalpites] = useState({});
  const [resultados, setResultados] = useState({});
  const [statusSelecionado, setStatusSelecionado] = useState("abertos");
  const { user } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

const jogoSelecionado =
  new URLSearchParams(location.search).get("jogo");

const cardRefs = useRef({});

useEffect(() => {
  if (jogoSelecionado && !loading) {
    const el = cardRefs.current[jogoSelecionado];
    if (el) {
      // pequeno delay garante que o card já está renderizado na tela
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }
}, [jogoSelecionado, loading, jogos]);

 const fases = [
  "Todas",
  ...new Set(
    jogos
      .map((jogo) => jogo.fase)
      .filter(Boolean)
  ),
];

  useEffect(() => {
    if (user) {
      carregarJogos();
      carregarPalpites();
    }
  }, [user]);

  async function carregarJogos() {
    try {
      const [jogosSnap, palpitesSnap, resultadosSnap] = await Promise.all([
        get(ref(database, "jogos")),
        get(ref(database, `bets/${user.uid}`)),
        get(ref(database, "resultados")),
      ]);

      if (jogosSnap.exists()) {
        const lista = Object.values(jogosSnap.val());

        lista.sort((a, b) => new Date(a.data) - new Date(b.data));

        setJogos(lista);
      }

      if (palpitesSnap.exists()) setPalpites(palpitesSnap.val());
      if (resultadosSnap.exists()) setResultados(resultadosSnap.val());

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  async function carregarPalpites() {
    const snapshot = await get(ref(database, `bets/${user.uid}`));
    if (snapshot.exists()) setPalpites(snapshot.val());
  }

  async function salvarPalpite(jogoId, casa, fora) {
    await set(ref(database, `bets/${user.uid}/${jogoId}`), {
      casa: Number(casa),
      fora: Number(fora),
    });

    setPalpites((prev) => ({
      ...prev,
      [jogoId]: { casa: Number(casa), fora: Number(fora) },
    }));
  }

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-container">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Loader2 size={20} /> Carregando jogos...
          </h2>
        </div>
      </Layout>
    );
  }

  const jogosFiltrados = jogoSelecionado
    ? jogos // se veio de um link direto pra um jogo específico, ignora os filtros
    : jogos
        .filter((j) => (faseSelecionada === "Todas" ? true : j.fase === faseSelecionada))
        .filter((jogo) => {
          const status = obterStatusJogo(jogo, resultados[jogo.id]);

          if (statusSelecionado === "abertos") return status === "aberto";
          if (statusSelecionado === "encerrados") return status === "em_andamento" || status === "encerrado";
          return true; // "todos"
        });

  return (
    <Layout>
      <div className="dashboard-container">

        {/* HEADER estilo painel */}
        <div className="dash-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CircleDot size={22} /> Jogos da Copa
            </h2>
            <p>Faça seus palpites e suba no ranking</p>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate("/dashboard")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <LayoutDashboard size={16} /> Dashboard
            </button>

            <button onClick={() => navigate("/ranking")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Trophy size={16} /> Ranking
            </button>
          </div>
        </div>

        {/* FILTROS */}
        {jogoSelecionado ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#1a2230",
              padding: "10px 14px",
              borderRadius: "10px",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "#FFD700", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <Target size={16} /> Mostrando jogo selecionado
            </span>
            <button
              className="btn-bet"
              style={{ flex: "none", padding: "6px 14px" }}
              onClick={() => navigate("/jogos")}
            >
              Ver todos os jogos
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px", flexWrap: "nowrap" }}>
            <select
              value={faseSelecionada}
              onChange={(e) => setFaseSelecionada(e.target.value)}
              className="filter-select"
              style={{ flex: 1, minWidth: 0 }}
            >
              {fases.map((fase) => (
                <option key={fase} value={fase}>
                  {fase}
                </option>
              ))}
            </select>

            <select
              value={statusSelecionado}
              onChange={(e) => setStatusSelecionado(e.target.value)}
              className="filter-select"
              style={{ flex: 1, minWidth: 0 }}
            >
              <option value="abertos">Abertos</option>
              <option value="encerrados">Encerrados</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        )}

        {/* JOGOS */}
        <div className="games-grid">

          {jogosFiltrados.map((jogo) => {
            const palpite = palpites[jogo.id] || {};
            const resultado = resultados[jogo.id];

            const status = obterStatusJogo(jogo, resultado);
            const podeApostar = status === "aberto";

            const estaDestacado = jogoSelecionado === jogo.id;

            return (
              <div
                key={jogo.id}
                ref={(el) => (cardRefs.current[jogo.id] = el)}
                className="game-card-bet"
                style={
                  estaDestacado
                    ? {
                        border: "2px solid #00ff88",
                        boxShadow: "0 0 24px rgba(0, 255, 136, 0.4)",
                      }
                    : undefined
                }
              >

                <div className="game-top">
                  <span className="badge">{jogo.fase}</span>

                  {status === "aberto" && <span className="badge green">Aberto</span>}
                  {status === "em_andamento" && (
                    <span className="badge" style={{ background: "#00bfff", color: "#000", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Radio size={12} /> Em andamento
                    </span>
                  )}
                  {status === "encerrado" && <span className="badge red">Encerrado</span>}
                </div>

                <div className="game-title">
                  {bandeiras[jogo.casa] || "🏳️"} {jogo.casa}
                  <span> VS </span>
                  {bandeiras[jogo.fora] || "🏳️"} {jogo.fora}
                </div>

                <p className="game-info" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={14} /> {jogo.estadio}
                </p>

                {jogo.data && (
                <p className="game-date" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} /> {new Date(jogo.data).toLocaleString("pt-BR")}
                </p>
              )}

                {resultado && (
                  <div className="result-box">
                    Resultado: {resultado.casa} x {resultado.fora}
                  </div>
                )}

                {!podeApostar && status === "em_andamento" && (
                  <p className="closed-text" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Lock size={14} /> Jogo em andamento — palpites encerrados
                  </p>
                )}

                {status === "encerrado" && !resultado && (
                  <p className="closed-text" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Lock size={14} /> Palpites encerrados
                  </p>
                )}

                {/* PALPITE */}
                <div className="bet-row">
                  <input
                    type="number"
                    defaultValue={palpite.casa ?? ""}
                    disabled={!podeApostar}
                    className="score-input-bet"
                    id={`casa-${jogo.id}`}
                  />

                  <input
                    type="number"
                    defaultValue={palpite.fora ?? ""}
                    disabled={!podeApostar}
                    className="score-input-bet"
                    id={`fora-${jogo.id}`}
                  />

                  <button
                    className="btn-bet"
                    disabled={!podeApostar}
                    onClick={() => {
                      const casa = document.getElementById(
                        `casa-${jogo.id}`
                      ).value;

                      const fora = document.getElementById(
                        `fora-${jogo.id}`
                      ).value;

                      salvarPalpite(jogo.id, casa, fora);
                    }}
                  >
                    Apostar
                  </button>
                </div>

                {palpite.casa !== undefined && palpite.fora !== undefined && (
                  <div className="palpite-info">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Check size={14} /> {palpite.casa} x {palpite.fora}
                    </span>

                    {resultado && (
                      <div className="points" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Target size={14} /> {calcularPontuacao(palpite, resultado)} pts
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}

        </div>
      </div>
    </Layout>
  );
}