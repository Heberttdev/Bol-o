// Placeholder de carregamento com altura fixa — evita salto de layout (CLS).
export default function Skeleton({ h, mb = 8 }) {
  return (
    <div
      className="skeleton"
      style={{ height: h, minHeight: h, marginBottom: mb }}
      aria-hidden="true"
    />
  );
}
