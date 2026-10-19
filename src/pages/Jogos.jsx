import { useEffect, useState, useRef } from "react";
import { ref, onValue, set } from "firebase/database";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { sanitizarPlacar } from "../utils/sanitizarNumeros";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { getEscudo } from "../utils/escudos";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleDot, LayoutDashboard, Trophy, Target, MapPin, Calendar, Lock, Check, Loader2, Radio, ArrowRight, ChevronLeft, ChevronRight, AlarmClock } from "lucide-react";
import { competicaoDaFase, nomeCurtoDaFase, ordenarFases, fasesAtuaisPorCompeticao } from "../utils/fases";

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

function formatarFechamento(lockAt, agora) {
  const diff = new Date(lockAt).getTime() - agora.getTime();
  if (diff <= 0) return null;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Fechando em instantes";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `Fecha em ${h}h ${m}min` : `Fecha em ${min}min`;
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
  const bloqueadoPorLock = Boolean(jogo.lockAt) && agora.getTime() >= new Date(jogo.lockAt).getTime();
  const podeApostar = status === "aberto" && !bloqueadoPorLock;
  const [casa, setCasa] = useState(palpite?.casa !== undefined ? String(palpite.casa) : "");
  const [fora, setFora] = useState(palpite?.fora !== undefined ? String(palpite.fora) : "");
  const [estadoSalvar, setEstadoSalvar] = useState(null);
  const [palpiteSincronizado, setPalpiteSincronizado] = useState(palpite);
  const timerRef = useRef(null);
  const pendenteRef = useRef(null);
  const salvarRef = useRef(onSalvarPalpite);
  const temPalpite = palpite?.casa !== undefined && palpite?.fora !== undefined;

  if (palpite !== palpiteSincronizado) {
    setPalpiteSincronizado(palpite);
    if (estadoSalvar !== "digitando") {
      setCasa(palpite?.casa !== undefined ? String(palpite.casa) : "");
      setFora(palpite?.fora !== undefined ? String(palpite.fora) : "");
    }
  }

  useEffect(() => {
    salvarRef.current = onSalvarPalpite;
  }, [onSalvarPalpite]);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    if (pendenteRef.current) {
      const { novaCasa, novaFora } = pendenteRef.current;
      salvarRef.current(jogo.id, novaCasa, novaFora);
    }
  }, [jogo.id]);

  const agendarSalvamento = (novaCasa, novaFora) => {
    clearTimeout(timerRef.current);
    pendenteRef.current = null;
    if (novaCasa === "" || novaFora === "") {
      setEstadoSalvar(novaCasa === "" && novaFora === "" ? null : "incompleto");
      return;
    }
    if (temPalpite && String(palpite.casa) === novaCasa && String(palpite.fora) === novaFora) {
      setEstadoSalvar("salvo");
      return;
    }
    pendenteRef.current = { novaCasa, novaFora };
    setEstadoSalvar("digitando");
    timerRef.current = setTimeout(async () => {
      pendenteRef.current = null;
      setEstadoSalvar("salvando");
      const ok = await salvarRef.current(jogo.id, novaCasa, novaFora);
      setEstadoSalvar(ok ? "salvo" : "erro");
    }, 700);
  };

  const alterarCasa = (valor) => {
    const v = sanitizarPlacar(valor);
    setCasa(v);
    agendarSalvamento(v, fora);
  };

  const alterarFora = (valor) => {
    const v = sanitizarPlacar(valor);
    setFora(v);
    agendarSalvamento(casa, v);
  };

  const mensagemStatus = {
    incompleto: { texto: "Preencha os dois placares", cor: "var(--text-muted)" },
    digitando: { texto: "Salvando em instantes…", cor: "var(--text-muted)" },
    salvando: { texto: "Salvando…", cor: "var(--text-muted)" },
    salvo: { texto: "✓ Palpite salvo", cor: "var(--primary)" },
    erro: { texto: "Não foi possível salvar. Tente de novo.", cor: "var(--danger)" },
  }[estadoSalvar];

  const minutosParaFechar = jogo.lockAt ? (new Date(jogo.lockAt).getTime() - agora.getTime()) / 60000 : null;
  const urgente = podeApostar && !temPalpite && minutosParaFechar != null && minutosParaFechar <= 60;
  const pontos = temPalpite && resultado ? calcularPontuacao(palpite, resultado) : null;

  let badgeStatus = <span className="badge green">Aberto</span>;
  if (podeApostar && minutosParaFechar != null && minutosParaFechar <= 24 * 60) {
    badgeStatus = (
      <span className={`badge ${urgente ? "badge-urgente" : "badge-aviso"}`}>
        <Lock size={12} /> {formatarFechamento(jogo.lockAt, agora)}
      </span>
    );
  } else if (status === "em_andamento") {
    badgeStatus = (
      <span className="badge" style={{ background: "var(--cyan)", color: "#000" }}>
        <Radio size={12} /> Ao vivo
      </span>
    );
  } else if (!podeApostar) {
    badgeStatus = <span className="badge red"><Lock size={12} /> Encerrado</span>;
  }

  let resumoTravado = "Você não palpitou neste jogo";
  if (temPalpite && resultado) resumoTravado = `Seu palpite ${palpite.casa} x ${palpite.fora}`;
  else if (temPalpite) resumoTravado = `Seu palpite ${palpite.casa} x ${palpite.fora} · aguardando resultado`;

  const classes = ["game-card-bet"];
  if (urgente) classes.push("card-urgente");
  if (estaDestacado) classes.push("card-destacado");

  return (
    <div ref={cardRef} className={classes.join(" ")}>
      <div className="game-top">
        <span className="badge">{jogo.fase}</span>
        {badgeStatus}
      </div>

      <div className="game-title">
        <EscudoTime nome={jogo.casa} /> {jogo.casa}
        <span> VS </span>
        <EscudoTime nome={jogo.fora} /> {jogo.fora}
      </div>

      <p className="game-date" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        {jogo.data && <><Calendar size={14} /> {new Date(jogo.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</>}
        {jogo.estadio && <><MapPin size={14} style={{ marginLeft: 6 }} /> {jogo.estadio}</>}
      </p>

      {podeApostar ? (
        <>
          <div className="bet-row placar-row">
            <input
              type="text"
              min="0"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label={`Placar de ${jogo.casa}`}
              value={casa}
              onChange={(e) => alterarCasa(e.target.value)}
              className="score-input-bet"
              placeholder="–"
            />
            <span className="bet-x" aria-hidden="true">x</span>
            <input
              type="text"
              min="0"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label={`Placar de ${jogo.fora}`}
              value={fora}
              onChange={(e) => alterarFora(e.target.value)}
              className="score-input-bet"
              placeholder="–"
            />
          </div>
          <p className="palpite-status" role="status" aria-live="polite" style={{ color: mensagemStatus?.cor }}>
            {mensagemStatus?.texto || (temPalpite ? "✓ Palpite salvo — altere quando quiser" : "Digite o placar — salva sozinho")}
          </p>
        </>
      ) : (
        <div className="resumo-travado">
          {resultado && <strong className="resumo-resultado">Resultado {resultado.casa} x {resultado.fora}</strong>}
          <span className={temPalpite ? "" : "resumo-sem-palpite"}>{resumoTravado}</span>
          {pontos != null && (
            <span className={`resumo-pontos pts-${pontos}`}>
              <Target size={13} /> {pontos} pts
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function Jogos() {
  const [jogos, setJogos] = useState([]);
  const [faseSelecionada, setFaseSelecionada] = useState("Rodada atual");
  const [competicao, setCompeticao] = useState("Todas");
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

  const competicoes = [...new Set(jogos.map((j) => competicaoDaFase(j.fase)))];
  const jogosDaCompeticao = competicao === "Todas" ? jogos : jogos.filter((j) => competicaoDaFase(j.fase) === competicao);
  const fasesOrdenadas = ordenarFases(jogosDaCompeticao);
  const fasesAtuais = fasesAtuaisPorCompeticao(jogosDaCompeticao, agora);
  const conjuntoFasesAtuais = new Set(Object.values(fasesAtuais));
  const faseEfetiva =
    faseSelecionada === "Rodada atual" && competicao !== "Todas"
      ? fasesAtuais[competicao] || fasesOrdenadas[fasesOrdenadas.length - 1] || null
      : faseSelecionada;
  const indiceFase = fasesOrdenadas.indexOf(faseEfetiva);

  const trocarCompeticao = (c) => {
    setCompeticao(c);
    setFaseSelecionada("Rodada atual");
  };

  const irParaFase = (delta) => {
    const alvo = fasesOrdenadas[indiceFase + delta];
    if (alvo) setFaseSelecionada(alvo);
  };

  async function salvarPalpite(jogoId, casa, fora) {
    if (casa === "" || fora === "") return false;

    try {
      await set(ref(database, `bets/${user.uid}/${jogoId}`), {
        casa: Number(casa),
        fora: Number(fora),
      });
      return true;
    } catch (erro) {
      console.error(erro);
      exibirToast("Não foi possível salvar o palpite. Verifique se o jogo já iniciou.", "error");
      return false;
    }
  }

  const proximoSemPalpite = jogos
    .filter((j) => {
      if (j.id === jogoSelecionado || palpites[j.id]) return false;
      if (obterStatusJogo(j, resultados[j.id], agora) !== "aberto") return false;
      return !j.lockAt || new Date(j.lockAt).getTime() > agora.getTime();
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data))[0];

  const fechandoSemPalpite = jogos.filter((j) => {
    if (palpites[j.id] || !j.lockAt) return false;
    if (obterStatusJogo(j, resultados[j.id], agora) !== "aberto") return false;
    const faltam = new Date(j.lockAt).getTime() - agora.getTime();
    return faltam > 0 && faltam <= 24 * 60 * 60 * 1000;
  });

  const jogoSelecionadoTemPalpite = Boolean(jogoSelecionado && palpites[jogoSelecionado]);

  let textoBanner = "Mostrando jogo selecionado";
  if (jogoSelecionadoTemPalpite) {
    textoBanner = proximoSemPalpite
      ? "Palpite salvo! Bora pro próximo?"
      : "Palpite salvo! Você palpitou em todos os jogos abertos 🎉";
  }

  if (loading) return (
    <Layout><div className="dashboard-container">
      <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Loader2 size={20} /> Carregando jogos...
      </h2>
      <div className="games-grid"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
    </div></Layout>
  );

  const jogosFiltrados = jogos
        .filter(j => {
          if (jogoSelecionado && j.id === jogoSelecionado) return true;
          if (competicao !== "Todas") {
            if (competicaoDaFase(j.fase) !== competicao) return false;
            return faseEfetiva ? j.fase === faseEfetiva : true;
          }
          if (faseSelecionada === "Rodada atual") {
            return conjuntoFasesAtuais.size ? conjuntoFasesAtuais.has(j.fase) : true;
          }
          return faseSelecionada === "Todas" ? true : j.fase === faseSelecionada;
        })
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
              <CircleDot size={22} /> {competicao === "Todas" ? "Jogos" : competicao}
            </h2>
            <p>Digite o placar — seu palpite salva sozinho</p>
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
          <div className="proximo-palpite-bar">
            <span style={{ color: jogoSelecionadoTemPalpite ? "var(--primary)" : "var(--gold)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
              {jogoSelecionadoTemPalpite ? <Check size={16} /> : <Target size={16} />}
              {textoBanner}
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {jogoSelecionadoTemPalpite && proximoSemPalpite && (
                <button
                  className="btn-bet"
                  style={{ flex: "none", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                  onClick={() => navigate(`/jogos?jogo=${proximoSemPalpite.id}`)}
                >
                  {proximoSemPalpite.casa} x {proximoSemPalpite.fora} <ArrowRight size={14} />
                </button>
              )}
              <button className="btn-secundario" onClick={() => navigate("/jogos")}>
                Ver todos os jogos
              </button>
            </div>
          </div>
        ) : (
          <div className="filtros-jogos">
            {competicoes.length > 1 && (
              <div className="chips" role="tablist" aria-label="Competição">
                {["Todas", ...competicoes].map((c) => (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={competicao === c}
                    className={`chip ${competicao === c ? "ativo" : ""}`}
                    onClick={() => trocarCompeticao(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            <div className="filtros-linha">
              {competicao !== "Todas" ? (
                <div className="navegador-rodada">
                  <button aria-label="Rodada anterior" disabled={indiceFase <= 0} onClick={() => irParaFase(-1)}>
                    <ChevronLeft size={18} />
                  </button>
                  <select
                    value={faseEfetiva || ""}
                    onChange={(e) => setFaseSelecionada(e.target.value)}
                    className="filter-select"
                    aria-label="Rodada"
                  >
                    {fasesOrdenadas.map((f) => (
                      <option key={f} value={f}>
                        {nomeCurtoDaFase(f)}{f === fasesAtuais[competicao] ? " (atual)" : ""}
                      </option>
                    ))}
                  </select>
                  <button aria-label="Próxima rodada" disabled={indiceFase < 0 || indiceFase >= fasesOrdenadas.length - 1} onClick={() => irParaFase(1)}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
                <select value={faseSelecionada} onChange={(e) => setFaseSelecionada(e.target.value)} className="filter-select" aria-label="Rodada">
                  <option value="Rodada atual">Rodadas atuais</option>
                  <option value="Todas">Todas as rodadas</option>
                </select>
              )}
              <select value={statusSelecionado} onChange={(e) => setStatusSelecionado(e.target.value)} className="filter-select" aria-label="Situação dos jogos">
                <option value="ativos">Abertos e ao vivo</option>
                <option value="encerrados">Encerrados</option>
                <option value="todos">Todos</option>
              </select>
            </div>

            {fechandoSemPalpite.length > 0 && (
              <button className="aviso-urgencia" onClick={() => navigate(`/jogos?jogo=${fechandoSemPalpite[0].id}`)}>
                <AlarmClock size={16} />
                <span>
                  {fechandoSemPalpite.length === 1
                    ? "1 jogo fecha nas próximas 24h e você ainda não palpitou"
                    : `${fechandoSemPalpite.length} jogos fecham nas próximas 24h sem seu palpite`}
                </span>
                <ArrowRight size={14} />
              </button>
            )}
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
          {jogosFiltrados.length === 0 && (
            <p className="list-empty">Nenhum jogo para esse filtro. Tente outra rodada ou situação.</p>
          )}
        </div>

      </div>
    </Layout>
  );
}
