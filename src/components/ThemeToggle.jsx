import { Moon, Sun } from "lucide-react";
import { useTema } from "../hooks/useTheme";

export default function ThemeToggle({ light = false, row = false }) {
  const { tema, alternar } = useTema();
  const Icon = tema === "dark" ? Sun : Moon;
  const rotulo = tema === "dark" ? "Tema claro" : "Tema escuro";

  // Variante "row": linha de menu (ícone + texto) para a folha "Mais".
  if (row) {
    return (
      <button type="button" onClick={alternar} aria-label={`Ativar ${rotulo.toLowerCase()}`}>
        <Icon size={18} /> {rotulo}
      </button>
    );
  }

  return (
    <button
      onClick={alternar}
      aria-label={`Ativar ${rotulo.toLowerCase()}`}
      title="Alternar tema claro/escuro"
      style={{
        background: "color-mix(in srgb, var(--c-text) 8%, transparent)",
        border: "none",
        borderRadius: "var(--r-pill)",
        width: "44px",
        height: "44px",
        color: light ? "color-mix(in srgb, var(--c-text) 85%, transparent)" : "var(--c-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "color 0.2s",
      }}
    >
      <Icon size={17} />
    </button>
  );
}
