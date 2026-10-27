import { useAuth } from "../context/AuthContext";
import { useReady } from "../context/ReadyContext";
import Layout from "../components/Layout";
import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../services/firebase";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { getEscudo } from "../utils/escudos";
import { montarEvolucao } from "../utils/evolucao";
import { formatarDataJogo, horaJogo, ehHoje } from "../utils/formatarData";
import { Trophy, Medal, Ticket, ChevronRight, Check } from "lucide-react";
import Loading from "../components/Loading";
import StatusChip from "../components/StatusChip";
import Skeleton from "../components/Skeleton";

function EscudoTime({ nome, size = 22 }) {
  const url = getEscudo(nome);
  return url
    ? <img src={url} alt="" width={size} height={size} style={{ objectFit: "contain", verticalAlign: "middle" }} />
    : <span style={{ fontSize: size * 0.7 }} aria-hidden="true">🏳️</span>;
}

function statusDoJogo(jogo, bet, res, agora) {
  if (bet) return { tipo: "salvo", texto: `Salvo ${bet.casa} × ${bet.fora}` };
  const lock = Number(jogo.lockAt) || new Date(jogo.data).getTime();
  const comecou = new Date(jogo.data).getTime() <= agora;
  if (res) return { tipo: "fechado", texto: "Fechado" };
  if (comecou) return { tipo: "aovivo", texto: "Ao vivo" };
  if (lock <= agora) return { tipo: "fechado", texto: "Fechado" };
  return { tipo: "pendente", texto: "Pendente" };
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { marcarComoPronto } = useReady();
  const navigate = useNavigate();

  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [pontuacao, setPontuacao] = useState(0);
  const [totalPalpites, setTotalPalpites] = useState(0);
  const [posicao, setPosicao] = useState("-");
  const [topRanking, setTopRanking] = useState([]);
  const [userRow, setUserRow] = useState(null);
  const [meta, setMeta] = useState(null);
  const [jogosHoje, setJogosHoje] = useState([]);
  const [proximos, setProximos] = useState([]);
  const [pendentesCount, setPendentesCount] = useState(0);
  const [proximoPalpite, setProximoPalpite] = useState(null);
  const [infoEvolucao, setInfoEvolucao] = useState(null);
  const [convitesPendentes, setConvitesPendentes] = useState(0);
  const [carregando, setCarregando] = useState(true);

  const snapshotData = useRef({ users: {}, bets: {}, resultados: {}, jogos: {} });

  useEffect(() => {
    if (!user) return;

    let initialCount = 0;
    const processarDashboard = () => {
      const { users, bets, resultados, jogos: jogosObj } = snapshotData.current;
      const jogosList = Object.entries(jogosObj || {}).map(([id, j]) => ({ id, ...j }));
      const agora = Date.now();

      const betsDoUsuario = bets[user.uid] || {};

      const comData = jogosList.filter((j) => j?.data && !Number.isNaN(new Date(j.data).getTime()));
      const futuros = comData
        .filter((j) => new Date(j.data).getTime() >= agora)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

      // Jogos de hoje (qualquer horário) com status do palpite.
      const hoje = comData
        .filter((j) => ehHoje(j.data))
        .sort((a, b) => new Date(a.data) - new Date(b.data))
        .map((j) => ({ ...j, status: statusDoJogo(j, betsDoUsuario[j.id], resultados[j.id], agora) }));
      setJogosHoje(hoje);

      setProximos(
        futuros.slice(0, 3).map((j) => ({
          ...j,
          status: statusDoJogo(j, betsDoUsuario[j.id], resultados[j.id], agora),
        }))
      );

      setProximoPalpite(futuros.find((jogo) => !betsDoUsuario[jogo.id]) || null);
      setPendentesCount(
        futuros.filter((j) => {
          const lock = Number(j.lockAt) || new Date(j.data).getTime();
          return !betsDoUsuario[j.id] && !resultados[j.id] && lock > agora;
        }).length
      );

      // Ranking completo (mesma regra de pontuação — não alterada).
      const listaRanking = [];
      Object.keys(users).forEach((uid) => {
        let pontos = 0;
        let exatos = 0;
        const betsUsuario = bets[uid] || {};
        Object.keys(betsUsuario).forEach((jogoId) => {
          const pts = calcularPontuacao(betsUsuario[jogoId], resultados[jogoId]);
          pontos += pts;
          if (pts >= 10) exatos += 1;
        });
        listaRanking.push({ uid, nome: users[uid]?.nome || "Jogador", pontos, exatos });
        if (uid === user.uid) {
          setDadosUsuario(users[uid]);
          setPontuacao(pontos);
          setTotalPalpites(Object.keys(betsUsuario).length);
        }
      });

      listaRanking.sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos || a.nome.localeCompare(b.nome));
      setTopRanking(listaRanking.slice(0, 3));

      const indice = listaRanking.findIndex((item) => item.uid === user.uid);
      const pos = indice >= 0 ? indice + 1 : null;
      setPosicao(pos || "-");

      const eu = indice >= 0 ? listaRanking[indice] : null;
      setUserRow(eu ? { ...eu, pos } : null);

      // Meta: distância para a próxima posição relevante.
      const meusPontos = eu ? eu.pontos : 0;
      if (listaRanking.length <= 1) {
        setMeta({ tipo: "sozinho" });
      } else if (pos === 1) {
        setMeta({ tipo: "lidera", valor: meusPontos - (listaRanking[1]?.pontos || 0) });
      } else if (pos && pos <= 3) {
        setMeta({ tipo: "podio", n: pos });
      } else {
        const terceiro = listaRanking[2]?.pontos || 0;
        setMeta({ tipo: "rumo", valor: Math.max(terceiro - meusPontos, 0) });
      }

      setInfoEvolucao(
        montarEvolucao({ users, bets, resultados, jogos: jogosList, uid: user.uid })
      );

      initialCount++;
      if (initialCount >= 4) {
        setCarregando(false);
        marcarComoPronto();
      }
    };

    const refs = ["perfisPublicos", "bets", "resultados", "jogos"];
    const chaves = ["users", "bets", "resultados", "jogos"];
    const unsubs = refs.map((caminho, i) =>
      onValue(
        ref(database, caminho),
        (snap) => {
          snapshotData.current[chaves[i]] = snap.val() || {};
          processarDashboard();
        },
        (err) => console.error(`Erro ao carregar ${caminho} no dashboard:`, err)
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [user, marcarComoPronto]);

  useEffect(() => {
    if (!user) return;
    let unsubs = [];
    const unsubIndex = onValue(ref(database, `participantesBolao/${user.uid}`), (snap) => {
      unsubs.forEach((u) => u());
      unsubs = [];
      const ids = snap.exists() ? Object.keys(snap.val()) : [];
      if (ids.length === 0) {
        setConvitesPendentes(0);
        return;
      }
      const estado = {};
      ids.forEach((id) => {
        const unsub = onValue(ref(database, `boloesEspeciais/${id}`), (s) => {
          const b = s.val();
          estado[id] = b && b.status !== "encerrado" && !(b.respostas && b.respostas[user.uid]) ? 1 : 0;
          setConvitesPendentes(Object.values(estado).reduce((a, c) => a + c, 0));
        });
        unsubs.push(unsub);
      });
    });
    return () => {
      unsubIndex();
      unsubs.forEach((u) => u());
    };
  }, [user]);

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" />;

  const corMedalha = (i) => (i === 0 ? "var(--c-gold)" : i === 1 ? "#C0C0C0" : "#CD7F32");
  const nome = dadosUsuario?.nome?.split(" ")[0] || user.displayName?.split(" ")[0] || "Jogador";
  const usuarioNoTop3 = topRanking.some((r) => r.uid === user.uid);

  const listaExibida = jogosHoje.length > 0 ? jogosHoje : proximos;
  const tituloLista = jogosHoje.length > 0 ? "Hoje" : "A seguir";
  const palpitadosHoje = jogosHoje.filter((j) => j.status.tipo === "salvo").length;

  const faseAnterior = infoEvolucao?.faseAnterior;
  const ptsAnterior = faseAnterior
    ? infoEvolucao?.evolucao?.find((e) => e.fase === faseAnterior)?.pontos ?? 0
    : null;

  const irParaJogo = (id) => navigate(`/jogos?jogo=${id}`);

  return (
    <Layout>
      <div className="dashboard-container">

        {/* 1. Saudação + meta */}
        <header className="dash-saudacao">
          <p className="dash-ola">Olá, {nome}</p>
          {carregando ? (
            <Skeleton h={34} mb={0} />
          ) : (
            <h1 className="dash-meta">
              {meta?.tipo === "rumo" && meta.valor > 0 && (
                <>Você está a <span className="num meta-gold">{meta.valor} pts</span> do pódio</>
              )}
              {meta?.tipo === "rumo" && meta.valor <= 0 && <>Você está à beira do pódio</>}
              {meta?.tipo === "podio" && <>Você está em {meta.n}º — segure a posição</>}
              {meta?.tipo === "lidera" && meta.valor > 0 && (
                <>Você lidera por <span className="num">{meta.valor} pts</span></>
              )}
              {meta?.tipo === "lidera" && meta.valor <= 0 && <>Você lidera o bolão</>}
              {meta?.tipo === "sozinho" && <>Faça seus palpites e entre no ranking</>}
            </h1>
          )}
        </header>

        {/* 2. Palpite pendente */}
        {carregando ? (
          <Skeleton h={140} mb={20} />
        ) : proximoPalpite ? (
          <section className="action-hero">
            {pendentesCount > 0 && (
              <span className="badge green">
                {pendentesCount} {pendentesCount === 1 ? "palpite pendente" : "palpites pendentes"}
              </span>
            )}
            <h3 className="hero-times">{proximoPalpite.casa} x {proximoPalpite.fora}</h3>
            <p className="hero-meta">
              {proximoPalpite.fase} · {formatarDataJogo(proximoPalpite.data)}
            </p>
            <button className="btn-bet" onClick={() => irParaJogo(proximoPalpite.id)}>
              Dar meu palpite
            </button>
          </section>
        ) : (
          <p className="tudo-palpitado"><Check size={16} /> Tudo palpitado</p>
        )}

        {/* 3. Hoje / A seguir */}
        <section className="dash-bloco">
          <div className="bloco-head">
            <h2 className="secao-rotulo">{tituloLista}</h2>
            {jogosHoje.length > 0 && !carregando && (
              <span className="secao-resumo">
                {jogosHoje.length} {jogosHoje.length === 1 ? "jogo" : "jogos"} · {palpitadosHoje} de {jogosHoje.length} palpitados
              </span>
            )}
          </div>
          {carregando ? (
            <>
              <Skeleton h={64} /><Skeleton h={64} /><Skeleton h={64} mb={0} />
            </>
          ) : listaExibida.length === 0 ? (
            <p className="vazio">Nenhum jogo agendado.</p>
          ) : (
            listaExibida.map((jogo) => (
              <button key={jogo.id} className="list-row" onClick={() => irParaJogo(jogo.id)}>
                <span className="list-hora num">{horaJogo(jogo.data)}</span>
                <span className="list-times">
                  <EscudoTime nome={jogo.casa} size={20} /> {jogo.casa}
                  <span className="vs">×</span>
                  <EscudoTime nome={jogo.fora} size={20} /> {jogo.fora}
                </span>
                <StatusChip tipo={jogo.status.tipo} texto={jogo.status.texto} />
              </button>
            ))
          )}
        </section>

        {/* 4. Resumo */}
        <dl className="dash-resumo">
          <div>
            <dd className="num">{carregando ? "–" : pontuacao}</dd>
            <dt>Pontos</dt>
          </div>
          <div>
            <dd className="num">{carregando ? "–" : `${posicao}º`}</dd>
            <dt>Posição</dt>
          </div>
          <div>
            <dd className="num">{carregando ? "–" : totalPalpites}</dd>
            <dt>Palpites</dt>
          </div>
        </dl>

        {/* 5. Ranking */}
        <section className="dash-bloco">
          <div className="bloco-head">
            <h2 className="secao-rotulo"><Trophy size={15} /> Classificação</h2>
            <Link to="/ranking" className="ver-todos">Ver todos</Link>
          </div>
          {carregando ? (
            <>
              <Skeleton h={44} /><Skeleton h={44} /><Skeleton h={44} /><Skeleton h={44} mb={0} />
            </>
          ) : (
            <>
              {topRanking.map((item, i) => (
                <div key={item.uid} className={`rank-row${item.uid === user.uid ? " eu" : ""}`}>
                  <Medal size={18} color="currentColor" style={{ color: corMedalha(i) }} />
                  <span className="rank-nome">{item.nome}</span>
                  <strong className="rank-pts num">{item.pontos}</strong>
                </div>
              ))}
              {!usuarioNoTop3 && userRow && (
                <>
                  <div className="rank-sep" aria-hidden="true">···</div>
                  <div className="rank-row eu">
                    <span className="rank-pos num">{userRow.pos}º</span>
                    <span className="rank-nome">{userRow.nome} (você)</span>
                    <strong className="rank-pts num">{userRow.pontos}</strong>
                  </div>
                </>
              )}
              {faseAnterior && infoEvolucao?.posAnterior != null && (
                <p className="rank-semana-passada">
                  Semana passada: {infoEvolucao.posAnterior}º lugar · {ptsAnterior} pts
                </p>
              )}
            </>
          )}
        </section>

        {/* 6. Bolões entre amigos */}
        <button className="list-row nav-row" onClick={() => navigate("/boloes-especiais")}>
          <Ticket size={22} color="currentColor" style={{ color: "var(--c-gold)" }} />
          <span className="nav-row-texto">
            <strong>Bolões entre amigos</strong>
            <span>{convitesPendentes > 0 ? `${convitesPendentes} convite(s) aguardando você` : "Bolões privados entre amigos"}</span>
          </span>
          {convitesPendentes > 0 && <span className="nav-row-badge num">{convitesPendentes}</span>}
          <ChevronRight size={18} className="chevron" />
        </button>

      </div>
    </Layout>
  );
}
