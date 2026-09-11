import Layout from "../components/Layout";
import { BookOpen, Target, Scale, Lock, Trophy } from "lucide-react";

const PONTUACAO = [
  {
    pts: 10,
    titulo: "Placar exato",
    texto: "Acertou o placar final (ex.: apostou 2x1 e o jogo terminou 2x1).",
  },
  {
    pts: 5,
    titulo: "Acertou o resultado",
    texto: "Acertou o vencedor (ou o empate), mas não o placar exato.",
  },
  {
    pts: 0,
    titulo: "Errou o resultado",
    texto: "O vencedor escolhido não aconteceu (nem empate).",
  },
];

export default function Regras() {
  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dash-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={22} /> Regras do Bolão
            </h2>
            <p>Como funciona a pontuação e a classificação</p>
          </div>
        </div>

        {/* PONTUAÇÃO */}
        <div className="card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px", fontSize: "1.05rem" }}>
            <Target size={18} /> Pontuação por jogo
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {PONTUACAO.map((item) => (
              <div key={item.pts} className="regra-linha">
                <span className={`regra-pontos regra-pontos-${item.pts}`}>{item.pts} pts</span>
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem" }}>{item.titulo}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{item.texto}</span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: "var(--text-soft)", fontSize: "0.8rem", margin: "12px 0 0" }}>
            Ex.: Flamengo 2x1. Quem apostou "2x1" leva 10 pts; quem apostou "1x0" leva 5 pts; quem apostou "empate" ou "palmeiras" leva 0.
          </p>
        </div>

        {/* PALPITES */}
        <div className="card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px", fontSize: "1.05rem" }}>
            <Lock size={18} /> Palpites e fechamento
          </h2>
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
            <li>É <strong>1 palpite por jogo</strong> — você pode editar quantas vezes quiser <strong>enquanto o jogo estiver aberto</strong>.</li>
            <li>O palpite <strong>fecha no horário exibido no card</strong> do jogo (o "Fecha em...") ou quando o jogo começa, o que vier primeiro.</li>
            <li>Depois do fechamento, o palpite fica <strong>travado</strong> — não dá mais para alterar.</li>
            <li>Empate é um resultado válido: apostar "empate" e dar empate garante pontos.</li>
          </ul>
        </div>

        {/* DESEMPATE */}
        <div className="card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px", fontSize: "1.05rem" }}>
            <Scale size={18} /> Desempate no ranking
          </h2>
          <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Se dois apostadores terminarem com a mesma pontuação, vale esta ordem:
          </p>
          <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
            <li>Quem tiver <strong>mais pontos</strong> fica à frente.</li>
            <li>Se empatar, vence quem acertou <strong>mais placares exatos</strong>.</li>
            <li>Se ainda empatar, a <strong>ordem alfabética</strong> do nome decide.</li>
          </ol>
        </div>

        {/* EXTRAS */}
        <div className="card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px", fontSize: "1.05rem" }}>
            <Trophy size={18} /> Bônus
          </h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
            O <strong>Top 3</strong> ganha destaque no pódio do ranking, e o app mostra a sua evolução por rodada. Boa sorte!
          </p>
        </div>
      </div>
    </Layout>
  );
}