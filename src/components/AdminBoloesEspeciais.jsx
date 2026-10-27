import { useEffect, useState } from "react";
import { ref, onValue, set, update, remove, push } from "firebase/database";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { getEscudo, escudos } from "../utils/escudos";
import { escudosChampions } from "../utils/escudosChampions";
import { calcularRankingBolao } from "../utils/rankingBolaoEspecial";
import { sanitizarPlacar, sanitizarValor } from "../utils/sanitizarNumeros";
import {
  Trophy,
  Plus,
  Trash2,
  Users,
  Wallet,
  Check,
  X,
  Crown,
  Sparkles,
  RotateCcw,
  Clock,
  CheckCircle2,
  Search,
} from "lucide-react";

const NOMES_TIMES = [...new Set([...Object.keys(escudos), ...Object.keys(escudosChampions)])].sort();

function EscudoTime({ nome, size = 22 }) {
  const url = getEscudo(nome);
  return url ? (
    <img src={url} alt={nome} style={{ width: size, height: size, objectFit: "contain", verticalAlign: "middle" }} />
  ) : (
    <span style={{ fontSize: size * 0.7 }}>🏳️</span>
  );
}

function valorEfetivo(participante, valorEntrada) {
  const v = Number(participante?.valorPago);
  return Number.isFinite(v) && v > 0 ? v : Number(valorEntrada) || 0;
}

function ResultadoJogoBolao({ bolaoId, jogoId, jogo, resultado, palpitesCount, onSalvar }) {
  const [casa, setCasa] = useState(resultado?.casa !== undefined ? String(resultado.casa) : "");
  const [fora, setFora] = useState(resultado?.fora !== undefined ? String(resultado.fora) : "");
  const [salvando, setSalvando] = useState(false);
  const temResultado = resultado?.casa !== undefined && resultado?.fora !== undefined;

  const salvar = async () => {
    if (casa === "" || fora === "") return;
    setSalvando(true);
    try {
      await onSalvar(bolaoId, jogoId, Number(casa), Number(fora));
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
      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{palpitesCount} palpite(s)</span>
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
        disabled={salvando}
        style={{ display: "flex", alignItems: "center", gap: "6px", background: temResultado ? "var(--surface-raised)" : "var(--primary)", color: temResultado ? "var(--text)" : "#000", border: "none", borderRadius: "8px", padding: "6px 12px", minHeight: "44px", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}
      >
        {temResultado ? <CheckCircle2 size={14} /> : null} {salvando ? "Salvando..." : temResultado ? "Atualizar" : "Salvar"}
      </button>
    </div>
  );
}

function CardAdminBolao({ bolao, onTogglePago, onSalvarValorPago, onDefinirVencedor, onReabrir, onRemover, onSalvarResultado }) {
  const [vencUid, setVencUid] = useState(bolao.vencedor?.uid || "");
  const [premio, setPremio] = useState(bolao.vencedor?.premio != null ? String(bolao.vencedor.premio) : "");
  const participantes = Object.entries(bolao.participantes || {});
  const totalArrecadado = participantes.reduce(
    (soma, [, p]) => soma + (p.pago ? valorEfetivo(p, bolao.valorEntrada) : 0),
    0
  );
  const ranking = calcularRankingBolao(bolao);
  const sugeridoUid = ranking[0]?.pontos > 0 ? ranking[0].uid : "";
  const vencedorSelecionado = vencUid || sugeridoUid;

  return (
    <div
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, flexWrap: "wrap" }}>
            <Trophy size={18} style={{ color: "var(--gold)" }} /> {bolao.nome}
          </h3>
          {bolao.descricao ? <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>{bolao.descricao}</p> : null}
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

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Wallet size={14} style={{ color: "var(--primary)" }} /> Entrada: R$ {Number(bolao.valorEntrada || 0).toFixed(2)}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={14} style={{ color: "var(--primary)" }} /> {participantes.length} participante(s)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Check size={14} style={{ color: "var(--primary)" }} /> Recebido: R$ {totalArrecadado.toFixed(2)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>Jogos, palpites e resultados</strong>
        {Object.entries(bolao.jogos || {}).map(([jogoId, j]) => {
          const res = (bolao.resultados || {})[jogoId];
          const palpitesCount = participantes.filter(([uid]) => bolao.palpites?.[uid]?.[jogoId]).length;
          return (
            <ResultadoJogoBolao
              key={`${jogoId}-${res?.casa ?? ""}-${res?.fora ?? ""}`}
              bolaoId={bolao.id}
              jogoId={jogoId}
              jogo={j}
              resultado={res}
              palpitesCount={palpitesCount}
              onSalvar={onSalvarResultado}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {participantes.map(([uid, p]) => (
          <div
            key={uid}
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "8px 10px",
            }}
          >
            <button
              onClick={() => onTogglePago(bolao.id, uid, !!p.pago)}
              title={p.pago ? "Marcar como pendente" : "Marcar como pago"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                border: "none",
                borderRadius: "8px",
                padding: "4px 10px",
                minHeight: "44px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.78rem",
                background: p.pago ? "rgba(0, 230, 118, 0.15)" : "rgba(255, 215, 0, 0.15)",
                color: p.pago ? "var(--primary)" : "var(--gold)",
              }}
            >
              {p.pago ? <Check size={14} /> : <X size={14} />} {p.pago ? "Pago" : "Não pago"}
            </button>
            <span style={{ flex: "1 1 140px", minWidth: 0, fontSize: "0.88rem", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              {p.nome || uid}
              {bolao.respostas?.[uid] === "aceito" ? (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "var(--primary)" }}>
                  <CheckCircle2 size={13} /> Aceitou
                </span>
              ) : bolao.respostas?.[uid] === "recusado" ? (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "var(--danger)" }}>
                  <X size={13} /> Recusou
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "var(--gold)" }}>
                  <Clock size={13} /> Aguardando
                </span>
              )}
            </span>
            <input
              type="text"
              min="0"
              inputMode="numeric"
              pattern="[0-9]*"
              defaultValue={p.valorPago || ""}
              placeholder={`${Number(bolao.valorEntrada || 0)}`}
              onInput={(e) => {
                e.currentTarget.value = sanitizarValor(e.currentTarget.value);
              }}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v >= 0 && v !== Number(p.valorPago || 0)) onSalvarValorPago(bolao.id, uid, v);
              }}
              style={{ width: "90px", minHeight: "44px", padding: "5px 8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "0.85rem" }}
            />
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
              background: bolao.vencedor?.uid === r.uid ? "rgba(255,215,0,0.12)" : "var(--input-bg)",
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

      {bolao.status === "encerrado" ? (
        <button
          onClick={() => onReabrir(bolao.id)}
          style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px", background: "var(--surface-raised)", color: "var(--text)", border: "none", borderRadius: "8px", padding: "8px 14px", minHeight: "44px", cursor: "pointer", fontWeight: 700 }}
        >
          <RotateCcw size={14} /> Reabrir bolão
        </button>
      ) : (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={vencedorSelecionado}
            onChange={(e) => setVencUid(e.target.value)}
            className="filter-select"
            style={{ flex: 1, minWidth: "160px" }}
          >
            <option value="">Definir vencedor...</option>
            {participantes.map(([uid, p]) => (
              <option key={uid} value={uid}>
                {p.nome || uid}
              </option>
            ))}
          </select>
          <input
            type="text"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            value={premio}
            onChange={(e) => setPremio(sanitizarValor(e.target.value))}
            placeholder="Prêmio R$"
            style={{ width: "120px", minHeight: "44px", padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }}
          />
          <button
            onClick={() => onDefinirVencedor(bolao.id, vencedorSelecionado, premio)}
            disabled={!vencedorSelecionado}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--primary)", color: "#000", border: "none", borderRadius: "8px", padding: "8px 14px", minHeight: "44px", cursor: vencedorSelecionado ? "pointer" : "not-allowed", fontWeight: 700, opacity: vencedorSelecionado ? 1 : 0.5 }}
          >
            <Crown size={14} /> Encerrar
          </button>
        </div>
      )}

      <button
        onClick={() => onRemover(bolao.id)}
        style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px", background: "transparent", color: "var(--danger)", border: "1px solid rgba(255,107,107,0.4)", borderRadius: "8px", padding: "6px 12px", minHeight: "44px", cursor: "pointer", fontSize: "0.82rem" }}
      >
        <Trash2 size={14} /> Remover bolão
      </button>
    </div>
  );
}

export default function AdminBoloesEspeciais({ exibirToast }) {
  const { user } = useAuth();
  const { enviarNotificacao } = useNotifications();
  const [usuarios, setUsuarios] = useState([]);
  const [jogos, setJogos] = useState([]);
  const [boloes, setBoloes] = useState({});

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [jogosSel, setJogosSel] = useState([]);
  const [jogoSelId, setJogoSelId] = useState("");
  const [customCasa, setCustomCasa] = useState("");
  const [customFora, setCustomFora] = useState("");
  const [customData, setCustomData] = useState("");
  const [customHora, setCustomHora] = useState("");
  const [participantesSel, setParticipantesSel] = useState([]);
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [salvando, setSalvando] = useState(false);

  const termoUsuario = buscaUsuario.trim().toLowerCase();
  const usuariosFiltrados = termoUsuario
    ? usuarios.filter(
        (u) =>
          (u.nome || "").toLowerCase().includes(termoUsuario) ||
          (u.email || "").toLowerCase().includes(termoUsuario)
      )
    : usuarios;

  useEffect(() => {
    const unsubU = onValue(ref(database, "users"), (s) => {
      if (!s.exists()) {
        setUsuarios([]);
        return;
      }
      const lista = Object.entries(s.val()).map(([uid, u]) => ({ uid, ...u }));
      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      setUsuarios(lista);
    });
    const unsubJ = onValue(ref(database, "jogos"), (s) => {
      if (!s.exists()) {
        setJogos([]);
        return;
      }
      const agora = Date.now();
      const lista = Object.values(s.val())
        .filter((j) => {
          const t = j.lockAt || new Date(j.data).getTime();
          return Number.isFinite(t) && t > agora;
        })
        .sort((a, b) => new Date(a.data) - new Date(b.data));
      setJogos(lista);
    });
    const unsubB = onValue(ref(database, "boloesEspeciais"), (s) => {
      setBoloes(s.exists() ? s.val() : {});
    });
    return () => {
      unsubU();
      unsubJ();
      unsubB();
    };
  }, []);

  function adicionarJogoExistente() {
    const j = jogos.find((x) => x.id === jogoSelId);
    if (!j) {
      exibirToast("Selecione um jogo da lista.", "error");
      return;
    }
    if (jogosSel.some((x) => x.id === j.id)) {
      exibirToast("Esse jogo já foi adicionado.", "error");
      return;
    }
    setJogosSel([...jogosSel, { id: j.id, casa: j.casa, fora: j.fora, data: j.data || "", fase: j.fase || "", lockAt: j.lockAt, custom: false }]);
    setJogoSelId("");
  }

  function adicionarJogoCustom() {
    if (!customCasa.trim() || !customFora.trim()) {
      exibirToast("Informe os dois times do jogo personalizado.", "error");
      return;
    }
    let data = "";
    let lockAt;
    if (customData) {
      data = `${customData}T${customHora || "00:00"}:00-03:00`;
      lockAt = new Date(data).getTime();
      if (!Number.isFinite(lockAt)) {
        exibirToast("Data ou hora inválida.", "error");
        return;
      }
      if (lockAt <= Date.now()) {
        exibirToast("A data do jogo precisa estar no futuro.", "error");
        return;
      }
    }
    const id = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setJogosSel([...jogosSel, { id, casa: customCasa.trim(), fora: customFora.trim(), data, lockAt, custom: true }]);
    setCustomCasa("");
    setCustomFora("");
    setCustomData("");
    setCustomHora("");
  }

  function toggleParticipante(uid) {
    setParticipantesSel((prev) => (prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]));
  }

  async function criarBolao(e) {
    e.preventDefault();
    if (salvando) return;
    if (!nome.trim()) return exibirToast("Informe o nome do bolão.", "error");
    const v = Number(valor);
    if (!Number.isFinite(v) || v < 0) return exibirToast("Valor de entrada inválido.", "error");
    if (jogosSel.length === 0) return exibirToast("Adicione pelo menos um jogo.", "error");
    if (participantesSel.length === 0) return exibirToast("Selecione pelo menos um participante.", "error");

    setSalvando(true);
    try {
      const novo = push(ref(database, "boloesEspeciais"));
      const id = novo.key;
      const jogosMap = {};
      jogosSel.forEach((j) => {
        jogosMap[j.id] = {
          casa: j.casa,
          fora: j.fora,
          data: j.data || "",
          fase: j.fase || "",
          custom: !!j.custom,
          ...(typeof j.lockAt === "number" ? { lockAt: j.lockAt } : {}),
        };
      });
      const participantes = {};
      participantesSel.forEach((uid) => {
        const u = usuarios.find((x) => x.uid === uid);
        participantes[uid] = { nome: u?.nome || "", pago: false, valorPago: 0, entrouEm: Date.now() };
      });

      await set(novo, {
        id,
        nome: nome.trim(),
        descricao: descricao.trim(),
        valorEntrada: v,
        status: "aberto",
        criadoEm: Date.now(),
        criadoPor: user.uid,
        jogos: jogosMap,
        participantes,
      });

      await Promise.all(
        participantesSel.map(async (uid) => {
          await set(ref(database, `participantesBolao/${uid}/${id}`), true);
          await enviarNotificacao({
            titulo: "🎟️ Convite para bolão especial",
            corpo: `Você foi convidado para "${nome.trim()}" (entrada R$ ${v.toFixed(2)}). Abra para aceitar ou recusar.`,
            tipo: "convite",
            link: "/boloes-especiais",
            para: uid,
          }).catch(() => {});
        })
      );

      exibirToast("✅ Bolão especial criado!", "success");
      setNome("");
      setDescricao("");
      setValor("");
      setJogosSel([]);
      setParticipantesSel([]);
    } catch (err) {
      console.error(err);
      exibirToast("Erro ao criar bolão: " + err.message, "error");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarResultadoBolao(id, jogoId, casa, fora) {
    try {
      await set(ref(database, `boloesEspeciais/${id}/resultados/${jogoId}`), { casa, fora });
      exibirToast("Resultado salvo.", "success");
    } catch (err) {
      console.error(err);
      exibirToast("Erro ao salvar resultado: " + err.message, "error");
    }
  }

  async function togglePago(id, uid, atual) {
    try {
      await update(ref(database, `boloesEspeciais/${id}/participantes/${uid}`), { pago: !atual });
    } catch (err) {
      console.error(err);
      exibirToast("Erro ao atualizar pagamento: " + err.message, "error");
    }
  }

  async function salvarValorPago(id, uid, v) {
    try {
      await update(ref(database, `boloesEspeciais/${id}/participantes/${uid}`), { valorPago: v });
    } catch (err) {
      console.error(err);
      exibirToast("Erro ao salvar valor: " + err.message, "error");
    }
  }

  async function definirVencedor(id, uid, premioStr) {
    try {
      const b = boloes[id];
      const p = b?.participantes?.[uid];
      const premio = Number(premioStr);
      await update(ref(database, `boloesEspeciais/${id}`), {
        status: "encerrado",
        vencedor: {
          uid,
          nome: p?.nome || uid,
          premio: Number.isFinite(premio) && premio >= 0 ? premio : null,
          definidoEm: Date.now(),
        },
      });
      exibirToast("🏆 Vencedor definido e bolão encerrado.", "success");
    } catch (err) {
      console.error(err);
      exibirToast("Erro ao definir vencedor: " + err.message, "error");
    }
  }

  async function reabrir(id) {
    try {
      await update(ref(database, `boloesEspeciais/${id}`), { status: "aberto", vencedor: null });
      exibirToast("Bolão reaberto.", "success");
    } catch (err) {
      console.error(err);
      exibirToast("Erro ao reabrir: " + err.message, "error");
    }
  }

  async function removerBolao(id) {
    if (!window.confirm("Remover este bolão especial? Isso apaga o registro para todos.")) return;
    try {
      const uids = Object.keys(boloes[id]?.participantes || {});
      await Promise.all(uids.map((uid) => remove(ref(database, `participantesBolao/${uid}/${id}`))));
      await remove(ref(database, `boloesEspeciais/${id}`));
      exibirToast("Bolão removido.", "success");
    } catch (err) {
      console.error(err);
      exibirToast("Erro ao remover: " + err.message, "error");
    }
  }

  const listaBoloes = Object.values(boloes).sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <form
        onSubmit={criarBolao}
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <Plus size={18} /> Criar bolão especial
        </h3>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do bolão (ex: Bolão dos amigos)"
            style={{ flex: 2, minWidth: "200px", padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }}
          />
          <input
            value={valor}
            onChange={(e) => setValor(sanitizarValor(e.target.value))}
            type="text"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Valor da entrada (R$)"
            style={{ flex: 1, minWidth: "140px", padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }}
          />
        </div>

        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição (opcional)"
          style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <strong style={{ fontSize: "0.9rem", color: "var(--text)" }}>Jogos do bolão</strong>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select value={jogoSelId} onChange={(e) => setJogoSelId(e.target.value)} className="filter-select" style={{ flex: 1, minWidth: "220px" }}>
              <option value="">Adicionar jogo da lista...</option>
              {jogos.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.casa} x {j.fora} {j.fase ? `— ${j.fase}` : ""}
                </option>
              ))}
            </select>
            <button type="button" onClick={adicionarJogoExistente} style={{ background: "var(--surface-raised)", color: "var(--text)", border: "none", borderRadius: "10px", padding: "10px 16px", minHeight: "44px", cursor: "pointer", fontWeight: 700 }}>
              Adicionar
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
              <Sparkles size={14} /> Jogo personalizado:
            </span>
            <input
              value={customCasa}
              onChange={(e) => setCustomCasa(e.target.value)}
              list="times-disponiveis"
              placeholder="Time da casa"
              style={{ flex: 1, minWidth: "130px", padding: "9px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }}
            />
            <input
              value={customFora}
              onChange={(e) => setCustomFora(e.target.value)}
              list="times-disponiveis"
              placeholder="Time visitante"
              style={{ flex: 1, minWidth: "130px", padding: "9px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }}
            />
            <input
              type="date"
              value={customData}
              onChange={(e) => setCustomData(e.target.value)}
              aria-label="Data do jogo (opcional)"
              title="Data do jogo — palpites fecham no início"
              style={{ minWidth: "140px", minHeight: "44px", padding: "9px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }}
            />
            <input
              type="time"
              value={customHora}
              onChange={(e) => setCustomHora(e.target.value)}
              aria-label="Hora do jogo (opcional)"
              disabled={!customData}
              style={{ minWidth: "110px", minHeight: "44px", padding: "9px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }}
            />
            <button type="button" onClick={adicionarJogoCustom} style={{ background: "var(--surface-raised)", color: "var(--text)", border: "none", borderRadius: "10px", padding: "10px 16px", minHeight: "44px", cursor: "pointer", fontWeight: 700 }}>
              Adicionar
            </button>
            <datalist id="times-disponiveis">
              {NOMES_TIMES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {customCasa || customFora ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text)", fontSize: "0.85rem" }}>
              Prévia: <EscudoTime nome={customCasa} size={18} /> {customCasa || "?"} <span style={{ color: "var(--text-muted)" }}>x</span>{" "}
              <EscudoTime nome={customFora} size={18} /> {customFora || "?"}
            </div>
          ) : null}

          {jogosSel.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {jogosSel.map((j) => (
                <span
                  key={j.id}
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <EscudoTime nome={j.casa} size={18} /> {j.casa} <span style={{ color: "var(--text-muted)" }}>x</span> <EscudoTime nome={j.fora} size={18} /> {j.fora}
                  <button type="button" onClick={() => setJogosSel(jogosSel.filter((x) => x.id !== j.id))} style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", flexShrink: 0 }}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <strong style={{ fontSize: "0.9rem", color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={16} /> Convidar participantes ({participantesSel.length} selecionado(s))
          </strong>
          {usuarios.length > 8 && (
            <div className="search-field" style={{ margin: 0 }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={buscaUsuario}
                onChange={(e) => setBuscaUsuario(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                aria-label="Buscar usuário para convidar"
              />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px", maxHeight: "260px", overflowY: "auto" }}>
            {usuariosFiltrados.map((u) => {
              const sel = participantesSel.includes(u.uid);
              return (
                <button
                  type="button"
                  key={u.uid}
                  onClick={() => toggleParticipante(u.uid)}
                  style={{
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    border: sel ? "1px solid var(--c-action)" : "1px solid var(--border)",
                    background: sel ? "rgba(0, 230, 118, 0.15)" : "var(--input-bg)",
                    color: "var(--text)",
                  }}
                >
                  {sel ? <Check size={14} style={{ color: "var(--primary)" }} /> : <span style={{ width: "14px" }} />}
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{u.nome || u.uid}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{u.email || ""}</span>
                  </span>
                </button>
              );
            })}
            {usuariosFiltrados.length === 0 && (
              <p className="list-empty" style={{ gridColumn: "1 / -1" }}>Nenhum usuário encontrado.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={salvando}
          style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", background: "var(--primary)", color: "#000", border: "none", borderRadius: "10px", padding: "12px 22px", cursor: salvando ? "not-allowed" : "pointer", fontWeight: 800, opacity: salvando ? 0.6 : 1 }}
        >
          <Trophy size={16} /> {salvando ? "Criando..." : "Criar bolão especial"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <Trophy size={18} /> Bolões criados ({listaBoloes.length})
        </h3>
        {listaBoloes.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Nenhum bolão especial criado ainda.</p>
        ) : (
          listaBoloes.map((b) => (
            <CardAdminBolao
              key={`${b.id}-${b.status}-${b.vencedor?.uid || "nv"}`}
              bolao={b}
              onTogglePago={togglePago}
              onSalvarValorPago={salvarValorPago}
              onDefinirVencedor={definirVencedor}
              onReabrir={reabrir}
              onRemover={removerBolao}
              onSalvarResultado={salvarResultadoBolao}
            />
          ))
        )}
      </div>
    </div>
  );
}
