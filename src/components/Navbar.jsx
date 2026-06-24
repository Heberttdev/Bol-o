import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../services/firebase";

export default function Navbar() {
  const logout = async () => {
    await signOut(auth);
  };

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    verificarAdmin();
  }, []);

  async function verificarAdmin() {
    const user = auth.currentUser;

    if (!user) return;

    const snapshot = await get(ref(database, `users/${user.uid}`));

    if (!snapshot.exists()) return;

    const dados = snapshot.val();

    if (dados.role === "admin") {
      setIsAdmin(true);
    }
  }

  return (
    <nav
      style={{
        background: "#0F3D2E",
        padding: "14px 20px",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          color: "#FFD700",
          fontSize: "20px",
          fontWeight: "bold",
          whiteSpace: "nowrap",
        }}
      >
        ⚽ Bolão Green
      </div>

      <div className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
          📊 Dashboard
        </NavLink>

        <NavLink to="/jogos" className={({ isActive }) => (isActive ? "active" : "")}>
          ⚽ Jogos
        </NavLink>

        <NavLink to="/ranking" className={({ isActive }) => (isActive ? "active" : "")}>
          🏆 Ranking
        </NavLink>

        <NavLink to="/perfil" className={({ isActive }) => (isActive ? "active" : "")}>
          👤 Perfil
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => (isActive ? "active" : "")}
            style={{ color: "#FFD700" }}
          >
            🛠 Admin
          </NavLink>
        )}
      </div>

      <button
        onClick={logout}
        style={{
          background: "#FFD700",
          color: "#0F3D2E",
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          whiteSpace: "nowrap",
        }}
      >
        Sair
      </button>
    </nav>
  );
}