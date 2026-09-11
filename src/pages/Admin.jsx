import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ref, get, set, onValue } from "firebase/database";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { getEscudo } from "../utils/escudos";
import brasileirao from "../data/brasileirao.json";
import champions from "../data/champions-league.json";
import Loading from "../components/Loading";
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
  Radio,
  Trophy,
  CircleDot,
  AlertTriangle,
  Sparkles,
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

  useEffect(() => {
    setCasa(resultado?.casa !== undefined ? String(resultado.casa) : "");
    setFora(resultado?.fora !== undefined ? String(resultado.fora) : "");
  }, [resultado?.casa, resultado?.fora]);

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
          <span className="badge" style={{ background: "#3a2f0f", color: "#ffd700" }}>Pendente</span>
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
            <span style={{ margin: "0 10px", color: "#888" }}>VS</span>
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
          type="number"
          min="0"
          inputMode="numeric"
          value={casa}
          onChange={(e) => setCasa(e.target.value)}
          placeholder="Casa"
          disabled={salvando}
        />
        <input
          className="score-input-bet"
          type="number"
          min="0"
          inputMode="numeric"
          value={fora}
          onChange={(e) => setFora(e.target.value)}
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
  const [statusSelecionado, setStatusSelecionado] = useState("todos");
  const [toast, setToast] = useState(null);
  const [importando, setImportando] = useState(false);

  // Form de Notificação
  const [notifTitulo, setNotifTitulo] = useState("");
  const [notifCorpo, setNotifCorpo] = useState("");
  const [notifTipo, setNotifTipo] = useState("geral");
  const [notifLink, setNotifLink] = useState("/jogos");
  const [enviandoNotif, setEnviandoNotif] = useState(false);

  useEffect(() => {
    if (!user) {
      setCheckingRole(false);
      return;
    }
    verificarAdmin();
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
    } finally {
      setCheckingRole(false);
    }
  }

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
  if (checkingRole) return <h2>Verificando permissões...</h2>;
  if (!user) return <Navigate to="/" />;
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
    try {
      let importados = 0;
      for (const jogo of jogos) {
        const jogoId = jogo.id;
        const dataISO = montarDataISO(jogo.date, jogo.time);
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
      }
      exibirToast(`✅ ${importados} jogos do ${nome} importados com sucesso!`, "success");
    } catch (error) {
      console.error(error);
      exibirToast("Erro ao importar jogos: " + error.message, "error");
    } finally {
      setImportando(false);
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

  const fases = ["Todas", ...new Set(jogos.map((j) => j.fase).filter(Boolean))];
  const jogosFiltrados = jogos
    .filter((j) => (faseSelecionada === "Todas" ? true : j.fase === faseSelecionada))
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
              <Download size={16} /> {importando ? "Importando..." : "Importar Brasileirão"}
            </button>
            <button onClick={() => importarJogos(champions.matches, "Liga dos Campeões")} disabled={importando} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={16} /> {importando ? "Importando..." : "Importar Champions"}
            </button>
            <button onClick={() => navigate("/dashboard")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
          </div>
        </div>

        {/* Abas de Navegação Admin */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setAbaAtiva("jogos")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: abaAtiva === "jogos" ? "#00ff88" : "#1a2230",
              color: abaAtiva === "jogos" ? "#000" : "#fff",
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
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: abaAtiva === "notificacoes" ? "#FFD700" : "#1a2230",
              color: abaAtiva === "notificacoes" ? "#0F3D2E" : "#fff",
              transition: "all 0.2s",
            }}
          >
            <Bell size={18} /> Disparar Notificações ({notificacoes.length})
          </button>
        </div>

        {/* ABA 1: JOGOS E RESULTADOS */}
        {abaAtiva === "jogos" && (
          <>
            <div className="admin-toolbar">
              <h3 style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Target size={18} /> Resultados Oficiais
              </h3>
              <select className="filter-select" value={faseSelecionada} onChange={(e) => setFaseSelecionada(e.target.value)}>
                {fases.map((fase) => <option key={fase} value={fase}>{fase}</option>)}
              </select>
              <select className="filter-select" value={statusSelecionado} onChange={(e) => setStatusSelecionado(e.target.value)}>
                <option value="pendentes">Pendentes (sem resultado)</option>
                <option value="lancados">Já lançados</option>
                <option value="todos">Todos</option>
              </select>
            </div>

            <div className="games-grid">
              {jogosFiltrados.map((jogo) => (
                <AdminCardJogo
                  key={jogo.id}
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
                background: "#141a23",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <h3 style={{ margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px", color: "#FFD700" }}>
                <Send size={18} /> Criar e Disparar Notificação
              </h3>

              {/* Botões de Presets */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "#888", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={14} color="#FFD700" /> Modelos Rápidos (1-clique):
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("⚽ Rodada Aberta!", "Faça seus palpites antes que as partidas comecem e garanta seus pontos.", "jogos", "/jogos")}
                    style={{ background: "#1b2533", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.76rem", cursor: "pointer" }}
                  >
                    ⚽ Lembrete de Palpites
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("🎯 Resultados Atualizados!", "Os resultados oficiais foram lançados. Veja sua pontuação no ranking.", "resultados", "/ranking")}
                    style={{ background: "#1b2533", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.76rem", cursor: "pointer" }}
                  >
                    🎯 Resultados Lançados
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("🏆 Disputa no Top 3!", "Confira a nova classificação geral do Brasileirão 2026.", "ranking", "/ranking")}
                    style={{ background: "#1b2533", color: "#00bfff", border: "1px solid rgba(0,191,255,0.3)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.76rem", cursor: "pointer" }}
                  >
                    🏆 Ranking Atualizado
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("📺 Partida Ao Vivo!", "A partida já começou! Acompanhe a transmissão e estatísticas ao vivo.", "aovivo", "/ao-vivo")}
                    style={{ background: "#1b2533", color: "#ff0080", border: "1px solid rgba(255,0,128,0.3)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.76rem", cursor: "pointer" }}
                  >
                    📺 Transmissão Ao Vivo
                  </button>
                </div>
              </div>

              <form onSubmit={handleDispararNotificacao} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "#aab", marginBottom: "4px" }}>
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
                      background: "#0b0f14",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "#aab", marginBottom: "4px" }}>
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
                      background: "#0b0f14",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "0.9rem",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", color: "#aab", marginBottom: "4px" }}>
                      Tipo / Categoria
                    </label>
                    <select
                      value={notifTipo}
                      onChange={(e) => setNotifTipo(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#0b0f14",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "0.9rem",
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
                    <label style={{ display: "block", fontSize: "0.82rem", color: "#aab", marginBottom: "4px" }}>
                      Redirecionar Para (Link)
                    </label>
                    <select
                      value={notifLink}
                      onChange={(e) => setNotifLink(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#0b0f14",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "0.9rem",
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
                    background: "#00ff88",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "0.95rem",
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
              <h3 style={{ margin: "0 0 12px", fontSize: "1rem", color: "#aab", display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={16} /> Notificações Enviadas ({notificacoes.length})
              </h3>
              {notificacoes.length === 0 ? (
                <p style={{ color: "#666", fontSize: "0.85rem" }}>Nenhuma notificação enviada ainda.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {notificacoes.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "#141a23",
                        border: "1px solid rgba(255,255,255,0.06)",
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
                          <span style={{ fontSize: "0.72rem", background: "#0b0f14", color: "#FFD700", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {item.tipo?.toUpperCase() || "GERAL"}
                          </span>
                          <strong style={{ color: "#fff", fontSize: "0.9rem" }}>{item.titulo}</strong>
                          <span style={{ fontSize: "0.72rem", color: "#666", marginLeft: "auto" }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR") : ""}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#aab" }}>{item.corpo}</p>
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
                          color: "#ff4d4d",
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
      </div>
    </Layout>
  );
}