export default function Loading({ texto = "Carregando..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "40px 16px",
        color: "var(--text-muted)",
        fontSize: "0.9rem",
      }}
    >
      <span
        className="loading-spinner"
        aria-hidden="true"
      />
      {texto}
    </div>
  );
}