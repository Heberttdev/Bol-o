import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import Layout from "../components/Layout";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { getEscudo } from "../utils/escudos";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { useNavigate } from "react-router-dom";
import { Target, Lock, Loader2, ArrowRight, History } from "lucide-react";
import { competicaoDaFase, ordenarFases } from "../utils/fases";

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

export default function MeusPalpites() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jogos, setJogos] = useState([]);
  const [palpites, setPalpites] = useState({});
  const [resultados, setResultados] = useState({});
  const [loading, setLoading] = useState(true);
  const [agora, setAgora] = useState(new Date());
  const [competicao, setCompeticao] = useState("Todas");

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
      (snap) => {
        if (snap.exists()) {
          const lista = Object.values(snap.val());
          lista.sort((a, b) => new Date(a.data) - new Date(b.data));
          setJogos(lista);
        } else {
          setJogos([]);
        }
        checarLoading();
      },
      (err) => {
        console.error("Erro ao carregar jogos em MeusPalpites:", err);
        checarLoading();
      }
    );

    const unsubBets = onValue(
      ref(database, `bets/${user.uid}`),
      (snap) => {
        setPalpites(snap.exists() ? snap.val() : {});
        checarLoading();
      },
      (err) => {
        console.error("Erro ao carregar palpites em MeusPalpites:", err);
        checarLoading();
      }
    );

    const unsubResultados = onValue(
      ref(database, "resultados"),
      (snap) => {
        setResultados(snap.exists() ? snap.val() : {});
        checarLoading();
      },
      (err) => {
        console.error("Erro ao carregar resultados em MeusPalpites:", err);
        checarLoading();
      }
    );

    return () => {
      unsubJogos();
      unsubBets();
      unsubResultados();
    };
  }, [user]);

  if (loading) return (
    <Layout><div className="dashboard-container">
      <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Loader2 size={20} /> Carregando seu histórico...
      </h2>
      <div className="games-grid"><div className="skeleton" /><div className="skeleton" /></div>
    </div></Layout>
  );

  const competicoes = [...new Set(jogos.map((j) => competicaoDaFase(j.fase)))];
  const jogosDaCompeticao = competicao === "Todas" ? jogos : jogos.filter((j) => competicaoDaFase(j.fase) === competicao);

  const pendentesAbertos = jogosDaCompeticao.filter((j) => {
    if (palpites[j.id] || obterStatusJogo(j, resultados[j.id], agora) !== "aberto") return false;
    return !j.lockAt || Number(j.lockAt) > agora.getTime();
  });

  const encerrados = jogosDaCompeticao.filter((j) => obterStatusJogo(j, resultados[j.id], agora) !== "aberto");
  const comResultado = encerrados.filter((j) => resultados[j.id]);
  const palpitadosComResultado = comResultado.filter((j) => palpites[j.id]);

  let pontosTotal = 0;
  let exatos = 0;
  let vencedores = 0;
  palpitadosComResultado.forEach((j) => {
    const pts = calcularPontuacao(palpites[j.id], resultados[j.id]);
    pontosTotal += pts;
    if (pts === 10) exatos += 1;
    else if (pts === 5) vencedores += 1;
  });
  const semPalpite = encerrados.filter((j) => !palpites[j.id]).length;
  const taxaAcerto = palpitadosComResultado.length
    ? Math.round(((exatos + vencedores) / palpitadosComResultado.length) * 100)
    : null;

  const porFase = {};
  encerrados.forEach((j) => {
    const fase = j.fase || "Outros";
    if (!porFase[fase]) porFase[fase] = [];
    porFase[fase].push(j);
  });
  const fasesRecentes = ordenarFases(encerrados).reverse();
  if (porFase.Outros && !fasesRecentes.includes("Outros")) fasesRecentes.push("Outros");

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dash-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <History size={22} /> Meu histórico
            </h2>
            <p>Seus palpites, acertos e pontos rodada a rodada</p>
          </div>
        </div>

        {pendentesAbertos.length > 0 && (
          <button className="aviso-urgencia" onClick={() => navigate(`/jogos?jogo=${pendentesAbertos[0].id}`)}>
            <Target size={16} />
            <span>
              {pendentesAbertos.length === 1
                ? "1 jogo aberto ainda sem seu palpite"
                : `${pendentesAbertos.length} jogos abertos ainda sem seu palpite`}
            </span>
            <ArrowRight size={14} />
          </button>
        )}

        {competicoes.length > 1 && (
          <div className="chips" role="tablist" aria-label="Competição" style={{ margin: "14px 0 4px" }}>
            {["Todas", ...competicoes].map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={competicao === c}
                className={`chip ${competicao === c ? "ativo" : ""}`}
                onClick={() => setCompeticao(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="historico-resumo">
          <div className="card glow-green"><h2>{pontosTotal}</h2><p>Pontos</p></div>
          <div className="card glow-gold"><h2>{exatos}</h2><p>Placares exatos</p></div>
          <div className="card glow-blue"><h2>{vencedores}</h2><p>Vencedor certo</p></div>
          <div className="card"><h2>{taxaAcerto == null ? "–" : `${taxaAcerto}%`}</h2><p>Taxa de acerto</p></div>
        </div>
        {semPalpite > 0 && (
          <p className="historico-nota">
            <Lock size={13} /> {semPalpite} jogo{semPalpite > 1 ? "s" : ""} encerrado{semPalpite > 1 ? "s" : ""} sem palpite — não deixe passar!
          </p>
        )}

        {fasesRecentes.length === 0 ? (
          <div className="historico-vazio">
            <Target size={28} style={{ opacity: 0.5 }} />
            <p>Ainda não há jogos encerrados. Seus resultados vão aparecer aqui.</p>
            <button className="btn-bet" style={{ flex: "none" }} onClick={() => navigate("/jogos")}>Fazer palpites</button>
          </div>
        ) : (
          fasesRecentes.map((fase) => {
            const lista = (porFase[fase] || []).sort((a, b) => new Date(a.data) - new Date(b.data));
            const ptsFase = lista.reduce((soma, j) => soma + (palpites[j.id] && resultados[j.id] ? calcularPontuacao(palpites[j.id], resultados[j.id]) : 0), 0);
            return (
              <section key={fase} className="historico-fase">
                <header>
                  <strong>{fase}</strong>
                  <span className="pts-rodada">{ptsFase} pts</span>
                </header>
                {lista.map((j) => {
                  const palpite = palpites[j.id];
                  const resultado = resultados[j.id];
                  const pts = palpite && resultado ? calcularPontuacao(palpite, resultado) : null;
                  return (
                    <div key={j.id} className="historico-linha">
                      <span className="historico-times">
                        <EscudoTime nome={j.casa} size={18} /> {j.casa}
                        <span className="historico-x">x</span>
                        <EscudoTime nome={j.fora} size={18} /> {j.fora}
                      </span>
                      <span className="historico-placar">
                        <small>Palpite</small>
                        {palpite ? `${palpite.casa} x ${palpite.fora}` : "—"}
                      </span>
                      <span className="historico-placar">
                        <small>Resultado</small>
                        {resultado ? `${resultado.casa} x ${resultado.fora}` : "aguardando"}
                      </span>
                      <span className={`resumo-pontos pts-${pts ?? "x"}`}>{pts == null ? "–" : `${pts} pts`}</span>
                    </div>
                  );
                })}
              </section>
            );
          })
        )}
      </div>
    </Layout>
  );
}
