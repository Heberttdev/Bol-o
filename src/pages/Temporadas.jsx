import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { Archive, Crown } from "lucide-react";
import Layout from "../components/Layout";
import Loading from "../components/Loading";
import Card from "../components/ui/Card";
import RankRow from "../components/ui/RankRow";
import { database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { formatarPontos, formatarPosicao, plural } from "../utils/texto";

export default function Temporadas() {
  const { user } = useAuth();
  const [temporadas, setTemporadas] = useState(null);

  useEffect(() => {
    return onValue(
      ref(database, "temporadas"),
      (snap) => {
        const lista = Object.values(snap.val() || {}).sort((a, b) => (b.arquivadoEm || 0) - (a.arquivadoEm || 0));
        setTemporadas(lista);
      },
      (err) => {
        console.error("Erro ao carregar temporadas:", err);
        setTemporadas([]);
      }
    );
  }, []);

  if (temporadas === null) return <Loading />;

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dash-header">
          <div>
            <h2 className="linha-icone"><Archive size={22} /> Temporadas</h2>
            <p>Campeão e classificação final de cada campeonato encerrado</p>
          </div>
        </div>

        {temporadas.length === 0 ? (
          <Card className="bolao-vazio">
            <Archive size={32} aria-hidden="true" />
            <p>Nenhum campeonato finalizado ainda.</p>
          </Card>
        ) : (
          <div className="lista-boloes">
            {temporadas.map((t) => {
              const ranking = Array.isArray(t.ranking) ? t.ranking : Object.values(t.ranking || {});
              const ids = new Set(Array.isArray(t.campeoes) ? t.campeoes : Object.values(t.campeoes || {}));
              const campeoes = ids.size ? ranking.filter((r) => ids.has(r.uid)) : ranking.slice(0, 1);
              return (
                <Card as="article" key={t.id}>
                  <h3 className="linha-icone temporada-titulo">{t.nome}</h3>
                  {campeoes.length > 0 && (
                    <p className="temporada-campeao linha-icone">
                      <Crown size={16} /> {campeoes.length > 1 ? "Campeões" : "Campeão"}: {campeoes.map((c) => c.nome).join(", ")} ·{" "}
                      {formatarPontos(campeoes[0].pontos)}
                    </p>
                  )}
                  <p className="temporada-meta">
                    {plural(t.totalJogos || 0, "jogo", "jogos")} · {plural(ranking.length, "participante", "participantes")}
                    {t.arquivadoEm ? ` · arquivada em ${new Date(t.arquivadoEm).toLocaleDateString("pt-BR")}` : ""}
                  </p>
                  <div>
                    {ranking.map((r, i) => (
                      <RankRow
                        key={r.uid}
                        posicao={formatarPosicao(i + 1)}
                        nome={r.nome}
                        fotoUrl={r.photoURL || null}
                        pontos={formatarPontos(r.pontos)}
                        eu={r.uid === user?.uid}
                      />
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
