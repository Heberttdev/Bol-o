import { useEffect, useState } from "react";
import { ref, get, set } from "firebase/database";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { bandeiras } from "../utils/bandeiras";
import { useLocation, useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

export default function Jogos() {
  const [jogos, setJogos] = useState([]);
  const [faseSelecionada, setFaseSelecionada] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [palpites, setPalpites] = useState({});
  const [resultados, setResultados] = useState({});
  const [statusSelecionado, setStatusSelecionado] = useState("abertos");
  const { user } = useAuth();
  const [jogoDestacado, setJogoDestacado] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fases = [
    "Todas",
    ...new Set(jogos.map((jogo) => jogo.fase).filter(Boolean)),
  ];

  useEffect(() => {
    if (user) {
      carregarJogos();
      carregarPalpites();
    }
  }, [user]);

  useEffect(() => {
    const jogoId = searchParams.get("jogo");

    if (!jogoId || jogos.length === 0) return;

    setJogoDestacado(jogoId);

    setTimeout(() => {
      const elemento = document.getElementById(`jogo-${jogoId}`);

      if (elemento) {
        elemento.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Dá foco no primeiro campo do placar
        const inputCasa = document.getElementById(`casa-${jogoId}`);

        if (inputCasa && !inputCasa.disabled) {
          inputCasa.focus();
          inputCasa.select();
        }
      }
    }, 300);

    setTimeout(() => {
      setJogoDestacado(null);
    }, 3000);
  }, [jogos, searchParams]);

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
          <h2>⏳ Carregando jogos...</h2>
        </div>
      </Layout>
    );
  }

  const jogosFiltrados = jogos
    .filter((j) =>
      faseSelecionada === "Todas" ? true : j.fase === faseSelecionada,
    )
    .filter((jogo) => {
      const resultado = resultados[jogo.id];
      const dataJogo =
        jogo.data && jogo.hora
          ? new Date(`${jogo.data}T${jogo.hora.substring(0, 5)}:00`)
          : null;
      const jogoEncerrado = !!resultado || (dataJogo && new Date() >= dataJogo);

      if (statusSelecionado === "abertos") return !jogoEncerrado;
      if (statusSelecionado === "encerrados") return jogoEncerrado;
      return true; // "todos"
    });

  return (
    <Layout>
      <div className="dashboard-container">
        {/* HEADER estilo painel */}
        <div className="dash-header">
          <div>
            <h2>⚽ Jogos da Copa</h2>
            <p>Faça seus palpites e suba no ranking</p>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate("/dashboard")}>📊 Dashboard</button>

            <button onClick={() => navigate("/ranking")}>🏆 Ranking</button>
          </div>
        </div>

        {/* FILTROS */}
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
            <option value="abertos">🟢 Abertos</option>
            <option value="encerrados">🔴 Encerrados</option>
            <option value="todos">📋 Todos</option>
          </select>
        </div>

        {/* JOGOS */}
        <div className="games-grid">
          {jogosFiltrados.map((jogo) => {
            const palpite = palpites[jogo.id] || {};
            const resultado = resultados[jogo.id];

            const dataJogo =
              jogo.data && jogo.hora
                ? new Date(`${jogo.data}T${jogo.hora.substring(0, 5)}:00-03:00`)
                : null;

            const jogoEncerrado =
              !!resultado || (dataJogo && new Date() >= dataJogo);

            return (
              <div
                id={`jogo-${jogo.id}`}
                key={jogo.id}
                className={`game-card-bet ${
                  jogoDestacado === jogo.id ? "highlight-game" : ""
                }`}
              >
                <div className="game-top">
                  <span className="badge">{jogo.fase}</span>

                  {jogoEncerrado ? (
                    <span className="badge red">Encerrado</span>
                  ) : (
                    <span className="badge green">Aberto</span>
                  )}
                </div>

                <div className="game-title">
                  {bandeiras[jogo.casa] || "🏳️"} {jogo.casa}
                  <span> VS </span>
                  {bandeiras[jogo.fora] || "🏳️"} {jogo.fora}
                </div>

                <p className="game-info">🏟️ {jogo.estadio}</p>

                {jogo.data && (
                  <p className="game-date">
                    📅 {jogo.data?.split("-").reverse().join("/")} às{" "}
                    {jogo.hora}
                  </p>
                )}

                {resultado && (
                  <>
                    <p className="game-info">📅 {jogo.data}</p>

                    <p className="game-info">🕒 {jogo.hora}</p>
                  </>
                )}

                {jogoEncerrado && (
                  <p className="closed-text">🔒 Palpites encerrados</p>
                )}

                {/* PALPITE */}
                <div className="bet-row">
                  <input
                    type="number"
                    defaultValue={palpite.casa ?? ""}
                    disabled={jogoEncerrado}
                    className="score-input-bet"
                    id={`casa-${jogo.id}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        document.getElementById(`fora-${jogo.id}`)?.focus();
                      }
                    }}
                  />

                  <input
                    type="number"
                    defaultValue={palpite.fora ?? ""}
                    disabled={jogoEncerrado}
                    className="score-input-bet"
                    id={`fora-${jogo.id}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        document.getElementById(`btn-${jogo.id}`)?.click();
                      }
                    }}
                  />

                  <button
                    id={`btn-${jogo.id}`}
                    className="btn-bet"
                    disabled={jogoEncerrado}
                    onClick={() => {
                      const casa = document.getElementById(
                        `casa-${jogo.id}`,
                      ).value;
                      const fora = document.getElementById(
                        `fora-${jogo.id}`,
                      ).value;

                      salvarPalpite(jogo.id, casa, fora);
                    }}
                  >
                    Apostar
                  </button>
                </div>

                {palpite.casa !== undefined && palpite.fora !== undefined && (
                  <div className="palpite-info">
                    ✔ {palpite.casa} x {palpite.fora}
                    {resultado && (
                      <div className="points">
                        🎯 {calcularPontuacao(palpite, resultado)} pts
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
