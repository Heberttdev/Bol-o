import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ref, get, set, onValue } from "firebase/database";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { getEscudo } from "../utils/escudos";
import { sanitizarPlacar } from "../utils/sanitizarNumeros";
import brasileirao from "../data/brasileirao.json";
import champions from "../data/champions-league.json";
import Loading from "../components/Loading";
import AdminBoloesEspeciais from "../components/AdminBoloesEspeciais";
import { executarMigracoesAdmin, limparJogosOrfaos } from "../utils/migracoesAdmin";
import { competicaoDaFase, nomeCurtoDaFase, ordenarFases, fasesAtuaisPorCompeticao } from "../utils/fases";
import {
  Settings,
  Download,
  LayoutDashboard,
  Target,
  Check,
  Loader2,
  ShieldAlert,
  MapPin,
  Calendar,
  Bell,
  Send,
  Trash2,
  CircleDot,
  Sparkles,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function EscudoTime({ nome, size = 22 }) {
  const url = getEscudo(nome);
  return url
    ? <img src={url} alt={nome} style={{ width: size, height: size, objectFit: "contain", verticalAlign: "middle" }} />
    : <span style={{ fontSize: size * 0.7 }}>🏳️</span>;
}

function montarDataISO(dateStr, timeStr) {
  if (!dateStr) return "";
  const horaMatch = (timeStr || "").match(/(\d{1,2}):(\d{2})/);
  const hora = horaMatch ? horaMatch[1].padStart(2, "0") : "00";
  const minuto = horaMatch ? horaMatch[2] : "00";
  return `${dateStr}T${hora}:${minuto}:00-03:00`;
}

function AdminCardJogo({ jogo, resultado, onSalvarResultado }) {
  const [casa, setCasa] = useState(resultado?.casa !== undefined ? String(resultado.casa) : "");
  const [fora, setFora] = useState(resultado?.fora !== undefined ? String(resultado.fora) : "");
  const [salvando, setSalvando] = useState(false);
  const temResultado = resultado?.casa !== undefined && resultado?.fora !== undefined;

  const handleSalvar = async () => {
    setSalvando(true);
    await onSalvarResultado(jogo.id, casa, fora);
    setSalvando(false);
  };

  return (
    <div className="game-card-bet">
      <div className="game-top">
        <span className="badge">{jogo.fase}</span>
        {temResultado ? (
          <span className="badge green" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Check size={12} /> Lançado ({resultado.casa} x {resultado.fora})
          </span>
        ) : (
          <span className="badge" style={{ background: "rgba(255, 215, 0, 0.15)", color: "var(--gold)" }}>Pendente</span>
        )}
      </div>
      <div className="game-title">
        {jogo.casa === "A Definir" ? (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Loader2 size={16} /> Aguardando definição
          </span>
        ) : (
          <>
            <EscudoTime nome={jogo.casa} /> {jogo.casa}
            <span style={{ margin: "0 10px", color: "var(--text-muted)" }}>VS</span>
            <EscudoTime nome={jogo.fora} /> {jogo.fora}
          </>
        )}
      </div>
      {jogo.data && (
        <p className="game-date" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={14} /> {new Date(jogo.data).toLocaleString("pt-BR")}
        </p>
      )}
      <p className="game-info" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <MapPin size={14} /> {jogo.estadio}
      </p>
      <div className="bet-row">
        <input
          className="score-input-bet"
          type="text"
          min="0"
          inputMode="numeric"
          pattern="[0-9]*"
          value={casa}
          onChange={(e) => setCasa(sanitizarPlacar(e.target.value))}
          placeholder="Casa"
          disabled={salvando}
        />
        <input
          className="score-input-bet"
          type="text"
          min="0"
          inputMode="numeric"
          pattern="[0-9]*"
          value={fora}
          onChange={(e) => setFora(sanitizarPlacar(e.target.value))}
          placeholder="Fora"
          disabled={salvando}
        />
        <button
          className="btn-bet"
          onClick={handleSalvar}
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();
  const { notificacoes, enviarNotificacao, removerNotificacao } = useNotifications();
  const navigate = useNavigate();

  const [abaAtiva, setAbaAtiva] = useState("jogos"); // 'jogos' | 'notificacoes'
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [jogos, setJogos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [faseSelecionada, setFaseSelecionada] = useState("Todas");
  const [competicao, setCompeticao] = useState("Todas");
  const [statusSelecionado, setStatusSelecionado] = useState("pendentes");
  const [toast, setToast] = useState(null);
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const [limpando, setLimpando] = useState(false);

  // Form de Notificação
  const [notifTitulo, setNotifTitulo] = useState("");
  const [notifCorpo, setNotifCorpo] = useState("");
  const [notifTipo, setNotifTipo] = useState("geral");
  const [notifLink, setNotifLink] = useState("/jogos");
  const [enviandoNotif, setEnviandoNotif] = useState(false);

  useEffect(() => {
    if (!user) return;
    let ativo = true;
    (async () => {
      try {
        const snapshot = await get(ref(database, `users/${user.uid}`));
        if (ativo && snapshot.exists() && snapshot.val().role === "admin") setIsAdmin(true);
      } catch (error) {
        console.error(error);
      } finally {
        if (ativo) setCheckingRole(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    executarMigracoesAdmin().catch((err) => console.error("Erro nas migrações admin:", err));
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;

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
      },
      (error) => console.error("Erro ao carregar jogos:", error)
    );

    const unsubResultados = onValue(
      ref(database, "resultados"),
      (snapshot) => {
        setResultados(snapshot.exists() ? snapshot.val() : {});
      },
      (error) => console.error("Erro ao carregar resultados:", error)
    );

    return () => {
      unsubJogos();
      unsubResultados();
    };
  }, [user, isAdmin]);

  const exibirToast = (mensagem, tipo = "success") => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" />;
  if (checkingRole) return <h2>Verificando permissões...</h2>;
  if (!isAdmin) {
    return (
      <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ShieldAlert size={20} /> Acesso negado
      </h2>
    );
  }

  async function importarJogos(lista, nomeCompeticao) {
    const jogos = lista || brasileirao.matches;
    const nome = nomeCompeticao || "Brasileirão";
    if (importando) return;
    setImportando(true);
    setProgresso({ feito: 0, total: jogos.length });
    try {
      let importados = 0;
      let ignorados = 0;
      const TAMANHO_LOTE = 20;
      for (let i = 0; i < jogos.length; i += TAMANHO_LOTE) {
        const lote = jogos.slice(i, i + TAMANHO_LOTE);
        await Promise.all(
          lote.map(async (jogo) => {
            const jogoId = jogo.id;
            const dataISO = montarDataISO(jogo.date, jogo.time);
            const dataValida = dataISO && !Number.isNaN(new Date(dataISO).getTime());
            if (!dataValida) {
              ignorados++;
              console.warn(`Jogo sem data válida ignorado: ${jogoId}`);
              return;
            }
            await set(ref(database, `jogos/${jogoId}`), {
              id: jogoId,
              casa: jogo.team1 || "A Definir",
              fora: jogo.team2 || "A Definir",
              fase: jogo.group || jogo.round || "Fase Final",
              data: dataISO,
              estadio: jogo.ground || "",
              lockAt: new Date(dataISO).getTime(),
            });
            if (jogo.score && jogo.score.ft) {
              await set(ref(database, `resultados/${jogoId}`), {
                casa: Number(jogo.score.ft[0]),
                fora: Number(jogo.score.ft[1]),
              });
            }
            importados++;
          })
        );
        setProgresso({ feito: Math.min(i + TAMANHO_LOTE, jogos.length), total: jogos.length });
      }
      exibirToast(`✅ ${importados} jogos do ${nome} importados com sucesso!${ignorados ? ` (${ignorados} sem data válida ignorados)` : ""}`, "success");
    } catch (error) {
      console.error(error);
      exibirToast("Erro ao importar jogos: " + error.message, "error");
    } finally {
      setImportando(false);
      setProgresso(null);
    }
  }

  async function handleLimparOrfaos() {
    if (importando || limpando) return;
    const ok = window.confirm(
      "Remover as duplicatas antigas (ID de data) dos jogos da rodada atual que foram reimportados com o ID novo.\n\n" +
        "Rodadas passadas, Champions, resultados e palpites NÃO são tocados — o histórico do ranking fica intacto.\n\nContinuar?"
    );
    if (!ok) return;
    setLimpando(true);
    try {
      const { removidos, falhas } = await limparJogosOrfaos(brasileirao.matches);
      if (removidos === 0 && falhas === 0) {
        exibirToast("Nenhum jogo órfão encontrado. Lista já está limpa.", "success");
      } else {
        exibirToast(
          `🧹 ${removidos} jogo(s) órfão(s) removido(s).${falhas ? ` (${falhas} falharam)` : ""}`,
          falhas ? "error" : "success"
        );
      }
    } catch (error) {
      console.error(error);
      exibirToast("Erro ao limpar órfãos: " + error.message, "error");
    } finally {
      setLimpando(false);
    }
  }

  async function salvarResultado(jogoId, casa, fora) {
    if (casa === "" || fora === "") {
      exibirToast("Preencha os dois placares antes de salvar.", "error");
      return;
    }
    try {
      await set(ref(database, `resultados/${jogoId}`), {
        casa: Number(casa),
        fora: Number(fora),
      });
      exibirToast(`Resultado salvo: ${casa} x ${fora}`, "success");
    } catch (error) {
      console.error(error);
      exibirToast("Erro ao salvar resultado: " + error.message, "error");
    }
  }

  async function handleDispararNotificacao(e) {
    e.preventDefault();
    if (!notifTitulo.trim() || !notifCorpo.trim()) {
      exibirToast("Preencha título e mensagem para disparar.", "error");
      return;
    }

    setEnviandoNotif(true);
    try {
      await enviarNotificacao({
        titulo: notifTitulo.trim(),
        corpo: notifCorpo.trim(),
        tipo: notifTipo,
        link: notifLink.trim(),
      });
      exibirToast("📢 Notificação enviada para todos os jogadores!", "success");
      setNotifTitulo("");
      setNotifCorpo("");
    } catch (err) {
      console.error(err);
      exibirToast("Erro ao enviar notificação: " + err.message, "error");
    } finally {
      setEnviandoNotif(false);
    }
  }

  const aplicarPreset = (titulo, corpo, tipo, link) => {
    setNotifTitulo(titulo);
    setNotifCorpo(corpo);
    setNotifTipo(tipo);
    setNotifLink(link);
  };

  const textoImportando = progresso ? `Importando ${progresso.feito}/${progresso.total}…` : "Importando...";

  const agora = new Date();
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

  const jogosFiltrados = jogos
    .filter((j) => {
      if (competicao !== "Todas") {
        if (competicaoDaFase(j.fase) !== competicao) return false;
        return faseEfetiva ? j.fase === faseEfetiva : true;
      }
      if (faseSelecionada === "Rodada atual") {
        return conjuntoFasesAtuais.size ? conjuntoFasesAtuais.has(j.fase) : true;
      }
      return faseSelecionada === "Todas" ? true : j.fase === faseSelecionada;
    })
    .filter((jogo) => {
      const temResultado = !!resultados[jogo.id];
      if (statusSelecionado === "pendentes") return !temResultado;
      if (statusSelecionado === "lancados") return temResultado;
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
              <Settings size={22} /> Painel Administrativo
            </h2>
            <p>Gerenciamento de jogos, resultados e avisos gerais</p>
          </div>
          <div className="quick-actions">
            <button onClick={() => importarJogos(brasileirao.matches, "Brasileirão")} disabled={importando} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={16} /> {importando ? textoImportando : "Importar Brasileirão"}
            </button>
            <button onClick={() => importarJogos(champions.matches, "Liga dos Campeões")} disabled={importando} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={16} /> {importando ? textoImportando : "Importar Champions"}
            </button>
            <button onClick={handleLimparOrfaos} disabled={importando || limpando} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Trash2 size={16} /> {limpando ? "Limpando..." : "Limpar órfãos"}
            </button>
            <button onClick={() => navigate("/dashboard")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
          </div>
        </div>

        {/* Abas de Navegação Admin */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setAbaAtiva("jogos")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "var(--fs-14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: abaAtiva === "jogos" ? "var(--primary)" : "var(--surface-raised)",
              color: abaAtiva === "jogos" ? "#000" : "var(--text)",
              transition: "all 0.2s",
            }}
          >
            <CircleDot size={18} /> Jogos e Resultados
          </button>
          <button
            onClick={() => setAbaAtiva("notificacoes")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "var(--fs-14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: abaAtiva === "notificacoes" ? "var(--gold)" : "var(--surface-raised)",
              color: abaAtiva === "notificacoes" ? "#0F3D2E" : "var(--text)",
              transition: "all 0.2s",
            }}
          >
            <Bell size={18} /> Disparar Notificações ({notificacoes.length})
          </button>
          <button
            onClick={() => setAbaAtiva("boloes")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "var(--fs-14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: abaAtiva === "boloes" ? "var(--primary)" : "var(--surface-raised)",
              color: abaAtiva === "boloes" ? "#000" : "var(--text)",
              transition: "all 0.2s",
            }}
          >
            <Ticket size={18} /> Bolões Especiais
          </button>
        </div>

        {/* ABA 1: JOGOS E RESULTADOS */}
        {abaAtiva === "jogos" && (
          <>
            <div className="admin-toolbar">
              <h3 style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Target size={18} /> {competicao === "Todas" ? "Resultados Oficiais" : competicao}
              </h3>
            </div>

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
                <select className="filter-select" value={statusSelecionado} onChange={(e) => setStatusSelecionado(e.target.value)} aria-label="Situação dos jogos">
                  <option value="pendentes">Pendentes (sem resultado)</option>
                  <option value="lancados">Já lançados</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>

            <div className="games-grid">
              {jogosFiltrados.map((jogo) => (
                <AdminCardJogo
                  key={`${jogo.id}-${resultados[jogo.id]?.casa ?? ""}-${resultados[jogo.id]?.fora ?? ""}`}
                  jogo={jogo}
                  resultado={resultados[jogo.id]}
                  onSalvarResultado={salvarResultado}
                />
              ))}
            </div>
          </>
        )}

        {/* ABA 2: CENTRAL DE NOTIFICAÇÕES */}
        {abaAtiva === "notificacoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Formulário de Envio */}
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <h3 style={{ margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px", color: "var(--gold)" }}>
                <Send size={18} /> Criar e Disparar Notificação
              </h3>

              {/* Botões de Presets */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "var(--fs-12)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={14} style={{ color: "var(--gold)" }} /> Modelos Rápidos (1-clique):
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("⚽ Rodada Aberta!", "Faça seus palpites antes que as partidas comecem e garanta seus pontos.", "jogos", "/jogos")}
                    style={{ background: "var(--surface-raised)", color: "var(--primary)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "6px", padding: "6px 10px", minHeight: "44px", display: "inline-flex", alignItems: "center", fontSize: "var(--fs-12)", cursor: "pointer" }}
                  >
                    ⚽ Lembrete de Palpites
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("🎯 Resultados Atualizados!", "Os resultados oficiais foram lançados. Veja sua pontuação no ranking.", "resultados", "/ranking")}
                    style={{ background: "var(--surface-raised)", color: "var(--gold)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "6px", padding: "6px 10px", minHeight: "44px", display: "inline-flex", alignItems: "center", fontSize: "var(--fs-12)", cursor: "pointer" }}
                  >
                    🎯 Resultados Lançados
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("🏆 Disputa no Top 3!", "Confira a nova classificação geral do Brasileirão 2026.", "ranking", "/ranking")}
                    style={{ background: "var(--surface-raised)", color: "#00bfff", border: "1px solid rgba(0,191,255,0.3)", borderRadius: "6px", padding: "6px 10px", minHeight: "44px", display: "inline-flex", alignItems: "center", fontSize: "var(--fs-12)", cursor: "pointer" }}
                  >
                    🏆 Ranking Atualizado
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("📺 Partida Ao Vivo!", "A partida já começou! Acompanhe a transmissão e estatísticas ao vivo.", "aovivo", "/ao-vivo")}
                    style={{ background: "var(--surface-raised)", color: "#ff0080", border: "1px solid rgba(255,0,128,0.3)", borderRadius: "6px", padding: "6px 10px", minHeight: "44px", display: "inline-flex", alignItems: "center", fontSize: "var(--fs-12)", cursor: "pointer" }}
                  >
                    📺 Transmissão Ao Vivo
                  </button>
                </div>
              </div>

              <form onSubmit={handleDispararNotificacao} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--fs-14)", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Título da Notificação
                  </label>
                  <input
                    type="text"
                    value={notifTitulo}
                    onChange={(e) => setNotifTitulo(e.target.value)}
                    placeholder="Ex: ⚽ 10ª Rodada Aberta!"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "var(--fs-14)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "var(--fs-14)", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Mensagem / Corpo
                  </label>
                  <textarea
                    rows={3}
                    value={notifCorpo}
                    onChange={(e) => setNotifCorpo(e.target.value)}
                    placeholder="Escreva a mensagem para os jogadores..."
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "var(--fs-14)",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--fs-14)", color: "var(--text-muted)", marginBottom: "4px" }}>
                      Tipo / Categoria
                    </label>
                    <select
                      value={notifTipo}
                      onChange={(e) => setNotifTipo(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "var(--fs-14)",
                      }}
                    >
                      <option value="geral">📢 Comunicado Geral</option>
                      <option value="jogos">⚽ Jogos e Palpites</option>
                      <option value="resultados">🎯 Resultados Oficiais</option>
                      <option value="ranking">🏆 Ranking / Pódio</option>
                      <option value="aovivo">📺 Ao Vivo</option>
                      <option value="urgente">⚠️ Urgente / Alerta</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "var(--fs-14)", color: "var(--text-muted)", marginBottom: "4px" }}>
                      Redirecionar Para (Link)
                    </label>
                    <select
                      value={notifLink}
                      onChange={(e) => setNotifLink(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "var(--fs-14)",
                      }}
                    >
                      <option value="/jogos">Página de Jogos (/jogos)</option>
                      <option value="/ranking">Ranking Geral (/ranking)</option>
                      <option value="/palpites">Meus Palpites (/palpites)</option>
                      <option value="/ao-vivo">Transmissões Ao Vivo (/ao-vivo)</option>
                      <option value="/dashboard">Dashboard (/dashboard)</option>
                      <option value="">Nenhum (apenas aviso)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={enviandoNotif}
                  style={{
                    marginTop: "8px",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--primary)",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "var(--fs-16)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Send size={16} /> {enviandoNotif ? "Enviando..." : "Disparar para Todos os Jogadores"}
                </button>
              </form>
            </div>

            {/* Histórico de Notificações Enviadas */}
            <div>
              <h3 style={{ margin: "0 0 12px", fontSize: "var(--fs-16)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={16} /> Notificações Enviadas ({notificacoes.length})
              </h3>
              {notificacoes.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-14)" }}>Nenhuma notificação enviada ainda.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {notificacoes.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "var(--fs-12)", background: "var(--input-bg)", color: "var(--gold)", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {item.tipo?.toUpperCase() || "GERAL"}
                          </span>
                          <strong style={{ color: "var(--text)", fontSize: "var(--fs-14)" }}>{item.titulo}</strong>
                          <span style={{ fontSize: "var(--fs-12)", color: "var(--text-muted)", marginLeft: "auto" }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR") : ""}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "var(--fs-14)", color: "var(--text-muted)" }}>{item.corpo}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja remover a notificação "${item.titulo}"?`)) {
                            removerNotificacao(item.id);
                            exibirToast("Notificação removida.", "success");
                          }
                        }}
                        style={{
                          background: "rgba(255, 77, 77, 0.12)",
                          border: "1px solid rgba(255, 77, 77, 0.2)",
                          color: "var(--danger)",
                          borderRadius: "8px",
                          padding: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Excluir notificação"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 3: BOLÕES ESPECIAIS */}
        {abaAtiva === "boloes" && <AdminBoloesEspeciais exibirToast={exibirToast} />}
      </div>
    </Layout>
  );
}
