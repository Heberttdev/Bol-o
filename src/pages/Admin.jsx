import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ref, get, set } from "firebase/database";
import worldcup from "../data/worldcup.json";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { bandeiras } from "../utils/bandeiras";

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [jogos, setJogos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [faseSelecionada, setFaseSelecionada] = useState("Todas");
  const [statusSelecionado, setStatusSelecionado] = useState("pendentes");

  useEffect(() => {
    if (!user) return;

    verificarAdmin();
    carregarJogos();
  }, [user]);

  async function verificarAdmin() {
    try {
      const snapshot = await get(ref(database, `users/${user.uid}`));

      if (snapshot.exists()) {
        const dados = snapshot.val();
        if (dados.role === "admin") setIsAdmin(true);
      }
    } catch (error) {
      console.error(error);
    }

    setCheckingRole(false);
  }

  if (loading) return <h2>Carregando usuário...</h2>;
  if (checkingRole) return <h2>Verificando permissões...</h2>;
  if (!user) return <Navigate to="/" />;
  if (!isAdmin) return <h2>⛔ Acesso negado</h2>;

  async function importarJogos() {
    try {
      let contador = 1;

      for (const jogo of worldcup.matches) {
        const jogoId = `J${String(contador).padStart(3, "0")}`;

        await set(ref(database, `jogos/${jogoId}`), {
          id: jogoId,
          casa: jogo.team1 || "A Definir",
          fora: jogo.team2 || "A Definir",
          fase: jogo.group || jogo.round || "Fase Final",
          data: jogo.date || "",
          hora: jogo.time || "",
          estadio: jogo.ground || "",
        });

        if (jogo.score && jogo.score.ft) {
          await set(ref(database, `resultados/${jogoId}`), {
            casa: Number(jogo.score.ft[0]),
            fora: Number(jogo.score.ft[1]),
          });
        }

        contador++;
      }

      alert("Jogos importados com sucesso!");
      carregarJogos();
    } catch (error) {
      console.error(error);
      alert("Erro ao importar jogos");
    }
  }

  async function carregarJogos() {
    try {
      const [jogosSnap, resultadosSnap] = await Promise.all([
        get(ref(database, "jogos")),
        get(ref(database, "resultados")),
      ]);

      if (jogosSnap.exists()) {
        setJogos(Object.values(jogosSnap.val()));
      }

      if (resultadosSnap.exists()) {
        setResultados(resultadosSnap.val());
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function salvarResultado(jogoId, casa, fora) {
    try {
      await set(ref(database, `resultados/${jogoId}`), {
        casa: Number(casa),
        fora: Number(fora),
      });

      alert("Resultado salvo!");
    } catch (error) {
      console.error(error);
    }
  }

  const fases = ["Todas", ...new Set(jogos.map((j) => j.fase).filter(Boolean))];

  const jogosFiltrados = jogos
    .filter((j) =>
      faseSelecionada === "Todas" ? true : j.fase === faseSelecionada,
    )
    .filter((jogo) => {
      const temResultado = !!resultados[jogo.id];

      if (statusSelecionado === "pendentes") return !temResultado;
      if (statusSelecionado === "lancados") return temResultado;
      return true; // "todos"
    });

  return (
    <Layout>
      <div className="dashboard-container">
        {/* HEADER estilo painel */}
        <div className="dash-header">
          <div>
            <h2>🛠️ Painel Administrativo</h2>
            <p>Controle de jogos e resultados oficiais</p>
          </div>

          <div className="quick-actions">
            <button onClick={importarJogos}>📥 Importar Copa</button>

            <button onClick={() => navigate("/dashboard")}>📊 Dashboard</button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="admin-toolbar">
          <h3>🎯 Resultados Oficiais</h3>

          <select
            className="filter-select"
            value={faseSelecionada}
            onChange={(e) => setFaseSelecionada(e.target.value)}
          >
            {fases.map((fase) => (
              <option key={fase} value={fase}>
                {fase}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={statusSelecionado}
            onChange={(e) => setStatusSelecionado(e.target.value)}
          >
            <option value="pendentes">🟡 Pendentes (sem resultado)</option>
            <option value="lancados">✅ Já lançados</option>
            <option value="todos">📋 Todos</option>
          </select>
        </div>

        {/* JOGOS */}
        <div className="games-grid">
          {jogosFiltrados.map((jogo) => {
            const resultado = resultados[jogo.id] || {};
            const temResultado = !!resultados[jogo.id];

            return (
              <div key={jogo.id} className="game-card-bet">
                <div className="game-top">
                  <span className="badge">{jogo.fase}</span>
                  {temResultado ? (
                    <span className="badge green">✅ Lançado</span>
                  ) : (
                    <span
                      className="badge"
                      style={{ background: "#3a2f0f", color: "#ffd700" }}
                    >
                      🟡 Pendente
                    </span>
                  )}
                </div>

                <div className="game-title">
  {jogo.casa === "A Definir" ? (
    "⏳ Aguardando definição"
  ) : (
    <>
      {bandeiras[jogo.casa] ? (
        typeof bandeiras[jogo.casa] === "string" &&
        bandeiras[jogo.casa].startsWith("http") ? (
          <img
            src={bandeiras[jogo.casa]}
            alt={jogo.casa}
            style={{ width: "24px", height: "18px", display: "inline-block", verticalAlign: "middle" }}
          />
        ) : (
          <span>{bandeiras[jogo.casa]}</span>
        )
      ) : (
        <span>🏳️</span>
      )}{" "}
      {jogo.casa}
      <span style={{ margin: "0 10px", color: "#888" }}>VS</span>
      {bandeiras[jogo.fora] ? (
        typeof bandeiras[jogo.fora] === "string" &&
        bandeiras[jogo.fora].startsWith("http") ? (
          <img
            src={bandeiras[jogo.fora]}
            alt={jogo.fora}
            style={{ width: "24px", height: "18px", display: "inline-block", verticalAlign: "middle" }}
          />
        ) : (
          <span>{bandeiras[jogo.fora]}</span>
        )
      ) : (
        <span>🏳️</span>
      )}{" "}
      {jogo.fora}
    </>
  )}
</div>

                {jogo.data && (
                  <p className="game-date">
                    📅 {jogo.data}
                    {jogo.hora && ` • ${jogo.hora}`}
                  </p>
                )}

                <p className="game-info">🏟️ {jogo.estadio}</p>

                {/* INPUT RESULTADO */}
                <div className="bet-row">
                  <input
                    className="score-input-bet"
                    id={`res-casa-${jogo.id}`}
                    type="number"
                    defaultValue={resultado.casa ?? ""}
                    placeholder="Casa"
                  />

                  <input
                    className="score-input-bet"
                    id={`res-fora-${jogo.id}`}
                    type="number"
                    defaultValue={resultado.fora ?? ""}
                    placeholder="Fora"
                  />

                  <button
                    className="btn-bet"
                    onClick={() => {
                      const casa = document.getElementById(
                        `res-casa-${jogo.id}`,
                      ).value;

                      const fora = document.getElementById(
                        `res-fora-${jogo.id}`,
                      ).value;

                      salvarResultado(jogo.id, casa, fora);
                    }}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
