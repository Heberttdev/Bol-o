import Navbar from "./Navbar";
import TopBar from "./TopBar";

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <TopBar />

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "16px 16px 20px",
      }}>
        {children}
      </div>

      <Navbar />
    </div>
  );
}