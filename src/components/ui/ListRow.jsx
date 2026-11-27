import { ChevronRight } from "lucide-react";

// Linha de lista. Com `onClick` vira botão; sem ele é uma linha estática.
// `titulo`/`subtitulo`/`badge` montam a linha de navegação (ícone, textos, contador, seta).
export default function ListRow({ onClick, icone, titulo, subtitulo, badge, className = "", children }) {
  const navegacao = titulo !== undefined;
  const classes = ["list-row", navegacao && "nav-row", !onClick && "estatica", className].filter(Boolean).join(" ");
  const conteudo = navegacao ? (
    <>
      {icone}
      <span className="nav-row-texto">
        <strong>{titulo}</strong>
        {subtitulo && <span>{subtitulo}</span>}
      </span>
      {badge ? <span className="nav-row-badge num">{badge}</span> : null}
      {onClick && <ChevronRight size={18} className="chevron" />}
    </>
  ) : (
    children
  );
  return onClick ? (
    <button type="button" className={classes} onClick={onClick}>
      {conteudo}
    </button>
  ) : (
    <div className={classes}>{conteudo}</div>
  );
}
