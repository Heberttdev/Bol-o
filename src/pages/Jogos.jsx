import { useEffect, useState, useRef } from "react";
import { ref, onValue, set } from "firebase/database";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { getEscudo } from "../utils/escudos";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleDot, LayoutDashboard, Trophy, Target, MapPin, Calendar, Lock, Check, Loader2, Radio } from "lucide-react";

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

function CardJogo({
  jogo,
  palpite,
  resultado,
  agora,
  estaDestacado,
  onSalvarPalpite,
  cardRef
}) {
  const status = obterStatusJogo(jogo, resultado, agora);
  const podeApostar = status === "aberto";
  const [casa, setCasa] = useState(palpite?.casa !== undefined ? String(palpite.casa) : "");
  const [fora, setFora] = useState(palpite?.fora !== undefined ? String(palpite.fora) : "");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setCasa(palpite?.casa !== undefined ? String(palpite.casa) : "");
    setFora(palpite?.fora !== undefined ? String(palpite.fora) : "");
  }, [palpite?.casa, palpite?.fora]);

  const handleSalvar = async () => {
    setSalvando(true);
    await onSalvarPalpite(jogo.id, casa, fora);
    setSalvando(false);
  };

  return (
    <div
      ref={cardRef}
      className="game-card-bet"
      style={estaDestacado ? { border: "2px solid #00ff88", boxShadow: "0 0 24px rgba(0,255,136,0.4)" } : undefined}
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
        <EscudoTime nome={jogo.casa} /> {jogo.casa}
        <span> VS </span>
        <EscudoTime nome={jogo.fora} /> {jogo.fora}
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
        <div className="result-box">Resultado: {resultado.casa} x {resultado.fora}</div>
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

      <div className="bet-row">
        <input
          type="number"
          min="0"
          inputMode="numeric"
          aria-label={`Placar de ${jogo.casa}`}
          value={casa}
          onChange={(e) => setCasa(e.target.value)}
          disabled={!podeApostar || salvando}
          className="score-input-bet"
          placeholder="0"
        />
        <input
          type="number"
          min="0"
          inputMode="numeric"
          aria-label={`Placar de ${jogo.fora}`}
          value={fora}
          onChange={(e) => setFora(e.target.value)}
          disabled={!podeApostar || salvando}
          className="score-input-bet"
          placeholder="0"
        />
        <button
          className="btn-bet"
          disabled={!podeApostar || salvando}
          onClick={handleSalvar}
        >
          {salvando ? "Salvando..." : "Apostar"}
        </button>
      </div>

      {palpite?.casa !== undefined && palpite?.fora !== undefined && (
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
}

export default function Jogos() {
  const [jogos, setJogos] = useState([]);
  const [faseSelecionada, setFaseSelecionada] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [palpites, setPalpites] = useState({});
  const [resultados, setResultados] = useState({});
  const [statusSelecionado, setStatusSelecionado] = useState("ativos");
  const [toast, setToast] = useState(null);
  const [agora, setAgora] = useState(new Date());
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const jogoSelecionado = new URLSearchParams(location.search).get("jogo");
  const cardRefs = useRef({});

  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (jogoSelecionado && !loading) {
      const el = cardRefs.current[jogoSelecionado];
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    }
  }, [jogoSelecionado, loading, jogos]);

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
      (snapshot) => {
        if (snapshot.exists()) {
          const lista = Object.values(snapshot.val());
          lista.sort((a, b) => new Date(a.data) - new Date(b.data));
          setJogos(lista);
        } else {
          setJogos([]);
        }
        checarLoading();
      },
      (err) => {
        console.error("Erro ao carregar jogos:", err);
        checarLoading();
      }
    );

    const unsubBets = onValue(
      ref(database, `bets/${user.uid}`),
      (snapshot) => {
        setPalpites(snapshot.exists() ? snapshot.val() : {});
        checarLoading();
      },
      (err) => {
        console.error("Erro ao carregar palpites:", err);
        checarLoading();
      }
    );

    const unsubResultados = onValue(
      ref(database, "resultados"),
      (snapshot) => {
        setResultados(snapshot.exists() ? snapshot.val() : {});
        checarLoading();
      },
      (err) => {
        console.error("Erro ao carregar resultados:", err);
        checarLoading();
      }
    );

    return () => {
      unsubJogos();
      unsubBets();
      unsubResultados();
    };
  }, [user]);

  const exibirToast = (mensagem, tipo = "success") => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const fases = ["Todas", ...new Set(jogos.map(j => j.fase).filter(Boolean))];

  async function salvarPalpite(jogoId, casa, fora) {
    if (casa === "" || fora === "") {
      exibirToast("Preencha os dois placares antes de apostar.", "error");
      return;
    }

    try {
      await set(ref(database, `bets/${user.uid}/${jogoId}`), {
        casa: Number(casa),
        fora: Number(fora),
      });
      exibirToast(`Palpite salvo: ${casa} x ${fora}`, "success");
    } catch (erro) {
      console.error(erro);
      exibirToast("Não foi possível salvar o palpite. Verifique se o jogo já iniciou.", "error");
    }
  }

  if (loading) return (
    <Layout><div className="dashboard-container">
      <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Loader2 size={20} /> Carregando jogos...
      </h2>
      <div className="games-grid"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
    </div></Layout>
  );

  const jogosFiltrados = jogoSelecionado
    ? jogos
    : jogos
        .filter(j => faseSelecionada === "Todas" ? true : j.fase === faseSelecionada)
        .filter(jogo => {
          const s = obterStatusJogo(jogo, resultados[jogo.id], agora);
          if (statusSelecionado === "ativos") return s === "aberto" || s === "em_andamento";
          if (statusSelecionado === "encerrados") return s === "encerrado";
          return true;
        });

  return (
    <Layout>
      <div className="dashboard-container">
        {toast && (
          <div className={toast.tipo === "error" ? "toast-error" : "toast-success"} role="status">
            {toast.mensagem}
          </div>
        )}
        <div className="dash-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CircleDot size={22} /> Brasileirão 2026
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

        {jogoSelecionado ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a2230", padding: "10px 14px", borderRadius: "10px", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ color: "#FFD700", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <Target size={16} /> Mostrando jogo selecionado
            </span>
            <button className="btn-bet" style={{ flex: "none", padding: "6px 14px" }} onClick={() => navigate("/jogos")}>
              Ver todos os jogos
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px", flexWrap: "nowrap" }}>
            <select value={faseSelecionada} onChange={e => setFaseSelecionada(e.target.value)} className="filter-select" style={{ flex: 1, minWidth: 0 }}>
              {fases.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={statusSelecionado} onChange={e => setStatusSelecionado(e.target.value)} className="filter-select" style={{ flex: 1, minWidth: 0 }}>
              <option value="ativos">Abertos e em andamento</option>
              <option value="encerrados">Encerrados</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        )}

        <div className="games-grid">
          {jogosFiltrados.map(jogo => (
            <CardJogo
              key={jogo.id}
              jogo={jogo}
              palpite={palpites[jogo.id]}
              resultado={resultados[jogo.id]}
              agora={agora}
              estaDestacado={jogoSelecionado === jogo.id}
              onSalvarPalpite={salvarPalpite}
              cardRef={el => cardRefs.current[jogo.id] = el}
            />
          ))}
        </div>

      </div>
    </Layout>
  );
}
