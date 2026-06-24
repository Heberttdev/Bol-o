import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f14",
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        {children}
      </div>
    </div>
  );
}