import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ref, get, set } from "firebase/database";
import worldcup from "../data/worldcup.json";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { bandeiras } from "../utils/bandeiras";
import { Settings, Download, LayoutDashboard, Target, Check, Loader2, ShieldAlert, MapPin, Calendar } from "lucide-react";

// Converte "2026-06-25" + "17:00 UTC-3" em uma string ISO com o
// horário de Brasília explícito, evitando que o JavaScript reinterprete
// como UTC puro (o que causava o erro de dia/hora trocados).
function montarDataISO(dateStr, timeStr) {
  if (!dateStr) return "";

  // Extrai só "17:00" do formato "17:00 UTC-3"
  const horaMatch = (timeStr || "").match(/(\d{1,2}):(\d{2})/);
  const hora = horaMatch ? horaMatch[1].padStart(2, "0") : "00";
  const minuto = horaMatch ? horaMatch[2] : "00";

  // Monta data com offset explícito -03:00 (Brasília),
  // assim new Date(...) não converte errado depois.
  return `${dateStr}T${hora}:${minuto}:00-03:00`;
}
function montarLockAt(dateStr, timeStr) {
  const dataISO = montarDataISO(dateStr, timeStr);
  const timestamp = Date.parse(dataISO);

  return Number.isNaN(timestamp) ? null : timestamp;
}

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [jogos, setJogos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [faseSelecionada, setFaseSelecionada] = useState("Todas");
  const [statusSelecionado, setStatusSelecionado] = useState("todos");

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
  if (!isAdmin) {
    return (
      <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ShieldAlert size={20} /> Acesso negado
      </h2>
    );
  }

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
          data: montarDataISO(jogo.date, jogo.time),
          lockAt: montarLockAt(jogo.date, jogo.time),
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

  const fases = [
    "Todas",
    ...new Set(jogos.map((j) => j.fase).filter(Boolean)),
  ];

  const jogosFiltrados = jogos
    .filter((j) => (faseSelecionada === "Todas" ? true : j.fase === faseSelecionada))
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
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings size={22} /> Painel Administrativo
            </h2>
            <p>Controle de jogos e resultados oficiais</p>
          </div>

          <div className="quick-actions">
            <button onClick={importarJogos} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={16} /> Importar Copa
            </button>

            <button onClick={() => navigate("/dashboard")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="admin-toolbar">
          <h3 style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Target size={18} /> Resultados Oficiais
          </h3>

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
            <option value="pendentes">Pendentes (sem resultado)</option>
            <option value="lancados">Já lançados</option>
            <option value="todos">Todos</option>
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
                    <span className="badge green" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Check size={12} /> Lançado
                    </span>
                  ) : (
                    <span className="badge" style={{ background: "#3a2f0f", color: "#ffd700" }}>
                      Pendente
                    </span>
                  )}
                </div>

                <div className="game-title">
  {jogo.casa === "A Definir" ? (
    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <Loader2 size={16} /> Aguardando definição
    </span>
  ) : (
    <>
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
    </>
  )}
</div>

                {jogo.data && (
                  <p className="game-date">
                   <Calendar size={14} /> {new Date(jogo.data).toLocaleString("pt-BR")}
                  </p>
                )}

                <p className="game-info" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={14} /> {jogo.estadio}
                </p>

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
                        `res-casa-${jogo.id}`
                      ).value;

                      const fora = document.getElementById(
                        `res-fora-${jogo.id}`
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