import { Moon, Sun } from "lucide-react";
import { useTema } from "../hooks/useTheme";

export default function ThemeToggle({ light = false }) {
  const { tema, alternar } = useTema();

  return (
    <button
      onClick={alternar}
      aria-label={tema === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title="Alternar tema claro/escuro"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "none",
        borderRadius: "50%",
        width: "34px",
        height: "34px",
        color: light ? "#FFD700" : "rgba(255,255,255,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "color 0.2s",
      }}
    >
      {tema === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}