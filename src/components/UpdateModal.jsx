import { Download, X, RefreshCw } from "lucide-react";

export function UpdateModal({ updateInfo, onFechar }) {
  function abrirDownload() {
    window.open(updateInfo.downloadUrl, "_blank");
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.75)",
      padding: "20px",
    }}>
      <div style={{
        background: "#141a23",
        borderRadius: "16px",
        padding: "24px 20px",
        maxWidth: "360px",
        width: "100%",
        border: "1px solid rgba(255,215,0,0.3)",
        boxShadow: "0 0 40px rgba(255,215,0,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <RefreshCw size={22} color="#FFD700" />
            <div>
              <h3 style={{ margin: 0, color: "#FFD700", fontSize: "1.1rem" }}>
                Atualização disponível
              </h3>
              <p style={{ margin: "2px 0 0", color: "#aab", fontSize: "0.8rem" }}>
                Versão {updateInfo.versao}
              </p>
            </div>
          </div>

          <button
            onClick={onFechar}
            style={{
              background: "transparent",
              border: "none",
              color: "#aab",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Notas da versão */}
        {updateInfo.notas && (
          <div style={{
            background: "#0f141e",
            borderRadius: "10px",
            padding: "12px",
            maxHeight: "140px",
            overflowY: "auto",
          }}>
            <p style={{
              margin: 0,
              color: "#ccc",
              fontSize: "0.82rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>
              {updateInfo.notas}
            </p>
          </div>
        )}

        {/* Botões */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onFechar}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #333",
              background: "transparent",
              color: "#aab",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            Agora não
          </button>

          <button
            onClick={abrirDownload}
            style={{
              flex: 2,
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: "#FFD700",
              color: "#0F3D2E",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Download size={16} /> Baixar agora
          </button>
        </div>

      </div>
    </div>
  );
}