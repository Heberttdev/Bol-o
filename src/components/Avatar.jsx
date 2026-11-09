// Avatar único do app (header, Ranking, Início).
// Ordem: foto → iniciais do nome → inicial do e-mail → "?".
// Iniciais geradas localmente — sem depender de serviço externo.

function gerarIniciais(nome, email) {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  if (partes.length > 1) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  const inicialEmail = String(email || "").trim()[0];
  return inicialEmail ? inicialEmail.toUpperCase() : "?";
}

// Paleta de identidade do avatar (cor estável por nome). Exceção documentada
// à regra "só tokens": são cores de identificação, não de papel na interface.
const PALETA = ["#34d399", "#fbbf24", "#00bfff", "#ff6b6b", "#a78bfa", "#fb923c"];

function gerarCor(chave) {
  if (!chave) return PALETA[0];
  let hash = 0;
  for (let i = 0; i < chave.length; i++) {
    hash = chave.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETA[Math.abs(hash) % PALETA.length];
}

export default function Avatar({ nome, email, fotoUrl, size = 55, className = "" }) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        className={className || "avatar-glow"}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius: "50%",
          display: "block",
          flex: "none",
        }}
      />
    );
  }

  const iniciais = gerarIniciais(nome, email);
  const cor = gerarCor(nome || email);

  return (
    <div
      className={className || "avatar-glow"}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "50%",
        background: "var(--c-surface-2)",
        border: `2px solid ${cor}`,
        boxShadow: `0 0 15px ${cor}66`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.36,
        color: cor,
      }}
    >
      {iniciais}
    </div>
  );
}
