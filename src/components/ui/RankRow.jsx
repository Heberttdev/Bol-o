import Avatar from "../Avatar";

// Linha de classificação: posição (ou ícone), avatar, nome e pontos.
export default function RankRow({ posicao, nome, fotoUrl, pontos, eu = false, sufixo }) {
  return (
    <div className={`rank-row${eu ? " eu" : ""}`}>
      <span className="rank-pos num">{posicao}</span>
      <Avatar nome={nome} fotoUrl={fotoUrl} size={28} />
      <span className="rank-nome">
        {nome}
        {sufixo}
      </span>
      <strong className="rank-pts num">{pontos}</strong>
    </div>
  );
}
