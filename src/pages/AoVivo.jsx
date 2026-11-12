import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { Calendar, CircleDot, Loader2, Radio, RefreshCw, Target, Tv } from "lucide-react";
import Layout from "../components/Layout";
import StreamModal from "../components/StreamModal";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { getEscudo } from "../utils/escudos";
import { useStreams } from "../hooks/useStreams";

const DURACAO_JOGO_MS = 2 * 60 * 60 * 1000;
// Janela antes do início em que já vale buscar transmissão periodicamente.
const JANELA_PRE_JOGO_MS = 30 * 60 * 1000;

// Combina a regra de horário com o status informado pela API de streams.
function obterStatusJogo(jogo, resultado, agora, stream) {
  if (resultado) return "encerrado";
  if (stream?.status === "live") return "em_andamento";
  if (!jogo.data) return "aberto";
  const inicio = new Date(jogo.data);
  const fim = new Date(inicio.getTime() + DURACAO_JOGO_MS);
  if (agora >= fim) return "encerrado";
  if (agora >= inicio) return stream?.status === "finished" ? "encerrado" : "em_andamento";
  return "aberto";
}

function formatarDataHora(data) {
  return new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function EscudoTime({ nome }) {
  const url = getEscudo(nome);
  return url
    ? <img src={url} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
    : <span aria-hidden="true">🏳️</span>;
}

function formatarContagem(data, agora) {
  const diferenca = new Date(data).getTime() - agora.getTime();
  if (diferenca <= 0) return "Começa em instantes";
  const horas = Math.floor(diferenca / (60 * 60 * 1000));
  const minutos = Math.floor((diferenca % (60 * 60 * 1000)) / (60 * 1000));
  return horas ? `Começa em ${horas}h ${minutos}min` : `Começa em ${minutos} min`;
}

function LinhaPalpite({ palpite }) {
  const temPalpite = palpite?.casa !== undefined && palpite?.fora !== undefined;
  return (
    <p className="game-date" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <Target size={14} />
      {temPalpite
        ? <>Seu palpite: <strong style={{ color: "var(--text)" }}>{palpite.casa} x {palpite.fora}</strong></>
        : "Você não deu palpite neste jogo"}
    </p>
  );
}

function AvisoTransmissao({ statusStreams, aoVivo, onRecarregar }) {
  if (statusStreams === "carregando") {
    return (
      <p className="closed-text" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Loader2 size={14} className="spin" /> Buscando transmissão…
      </p>
    );
  }
  if (statusStreams === "erro") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
        <p className="closed-text" style={{ margin: 0 }}>Não foi possível buscar as transmissões.</p>
        <button
          type="button"
          className="btn-bet"
          onClick={onRecarregar}
          style={{ minHeight: "44px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} /> Tentar de novo
        </button>
      </div>
    );
  }
  return (
    <p className="closed-text">
      {aoVivo
        ? "Transmissão ainda não disponível. Atualizamos automaticamente."
        : "Transmissão ainda não disponível."}
    </p>
  );
}

function CartaoJogo({ jogo, stream, palpite, aoVivo, destaque, agora, statusStreams, onRecarregar, onAbrirPlayer }) {
  return (
    <article className={`game-card-bet ${destaque ? "live-feature" : ""}`}>
      <div className="game-top">
        <span className="badge">{jogo.fase}</span>
        {aoVivo ? (
          <span className="badge" style={{ background: "var(--c-info)", color: "var(--c-on-accent)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Radio size={12} /> Ao vivo
          </span>
        ) : (
          <span className="badge green">Agendado</span>
        )}
      </div>

      <div className="game-title">
        <EscudoTime nome={jogo.casa} /> {jogo.casa}
        <span> VS </span>
        <EscudoTime nome={jogo.fora} /> {jogo.fora}
      </div>

      {jogo.data && (
        <p className="game-date" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={14} /> {formatarDataHora(jogo.data)}
        </p>
      )}

      <LinhaPalpite palpite={palpite} />

      {!aoVivo && jogo.data && <p className="countdown">{formatarContagem(jogo.data, agora)}</p>}

      {stream ? (
        <button
          type="button"
          className="btn-bet"
          onClick={() => onAbrirPlayer({ evento: stream, jogo })}
          style={{ width: "100%", minHeight: "44px", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
        >
          <Tv size={15} /> {aoVivo ? "Assistir ao vivo" : "Abrir transmissão"}
        </button>
      ) : (
        <AvisoTransmissao statusStreams={statusStreams} aoVivo={aoVivo} onRecarregar={onRecarregar} />
      )}
    </article>
  );
}

export default function AoVivo() {
  const { user } = useAuth();
  const [jogos, setJogos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [palpites, setPalpites] = useState({});
  const [loading, setLoading] = useState(true);
  const [agora, setAgora] = useState(new Date());
  const [streamAberto, setStreamAberto] = useState(null);

  // Busca periódica só quando algum jogo está em andamento ou começa em até 30 min.
  const haJogoAtivo = jogos.some((jogo) => {
    if (resultados[jogo.id] || !jogo.data) return false;
    const inicio = new Date(jogo.data).getTime();
    const t = agora.getTime();
    return t >= inicio - JANELA_PRE_JOGO_MS && t < inicio + DURACAO_JOGO_MS;
  });
  const { streams, status: statusStreams, recarregar } = useStreams(jogos, { ativo: haJogoAtivo });

  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

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
      (erro) => {
        console.error("Erro ao carregar jogos em AoVivo:", erro);
        checarLoading();
      }
    );

    const unsubResultados = onValue(
      ref(database, "resultados"),
      (snapshot) => {
        setResultados(snapshot.exists() ? snapshot.val() : {});
        checarLoading();
      },
      (erro) => {
        console.error("Erro ao carregar resultados em AoVivo:", erro);
        checarLoading();
      }
    );

    const unsubPalpites = onValue(
      ref(database, `bets/${user.uid}`),
      (snapshot) => {
        setPalpites(snapshot.exists() ? snapshot.val() : {});
        checarLoading();
      },
      (erro) => {
        console.error("Erro ao carregar palpites em AoVivo:", erro);
        checarLoading();
      }
    );

    return () => {
      unsubJogos();
      unsubResultados();
      unsubPalpites();
    };
  }, [user]);

  if (loading) {
    return (
      <Layout><div className="dashboard-container">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Loader2 size={20} /> Carregando transmissões...</h2>
        <div className="games-grid"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
      </div></Layout>
    );
  }

  const statusDe = (jogo) => obterStatusJogo(jogo, resultados[jogo.id], agora, streams[jogo.id]);
  const jogosAoVivo = jogos.filter((jogo) => statusDe(jogo) === "em_andamento");
  const agenda = jogos.filter((jogo) => statusDe(jogo) === "aberto").slice(0, 12);

  const propsComuns = (jogo) => ({
    jogo,
    stream: streams[jogo.id],
    palpite: palpites[jogo.id],
    agora,
    statusStreams,
    onRecarregar: recarregar,
    onAbrirPlayer: setStreamAberto,
  });

  return (
    <Layout>
      <div className="dashboard-container">
        {streamAberto && (
          <StreamModal
            evento={streamAberto.evento}
            jogo={streamAberto.jogo}
            onFechar={() => setStreamAberto(null)}
          />
        )}

        <div className="dash-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><CircleDot size={22} /> Ao vivo</h2>
            <p>Transmissões e próximos jogos do Brasileirão</p>
          </div>
        </div>

        <section>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Radio size={18} color="var(--c-info)" /> Jogos ao vivo</h3>
          {jogosAoVivo.length ? (
            <div className="games-grid">
              {jogosAoVivo.map((jogo, index) => (
                <CartaoJogo key={jogo.id} {...propsComuns(jogo)} aoVivo destaque={index === 0} />
              ))}
            </div>
          ) : <p className="closed-text">Nenhum jogo em andamento agora.</p>}
        </section>

        <section style={{ marginTop: "28px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={18} color="currentColor" style={{ color: "var(--c-action)" }} /> Próximos jogos</h3>
          {agenda.length ? (
            <div className="games-grid">
              {agenda.map((jogo) => <CartaoJogo key={jogo.id} {...propsComuns(jogo)} />)}
            </div>
          ) : <p className="closed-text">Não há jogos agendados.</p>}
        </section>
      </div>
    </Layout>
  );
}
