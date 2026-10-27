import Layout from "../components/Layout";
import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { montarEvolucao, semanaDoJogo } from "../utils/evolucao";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { Trophy, Medal, Crown, Loader2, Share2, TrendingUp, TrendingDown, Search } from "lucide-react";
import Avatar from "../components/Avatar";

export default function Ranking() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [infoEvolucao, setInfoEvolucao] = useState(null);
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState("geral");
  const [faseAtual, setFaseAtual] = useState(null);
  const [rotuloFase, setRotuloFase] = useState("");
  const [minhaLinhaVisivel, setMinhaLinhaVisivel] = useState(true);
  const minhaLinhaRef = useRef(null);

  const snapshotData = useRef({
    users: {},
    bets: {},
    resultados: {},
    jogos: {},
  });

  useEffect(() => {
    let initialCount = 0;
    const processarRanking = () => {
      const { users, bets, resultados, jogos } = snapshotData.current;
      const listaJogos = Object.entries(jogos || {}).map(([id, j]) => ({ id, ...j }));
      const evolucao = montarEvolucao({ users, bets, resultados, jogos: listaJogos, uid: user?.uid });
      const fasePorJogo = {};
      listaJogos.forEach((j) => {
        fasePorJogo[j.id] = semanaDoJogo(j);
      });

      const listaRanking = [];

      Object.keys(users).forEach((uid) => {
        const usuario = users[uid];
        const betsUsuario = bets[uid] || {};

        let pontos = 0;
        let exatos = 0;
        let pontosRodada = 0;
        let exatosRodada = 0;
        Object.keys(betsUsuario).forEach((jogoId) => {
          const pts = calcularPontuacao(betsUsuario[jogoId], resultados[jogoId]);
          pontos += pts;
          if (pts >= 10) exatos += 1;
          if (evolucao.faseAtual && fasePorJogo[jogoId] === evolucao.faseAtual) {
            pontosRodada += pts;
            if (pts >= 10) exatosRodada += 1;
          }
        });

        listaRanking.push({
          uid,
          nome: usuario.nome || "Jogador",
          fotoUrl: usuario.photoURL || null,
          pontos,
          exatos,
          pontosRodada,
          exatosRodada,
        });
      });

      listaRanking.sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos || a.nome.localeCompare(b.nome));
      setRanking(listaRanking);
      if (user) setInfoEvolucao(evolucao);
      setFaseAtual(evolucao.faseAtual);
      setRotuloFase(evolucao.rotuloFaseAtual);

      initialCount++;
      if (initialCount >= 4) {
        setLoading(false);
      }
    };

    const unsubUsers = onValue(
      ref(database, "perfisPublicos"),
      (snap) => {
        snapshotData.current.users = snap.val() || {};
        processarRanking();
      },
      (err) => {
        console.error("Erro ao escutar users no ranking:", err);
        setLoading(false);
      }
    );

    const unsubBets = onValue(
      ref(database, "bets"),
      (snap) => {
        snapshotData.current.bets = snap.val() || {};
        processarRanking();
      },
      (err) => {
        console.error("Erro ao escutar bets no ranking:", err);
        setLoading(false);
      }
    );

    const unsubResultados = onValue(
      ref(database, "resultados"),
      (snap) => {
        snapshotData.current.resultados = snap.val() || {};
        processarRanking();
      },
      (err) => {
        console.error("Erro ao escutar resultados no ranking:", err);
        setLoading(false);
      }
    );

    const unsubJogos = onValue(
      ref(database, "jogos"),
      (snap) => {
        snapshotData.current.jogos = snap.val() || {};
        processarRanking();
      },
      (err) => {
        console.error("Erro ao escutar jogos no ranking:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubUsers();
      unsubBets();
      unsubResultados();
      unsubJogos();
    };
  }, [user]);

  const modoRodada = modo === "rodada" && Boolean(faseAtual);
  const rankingExibido = modoRodada
    ? ranking
        .map((u) => ({ ...u, pontos: u.pontosRodada, exatos: u.exatosRodada }))
        .sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos || a.nome.localeCompare(b.nome))
    : ranking;
  const minhaPosicao = rankingExibido.findIndex((u) => u.uid === user?.uid) + 1;
  const meusDados = rankingExibido[minhaPosicao - 1];

  useEffect(() => {
    const el = minhaLinhaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setMinhaLinhaVisivel(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, modo, busca, rankingExibido.length]);

  const compartilharWhatsApp = () => {
    if (rankingExibido.length === 0) return;
    const linhas = rankingExibido
      .slice(0, 5)
      .map((u, i) => `${i + 1}º ${u.nome} - ${u.pontos} pts`);
    const titulo = modoRodada ? `Ranking Bolão Green — ${rotuloFase}` : "Ranking Bolão Green";
    const texto = `🏆 *${titulo}*\n\n${linhas.join("\n")}\n\nParticipe você também!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  };

  const maxPtsEvolucao = Math.max(
    1,
    ...(infoEvolucao?.evolucao || []).map((e) => e.pontos)
  );

  const fasesBarras = (infoEvolucao?.evolucao || [])
    .filter((e) => e.pontos > 0 || e.fase === infoEvolucao.faseAtual)
    .slice(-12);
  const nomeCurtoAtual = (infoEvolucao?.rotuloFaseAtual || "").toLowerCase();

  const termoBusca = busca.trim().toLowerCase();
  const rankingFiltrado = termoBusca
    ? rankingExibido.filter((u) => u.nome.toLowerCase().includes(termoBusca))
    : rankingExibido;

  return (
    <Layout>
      <div className="dashboard-container" aria-busy={loading}>
        {/* HEADER estilo painel */}
        <div className="dash-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={22} /> {modoRodada ? `Ranking — ${rotuloFase}` : "Ranking Geral"}
            </h2>
            <p>{modoRodada ? "Pontos dos jogos de segunda a domingo — todas as competições" : "Os melhores apostadores da plataforma"}</p>
          </div>
          <button
            className="quick-action"
            onClick={compartilharWhatsApp}
            title="Compartilhar no WhatsApp"
          >
            <Share2 size={22} />
            <span>Compartilhar</span>
          </button>
        </div>

        {loading ? (
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "var(--fs-16)" }}>
              <Loader2 size={18} /> Carregando classificação...
            </h3>
            <div style={{ marginTop: "16px" }}>
              <div className="skeleton" style={{ marginBottom: "8px" }} />
              <div className="skeleton" style={{ marginBottom: "8px" }} />
              <div className="skeleton" />
            </div>
          </div>
        ) : (
          <>
            {user && infoEvolucao && (
              <section className="evo-card">
                <div className="evo-top">
                  <h3>
                    <TrendingUp size={16} /> Sua evolução
                  </h3>
                  {infoEvolucao.delta != null && infoEvolucao.delta !== 0 && (
                    <span className={`delta-badge ${infoEvolucao.delta > 0 ? "up" : "down"}`}>
                      {infoEvolucao.delta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(infoEvolucao.delta)} pos.
                    </span>
                  )}
                </div>

                <div className="evo-resumo">
                  <div className="evo-resumo-pos">
                    <strong>#{infoEvolucao.posicaoTotal || "-"}</strong>
                    <span>posição geral</span>
                  </div>
                  <div className="evo-resumo-atual">
                    {infoEvolucao.faseAtual ? (
                      <>
                        <strong>{infoEvolucao.pontosFaseAtual} pts</strong>
                        <span>
                          {infoEvolucao.posAtual ? `#${infoEvolucao.posAtual} em ` : "em "}
                          {nomeCurtoAtual}
                        </span>
                      </>
                    ) : (
                      <strong style={{ color: "var(--text-muted)" }}>sem jogos ainda</strong>
                    )}
                  </div>
                </div>

                {fasesBarras.length > 0 ? (
                  <div className="evo-graf">
                    {fasesBarras.map((e) => (
                      <div
                        className={`evo-bar ${e.pontos === 0 ? "vazia" : ""} ${e.fase === infoEvolucao.faseAtual ? "atual" : ""}`}
                        key={e.fase}
                        title={`Semana de ${e.nomeCurto}: ${e.pontos} pts`}
                      >
                        <span className="evo-bar-pts">{e.pontos}</span>
                        <div className="evo-bar-track">
                          <div
                            className="evo-bar-fill"
                            style={{ height: e.pontos > 0 ? `${(e.pontos / maxPtsEvolucao) * 100}%` : "0%" }}
                          />
                        </div>
                        <span className="evo-bar-r">{e.nomeCurto}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="evo-vazio">Sem semanas registradas ainda. Faça seus palpites!</p>
                )}
              </section>
            )}

            {faseAtual && (
              <div className="seletor-modo" role="tablist" aria-label="Tipo de ranking">
                <button
                  role="tab"
                  aria-selected={!modoRodada}
                  className={!modoRodada ? "ativo" : ""}
                  onClick={() => setModo("geral")}
                >
                  Geral
                </button>
                <button
                  role="tab"
                  aria-selected={modoRodada}
                  className={modoRodada ? "ativo" : ""}
                  onClick={() => setModo("rodada")}
                >
                  {rotuloFase}
                </button>
              </div>
            )}

            {/* PODIUM */}
            {rankingExibido.length >= 3 && (
              <div className="podium">
                {/* 2º */}
                <div className="podium-card silver">
                  <span className="podium-posicao">2º</span>
                  <div className="podium-foto">
                    <Avatar nome={rankingExibido[1]?.nome} fotoUrl={rankingExibido[1]?.fotoUrl} size={48} />
                    <Medal size={16} color="#C0C0C0" style={{ position: "absolute", bottom: -3, right: -3, background: "var(--bg)", borderRadius: "50%", padding: 2 }} />
                  </div>
                  <h3>{rankingExibido[1]?.nome}</h3>
                  <span className="podium-pontos">{rankingExibido[1]?.pontos} pts</span>
                </div>

                {/* 1º */}
                <div className="podium-card gold big">
                  <span className="podium-posicao">1º</span>
                  <Crown size={26} className="podium-coroa" />
                  <div className="podium-foto">
                    <Avatar nome={rankingExibido[0]?.nome} fotoUrl={rankingExibido[0]?.fotoUrl} size={58} />
                    <Medal size={18} color="currentColor" style={{ position: "absolute", bottom: -3, right: -3, background: "var(--bg)", borderRadius: "var(--r-pill)", padding: 2, color: "var(--c-gold)" }} />
                  </div>
                  <h3>{rankingExibido[0]?.nome}</h3>
                  <span className="podium-pontos">{rankingExibido[0]?.pontos} pts</span>
                </div>

                {/* 3º */}
                <div className="podium-card bronze">
                  <span className="podium-posicao">3º</span>
                  <div className="podium-foto">
                    <Avatar nome={rankingExibido[2]?.nome} fotoUrl={rankingExibido[2]?.fotoUrl} size={48} />
                    <Medal size={16} color="#CD7F32" style={{ position: "absolute", bottom: -3, right: -3, background: "var(--bg)", borderRadius: "50%", padding: 2 }} />
                  </div>
                  <h3>{rankingExibido[2]?.nome}</h3>
                  <span className="podium-pontos">{rankingExibido[2]?.pontos} pts</span>
                </div>
              </div>
            )}

            {/* BUSCA (só para listas longas — Miller) */}
            {ranking.length > 8 && (
              <>
                <div className="search-field">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar jogador pelo nome..."
                    aria-label="Buscar jogador no ranking"
                  />
                </div>
                {termoBusca && (
                  <p className="results-count">
                    {rankingFiltrado.length} resultado{rankingFiltrado.length === 1 ? "" : "s"} para "{busca.trim()}"
                  </p>
                )}
              </>
            )}

            {/* LISTA COMPLETA */}
            <div className="ranking-list">
              {rankingFiltrado.map((usuario) => {
                const posicao = rankingExibido.findIndex((u) => u.uid === usuario.uid) + 1;
                return (
                  <div
                    key={usuario.uid}
                    ref={usuario.uid === user?.uid ? minhaLinhaRef : undefined}
                    className={`ranking-row ${usuario.uid === user?.uid ? "minha-pos" : ""}`}
                  >
                    <div className={`rank-pos ${posicao <= 3 ? `pos-${posicao}` : ""}`}>
                      {posicao}º
                    </div>
                    <Avatar nome={usuario.nome} fotoUrl={usuario.fotoUrl} size={32} />
                    <div className="rank-name">
                      {usuario.nome}
                      {usuario.uid === user?.uid && (
                        <span style={{ color: "var(--primary)", fontSize: "var(--fs-12)", fontWeight: 700, marginLeft: 6 }}>
                          (você)
                        </span>
                      )}
                      {usuario.exatos > 0 && (
                        <span style={{ display: "block", fontSize: "var(--fs-12)", color: "var(--text-soft)", fontWeight: 500 }}>
                          {usuario.exatos} placar exato{usuario.exatos > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="rank-points">
                      {usuario.pontos} pts
                    </div>
                  </div>
                );
              })}
              {rankingFiltrado.length === 0 && (
                <p className="list-empty">
                  {termoBusca ? `Nenhum jogador encontrado para "${busca.trim()}".` : "Nenhum apostador encontrado."}
                </p>
              )}
            </div>

            {meusDados && !minhaLinhaVisivel && !termoBusca && (
              <button
                className="minha-posicao-fixa"
                onClick={() => minhaLinhaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
              >
                <span className="rank-pos">{minhaPosicao}º</span>
                <Avatar nome={meusDados.nome} fotoUrl={meusDados.fotoUrl} size={28} />
                <span className="rank-name">Você</span>
                <span className="rank-points">{meusDados.pontos} pts</span>
              </button>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}