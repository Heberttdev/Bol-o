import Layout from "../components/Layout";
import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { calcularPontuacao } from "../utils/calcularPontuacao";
import { montarEvolucao } from "../utils/evolucao";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { Trophy, Medal, Loader2, Share2, TrendingUp, TrendingDown, User } from "lucide-react";
import Avatar from "../components/Avatar";

export default function Ranking() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [infoEvolucao, setInfoEvolucao] = useState(null);

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
      const listaRanking = [];

      Object.keys(users).forEach((uid) => {
        const usuario = users[uid];
        const betsUsuario = bets[uid] || {};

        let pontos = 0;
        let exatos = 0;
        Object.keys(betsUsuario).forEach((jogoId) => {
          const pts = calcularPontuacao(betsUsuario[jogoId], resultados[jogoId]);
          pontos += pts;
          if (pts >= 10) exatos += 1;
        });

        listaRanking.push({
          uid,
          nome: usuario.nome || "Jogador",
          email: usuario.email || "",
          fotoUrl: usuario.photoURL || usuario.fotoUrl || null,
          pontos,
          exatos,
        });
      });

      listaRanking.sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos || a.nome.localeCompare(b.nome));
      setRanking(listaRanking);

      if (user) {
        setInfoEvolucao(
          montarEvolucao({
            users,
            bets,
            resultados,
            jogos: Object.entries(jogos || {}).map(([id, j]) => ({ id, ...j })),
            uid: user.uid,
          })
        );
      }

      initialCount++;
      if (initialCount >= 4) {
        setLoading(false);
      }
    };

    const unsubUsers = onValue(
      ref(database, "users"),
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

  const compartilharWhatsApp = () => {
    if (ranking.length === 0) return;
    const linhas = ranking
      .slice(0, 5)
      .map((u, i) => `${i + 1}º ${u.nome} - ${u.pontos} pts`);
    const texto = `🏆 *Ranking Bolão Green*\n\n${linhas.join("\n")}\n\nParticipe você também!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  };

  const maxPtsEvolucao = Math.max(
    1,
    ...(infoEvolucao?.evolucao || []).map((e) => e.pontos)
  );

  return (
    <Layout>
      <div className="dashboard-container">
        {/* HEADER estilo painel */}
        <div className="dash-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={22} /> Ranking Geral
            </h2>
            <p>Os melhores apostadores da plataforma</p>
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
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "1rem" }}>
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
                <div className="evo-header">
                  <div>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                      <User size={15} /> Sua evolução
                    </h3>
                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      Você está em <strong style={{ color: "var(--gold)" }}>#{infoEvolucao.posicaoTotal || "-"}</strong> no ranking geral
                      {infoEvolucao.faseAtual && (
                        <> · {infoEvolucao.posAtual ? `#${infoEvolucao.posAtual} ` : ""}na {infoEvolucao.faseAtual}</>
                      )}
                    </p>
                  </div>
                  {infoEvolucao.delta != null && infoEvolucao.delta !== 0 && (
                    <span className={`delta-badge ${infoEvolucao.delta > 0 ? "up" : "down"}`}>
                      {infoEvolucao.delta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(infoEvolucao.delta)} pos.
                    </span>
                  )}
                </div>

                <div className="evo-bars">
                  {infoEvolucao.evolucao.map((e) => (
                    <div className="evo-row" key={e.fase}>
                      <span className="evo-label">{e.nomeCurto}</span>
                      <div className="evo-track">
                        <div
                          className="evo-fill"
                          style={{ width: `${(e.pontos / maxPtsEvolucao) * 100}%` }}
                        />
                      </div>
                      <span className="evo-val">{e.pontos}</span>
                    </div>
                  ))}
                  {infoEvolucao.evolucao.length === 0 && (
                    <p style={{ color: "var(--text-soft)", fontSize: "0.82rem", margin: 0 }}>
                      Sem rodadas registradas ainda. Faça seus palpites!
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* PODIUM */}
            {ranking.length >= 3 && (
              <div className="podium">
                {/* 2º */}
                <div className="podium-card silver">
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <Avatar nome={ranking[1]?.nome} fotoUrl={ranking[1]?.fotoUrl} size={48} />
                    <Medal size={18} color="#C0C0C0" style={{ position: "absolute", bottom: -4, right: -4, background: "#0b0f14", borderRadius: "50%", padding: 2 }} />
                  </div>
                  <h3>{ranking[1]?.nome}</h3>
                  <p>{ranking[1]?.pontos} pts</p>
                </div>

                {/* 1º */}
                <div className="podium-card gold big">
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <Avatar nome={ranking[0]?.nome} fotoUrl={ranking[0]?.fotoUrl} size={56} />
                    <Medal size={20} color="#FFD700" style={{ position: "absolute", bottom: -4, right: -4, background: "#0b0f14", borderRadius: "50%", padding: 2 }} />
                  </div>
                  <h3>{ranking[0]?.nome}</h3>
                  <p>{ranking[0]?.pontos} pts</p>
                </div>

                {/* 3º */}
                <div className="podium-card bronze">
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <Avatar nome={ranking[2]?.nome} fotoUrl={ranking[2]?.fotoUrl} size={48} />
                    <Medal size={18} color="#CD7F32" style={{ position: "absolute", bottom: -4, right: -4, background: "#0b0f14", borderRadius: "50%", padding: 2 }} />
                  </div>
                  <h3>{ranking[2]?.nome}</h3>
                  <p>{ranking[2]?.pontos} pts</p>
                </div>
              </div>
            )}

            {/* LISTA COMPLETA */}
            <div className="ranking-list">
              {ranking.map((usuario, index) => (
                <div
                  key={usuario.uid}
                  className={`ranking-row ${usuario.uid === user?.uid ? "minha-pos" : ""}`}
                >
                  <div className="rank-pos">
                    #{index + 1}
                  </div>
                  <Avatar nome={usuario.nome} fotoUrl={usuario.fotoUrl} size={32} />
                  <div className="rank-name">
                    {usuario.nome}
                    {usuario.uid === user?.uid && (
                      <span style={{ color: "var(--primary)", fontSize: "0.68rem", fontWeight: 700, marginLeft: 6 }}>
                        (você)
                      </span>
                    )}
                    {usuario.exatos > 0 && (
                      <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-soft)", fontWeight: 500 }}>
                        {usuario.exatos} placar exato{usuario.exatos > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="rank-points">
                    {usuario.pontos} pts
                  </div>
                </div>
              ))}
              {ranking.length === 0 && (
                <p style={{ color: "var(--text-soft)", textAlign: "center", padding: "20px" }}>Nenhum apostador encontrado.</p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}