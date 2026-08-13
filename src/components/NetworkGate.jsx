import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";
import { WifiOff, RefreshCw, Wifi, PlaneTakeoff, RotateCcw } from "lucide-react";

export default function NetworkGate({ children }) {
  const [online, setOnline] = useState(true);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    // Verifica estado inicial
    Network.getStatus().then((status) => {
      setOnline(status.connected);
      setVerificando(false);
    });

    // Escuta mudanças de conexão em tempo real
    const handler = Network.addListener("networkStatusChange", (status) => {
      setOnline(status.connected);
    });

    return () => { handler.then(h => h.remove()); };
  }, []);

  // Enquanto verifica, não mostra nada (evita flash)
  if (verificando) return null;

  if (!online) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0b0f14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Segoe UI', Roboto, system-ui, sans-serif",
        color: "#fff",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          maxWidth: "340px",
          width: "100%",
          textAlign: "center",
        }}>

          {/* Logo */}
          <div style={{ color: "#FFD700", fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              <path d="M2 12h20"/>
            </svg>
            Bolão Green
          </div>

          {/* Ícone animado */}
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#141a23",
            border: "2px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 2.5s ease-in-out infinite",
          }}>
            <WifiOff size={36} color="#FFD700" />
          </div>

          {/* Texto */}
          <div>
            <p style={{ fontSize: "1.3rem", fontWeight: 700 }}>Sem conexão</p>
            <p style={{ fontSize: "0.9rem", color: "#aab", lineHeight: 1.6, marginTop: "8px" }}>
              O Bolão Green precisa de internet pra carregar os jogos e palpites em tempo real.
            </p>
          </div>

          {/* Dicas */}
          <div style={{
            background: "#141a23",
            borderRadius: "12px",
            padding: "16px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            {[
              { icon: <Wifi size={14} color="#00ff88" />, text: "Verifique se o Wi-Fi ou dados móveis estão ativos" },
              { icon: <PlaneTakeoff size={14} color="#00ff88" />, text: "Certifique-se que o modo avião está desligado" },
              { icon: <RotateCcw size={14} color="#00ff88" />, text: "A tela atualiza automaticamente quando a conexão voltar" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "6px",
                  background: "#0F3D2E", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  {icon}
                </div>
                <span style={{ fontSize: "0.82rem", color: "#ccc" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Botão */}
          <button
            onClick={() => Network.getStatus().then(s => setOnline(s.connected))}
            style={{
              width: "100%",
              padding: "13px",
              background: "#FFD700",
              color: "#0F3D2E",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <RefreshCw size={16} /> Verificar conexão
          </button>

          <p style={{ fontSize: "0.75rem", color: "#444" }}>Bolão Green © 2026</p>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.15); }
            50% { box-shadow: 0 0 0 16px rgba(255,215,0,0); }
          }
        `}</style>
      </div>
    );
  }

  return children;
}