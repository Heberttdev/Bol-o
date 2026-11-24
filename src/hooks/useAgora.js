import { useEffect, useState } from "react";

// Relógio da tela: mantém o render puro e atualiza a cada `intervaloMs`.
export function useAgora(intervaloMs = 30000) {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}
