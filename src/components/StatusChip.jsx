import { Check, Clock, Radio, Lock } from "lucide-react";

// Chip de status do palpite: sempre ícone + texto (nunca só cor).
// tipo: "salvo" | "pendente" | "aovivo" | "fechado"
const ICONES = {
  salvo: <Check size={13} />,
  pendente: <Clock size={13} />,
  aovivo: <Radio size={13} />,
  fechado: <Lock size={13} />,
};

export default function StatusChip({ tipo, texto }) {
  if (!tipo) return null;
  return (
    <span className={`status-chip ${tipo}`}>
      {ICONES[tipo]} {texto}
    </span>
  );
}
