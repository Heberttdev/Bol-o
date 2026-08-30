import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { Calendar, CircleDot, Loader2, Radio, Tv } from "lucide-react";
import Layout from "../components/Layout";
import StreamModal from "../components/StreamModal";
import { database } from "../services/firebase";
import { getEscudo } from "../utils/escudos";
import { useStreams } from "../hooks/useStreams";

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

function EscudoTime({ nome }) {
  const url = getEscudo(nome);
  return url
    ? <img src={url} alt={nome} style={{ width: 26, height: 26, objectFit: "contain" }} />
    : <span>🏳️</span>;
}

function formatarContagem(data) {
  const diferenca = new Date(data).getTime() - Date.now();
  if (diferenca <= 0) return "Começa em instantes";
  const horas = Math.floor(diferenca / (60 * 60 * 1000));
  const minutos = Math.floor((diferenca % (60 * 60 * 1000)) / (60 * 1000));
  return horas ? `Começa em ${horas}h ${minutos}min` : `Começa em ${minutos} min`;
}

function CartaoJogo({ jogo, stream, aoVivo, destaque, onAbrirPlayer }) {
  return (
    <article className={`game-card-bet ${destaque ? "live-feature" : ""}`}>
      <div className="game-top">
        <span className="badge">{jogo.fase}</span>
        {aoVivo ? (
          <span className="badge" style={{ background: "#00bfff", color: "#000", display: "flex", alignItems: "center", gap: "4px" }}>
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
          <Calendar size={14} /> {new Date(jogo.data).toLocaleString("pt-BR")}
        </p>
      )}

      {!aoVivo && jogo.data && <p className="countdown">{formatarContagem(jogo.data)}</p>}

      {stream ? (
        <button
          className="btn-bet"
          onClick={() => onAbrirPlayer({ evento: stream, jogo })}
          style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
        >
          <Tv size={15} /> {aoVivo ? "Assistir ao vivo" : "Abrir transmissão"}
        </button>
      ) : (
        <p className="closed-text">Transmissão ainda não disponível.</p>
      )}
    </article>
  );
}

export default function AoVivo() {
  const [jogos, setJogos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [loading, setLoading] = useState(true);
  const [agora, setAgora] = useState(new Date());
  const [streamAberto, setStreamAberto] = useState(null);
  const { streams } = useStreams(jogos);

  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let carregados = 0;
    const checarLoading = () => {
      carregados++;
      if (carregados >= 2) setLoading(false);
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

    return () => {
      unsubJogos();
      unsubResultados();
    };
  }, []);

  if (loading) {
    return (
      <Layout><div className="dashboard-container">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Loader2 size={20} /> Carregando transmissões...</h2>
        <div className="games-grid"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
      </div></Layout>
    );
  }

  const jogosAoVivo = jogos.filter(jogo => obterStatusJogo(jogo, resultados[jogo.id], agora) === "em_andamento");
  const agenda = jogos.filter(jogo => obterStatusJogo(jogo, resultados[jogo.id], agora) === "aberto").slice(0, 12);

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
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Radio size={18} color="#00bfff" /> Jogos ao vivo</h3>
          {jogosAoVivo.length ? (
            <div className="games-grid">
              {jogosAoVivo.map((jogo, index) => <CartaoJogo key={jogo.id} jogo={jogo} stream={streams[jogo.id]} aoVivo destaque={index === 0} onAbrirPlayer={setStreamAberto} />)}
            </div>
          ) : <p className="closed-text">Nenhum jogo em andamento agora.</p>}
        </section>

        <section style={{ marginTop: "28px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={18} color="#00ff88" /> Próximos jogos</h3>
          {agenda.length ? (
            <div className="games-grid">
              {agenda.map(jogo => <CartaoJogo key={jogo.id} jogo={jogo} stream={streams[jogo.id]} onAbrirPlayer={setStreamAberto} />)}
            </div>
          ) : <p className="closed-text">Não há jogos agendados.</p>}
        </section>
      </div>
    </Layout>
  );
}
