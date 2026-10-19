import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { getEscudo } from "../utils/escudos";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { sanitizarPlacar } from "../utils/sanitizarNumeros";
import { calcularRankingBolao } from "../utils/rankingBolaoEspecial";
import { Trophy, Users, Wallet, Check, X, Crown, Ticket, Clock, CheckCircle2 } from "lucide-react";
import Loading from "../components/Loading";

function EscudoTime({ nome, size = 22 }) {
  const url = getEscudo(nome);
  return url ? (
    <img src={url} alt={nome} style={{ width: size, height: size, objectFit: "contain", verticalAlign: "middle" }} />
  ) : (
    <span style={{ fontSize: size * 0.7 }}>🏳️</span>
  );
}

function PalpiteJogoBolao({ jogo, resultado, meuPalpite, travado, podePalpitar, onSalvar }) {
  const tempoInicio = typeof jogo.lockAt === "number" ? jogo.lockAt : new Date(jogo.data || "").getTime();
  const inicioJogo = Number.isFinite(tempoInicio) ? new Date(tempoInicio) : null;
  const [casa, setCasa] = useState(meuPalpite?.casa !== undefined ? String(meuPalpite.casa) : "");
  const [fora, setFora] = useState(meuPalpite?.fora !== undefined ? String(meuPalpite.fora) : "");
  const [salvando, setSalvando] = useState(false);
  const temMeuPalpite = meuPalpite?.casa !== undefined && meuPalpite?.fora !== undefined;
  const pontos = resultado && temMeuPalpite ? calcularPontuacao(meuPalpite, resultado) : null;

  const salvar = async () => {
    if (casa === "" || fora === "") return;
    setSalvando(true);
    try {
      await onSalvar(Number(casa), Number(fora));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "var(--input-bg)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "8px 10px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ flex: 1, minWidth: "160px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
        <EscudoTime nome={jogo.casa} size={18} /> {jogo.casa}
        <span style={{ color: "var(--text-muted)" }}>x</span>
        <EscudoTime nome={jogo.fora} size={18} /> {jogo.fora}
      </span>

      {!travado && inicioJogo && (
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
          <Clock size={12} /> Fecha {inicioJogo.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </span>
      )}

      {resultado ? (
        <span style={{ fontSize: "0.76rem", color: "var(--text)" }}>
          Resultado: <strong>{resultado.casa} x {resultado.fora}</strong>
        </span>
      ) : null}

      {!podePalpitar ? (
        <span style={{ fontSize: "0.78rem", color: "var(--gold)" }}>Aceite o convite para palpitar</span>
      ) : travado ? (
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem" }}>
          {temMeuPalpite ? (
            <span style={{ color: "var(--text)" }}>Seu palpite: {meuPalpite.casa} x {meuPalpite.fora}</span>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>Sem palpite</span>
          )}
          {pontos != null ? <strong style={{ color: pontos >= 10 ? "var(--primary)" : pontos > 0 ? "var(--gold)" : "var(--danger)" }}>{pontos} pts</strong> : null}
        </span>
      ) : (
        <>
          <input
            type="text"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            value={casa}
            onChange={(e) => setCasa(sanitizarPlacar(e.target.value))}
            placeholder="0"
            style={{ width: "52px", minHeight: "44px", padding: "5px 8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", textAlign: "center" }}
          />
          <span style={{ color: "var(--text-muted)" }}>x</span>
          <input
            type="text"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            value={fora}
            onChange={(e) => setFora(sanitizarPlacar(e.target.value))}
            placeholder="0"
            style={{ width: "52px", minHeight: "44px", padding: "5px 8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", textAlign: "center" }}
          />
          <button
            onClick={salvar}
            disabled={salvando || (!temMeuPalpite && casa === "" && fora === "")}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--primary)", color: "#000", border: "none", borderRadius: "8px", padding: "6px 12px", minHeight: "44px", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}
          >
            {salvando ? "Salvando..." : temMeuPalpite ? "Atualizar" : "Salvar"}
          </button>
        </>
      )}
    </div>
  );
}

export default function BoloesEspeciais() {
  const { user, loading } = useAuth();
  const [boloes, setBoloes] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [agora, setAgora] = useState(0);

  useEffect(() => {
    if (!user) return;
    let unsubs = [];
    const unsubIndex = onValue(
      ref(database, `participantesBolao/${user.uid}`),
      (snap) => {
        setAgora(Date.now());
        unsubs.forEach((u) => u());
        unsubs = [];
        const ids = snap.exists() ? Object.keys(snap.val()) : [];
        if (ids.length === 0) {
          setBoloes({});
          setCarregando(false);
          return;
        }
        const acumulado = {};
        let pendentes = ids.length;
        ids.forEach((id) => {
          const unsub = onValue(ref(database, `boloesEspeciais/${id}`), (s) => {
            if (s.exists()) acumulado[id] = s.val();
            else delete acumulado[id];
            setBoloes({ ...acumulado });
            pendentes -= 1;
            if (pendentes <= 0) setCarregando(false);
          });
          unsubs.push(unsub);
        });
      },
      (err) => {
        console.error("Erro ao carregar bolões:", err);
        setCarregando(false);
      }
    );
    return () => {
      unsubIndex();
      unsubs.forEach((u) => u());
    };
  }, [user]);

  const responder = async (id, valor) => {
    if (!user) return;
    try {
      await set(ref(database, `boloesEspeciais/${id}/respostas/${user.uid}`), valor);
    } catch (err) {
      console.error("Erro ao responder convite:", err);
    }
  };

  const salvarPalpite = async (id, jogoId, casa, fora) => {
    if (!user) return;
    try {
      await set(ref(database, `boloesEspeciais/${id}/palpites/${user.uid}/${jogoId}`), { casa, fora });
    } catch (err) {
      console.error("Erro ao salvar palpite:", err);
    }
  };

  if (loading || carregando) return <Loading />;

  const lista = Object.values(boloes).sort((a, b) => {
    const respondidoA = a.respostas?.[user.uid] ? 1 : 0;
    const respondidoB = b.respostas?.[user.uid] ? 1 : 0;
    if (respondidoA !== respondidoB) return respondidoA - respondidoB;
    return (b.criadoEm || 0) - (a.criadoEm || 0);
  });

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dash-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Ticket size={22} /> Bolões Especiais
            </h2>
            <p>Bolões privados em que você foi convidado</p>
          </div>
        </div>

        {lista.length === 0 ? (
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "28px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <Trophy size={32} style={{ opacity: 0.4 }} />
            <p style={{ marginBottom: 0 }}>Você ainda não participa de nenhum bolão especial.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {lista.map((bolao) => {
              const participantes = Object.entries(bolao.participantes || {});
              const minhaResposta = bolao.respostas?.[user.uid];
              const podePalpitar = minhaResposta === "aceito";
              const ranking = calcularRankingBolao(bolao);
              return (
                <div
                  key={bolao.id}
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div>
                      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                        <Trophy size={18} style={{ color: "var(--gold)" }} /> {bolao.nome}
                      </h3>
                      {bolao.descricao ? (
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>{bolao.descricao}</p>
                      ) : null}
                    </div>
                    <span
                      className="badge"
                      style={{
                        background: bolao.status === "encerrado" ? "rgba(255, 215, 0, 0.15)" : "rgba(0, 230, 118, 0.15)",
                        color: bolao.status === "encerrado" ? "var(--gold)" : "var(--primary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {bolao.status === "encerrado" ? "Encerrado" : "Aberto"}
                    </span>
                  </div>

                  {minhaResposta === "aceito" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>
                      <CheckCircle2 size={14} /> Você aceitou o convite
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "var(--surface-raised)",
                        border: "1px solid rgba(255,215,0,0.35)",
                        borderRadius: "10px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <Clock size={16} style={{ color: "var(--gold)" }} />
                      <span style={{ flex: 1, minWidth: "180px", fontSize: "0.85rem" }}>
                        {minhaResposta === "recusado" ? "Você recusou este convite." : "Você foi convidado para participar deste bolão."}
                      </span>
                      <button
                        onClick={() => responder(bolao.id, "aceito")}
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--primary)", color: "#000", border: "none", borderRadius: "8px", padding: "8px 14px", minHeight: "44px", cursor: "pointer", fontWeight: 700 }}
                      >
                        <Check size={14} /> Aceitar
                      </button>
                      {!minhaResposta ? (
                        <button
                          onClick={() => responder(bolao.id, "recusado")}
                          style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", color: "var(--danger)", border: "1px solid rgba(255,107,107,0.4)", borderRadius: "8px", padding: "8px 14px", minHeight: "44px", cursor: "pointer", fontWeight: 700 }}
                        >
                          <X size={14} /> Recusar
                        </button>
                      ) : null}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Wallet size={14} style={{ color: "var(--primary)" }} /> Entrada: R$ {Number(bolao.valorEntrada || 0).toFixed(2)}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={14} style={{ color: "var(--primary)" }} /> {participantes.length} participante(s)
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>Jogos e palpites</strong>
                    {Object.entries(bolao.jogos || {}).map(([jogoId, j]) => {
                      const resultado = (bolao.resultados || {})[jogoId];
                      const travado =
                        !!resultado ||
                        bolao.status === "encerrado" ||
                        (typeof j.lockAt === "number" && agora && j.lockAt <= agora) ||
                        (j.data && agora && new Date(j.data).getTime() <= agora);
                      return (
                        <PalpiteJogoBolao
                          key={jogoId}
                          jogo={j}
                          resultado={resultado}
                          meuPalpite={bolao.palpites?.[user.uid]?.[jogoId]}
                          travado={travado}
                          podePalpitar={podePalpitar}
                          onSalvar={(casa, fora) => salvarPalpite(bolao.id, jogoId, casa, fora)}
                        />
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {participantes.map(([uid, p]) => (
                      <div
                        key={uid}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "var(--input-bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "10px",
                          padding: "8px 10px",
                        }}
                      >
                        <span style={{ flex: 1, fontSize: "0.88rem" }}>{p.nome || uid}</span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            color: p.pago ? "var(--primary)" : "var(--gold)",
                          }}
                        >
                          {p.pago ? <Check size={13} /> : <X size={13} />} {p.pago ? "Pago" : "Não pago"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>Ranking do bolão</strong>
                    {ranking.map((r, i) => (
                      <div
                        key={r.uid}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "0.85rem",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: r.uid === user.uid ? "rgba(0,255,136,0.08)" : "var(--input-bg)",
                        }}
                      >
                        <span style={{ width: "24px", fontWeight: 700, color: i === 0 ? "var(--gold)" : "var(--text-muted)" }}>{i + 1}º</span>
                        <span style={{ flex: 1 }}>{r.nome}</span>
                        <strong style={{ color: "var(--primary)" }}>{r.pontos} pts</strong>
                      </div>
                    ))}
                  </div>

                  {bolao.vencedor?.uid ? (
                    <div
                      style={{
                        background: "rgba(255, 215, 0, 0.15)",
                        border: "1px solid rgba(255,215,0,0.35)",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--gold)",
                        fontWeight: 700,
                      }}
                    >
                      <Crown size={16} /> Vencedor: {bolao.vencedor.nome || bolao.vencedor.uid}
                      {bolao.vencedor.premio != null ? ` — prêmio R$ ${Number(bolao.vencedor.premio).toFixed(2)}` : ""}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
