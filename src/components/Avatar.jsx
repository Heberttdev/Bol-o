// Avatar com iniciais geradas localmente — sem depender de serviço externo.
// Se houver foto (photoURL), usa a foto normalmente.

function gerarIniciais(nome) {
  if (!nome) return "?";

  const partes = nome.trim().split(/\s+/);

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// Gera uma cor consistente a partir do nome, dentro de uma paleta
// que combina com o tema verde/dourado do app.
const PALETA = ["#00ff88", "#FFD700", "#00bfff", "#ff6b6b", "#a78bfa", "#fb923c"];

function gerarCor(nome) {
  if (!nome) return PALETA[0];

  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }

  return PALETA[Math.abs(hash) % PALETA.length];
}

export default function Avatar({ nome, fotoUrl, size = 55, className = "" }) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        className={className || "avatar-glow"}
        alt="perfil"
        style={{ width: size, height: size }}
      />
    );
  }

  const iniciais = gerarIniciais(nome);
  const cor = gerarCor(nome);

  return (
    <div
      className={className || "avatar-glow"}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#141a23",
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