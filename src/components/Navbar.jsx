import { Link } from "react-router-dom";
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
    padding: "12px",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
    <div
      style={{
        color: "#FFD700",
        fontSize: "20px",
        fontWeight: "bold",
      }}
    >
      Bolão Green
    </div>

    <div
      style={{
        display: "flex",
        gap: "20px",
        alignItems: "center",
      }}
    >
      <Link
        to="/dashboard"
        style={{
          color: "white",
          textDecoration: "none",
          fontWeight: "500",
        }}
      >
        Dashboard
      </Link>

      <Link
        to="/jogos"
        style={{
          color: "white",
          textDecoration: "none",
          fontWeight: "500",
        }}
      >
        Jogos
      </Link>

      <Link
        to="/ranking"
        style={{
          color: "white",
          textDecoration: "none",
          fontWeight: "500",
        }}
      >
        Ranking
      </Link>

      <Link
        to="/perfil"
        style={{
          color: "white",
          textDecoration: "none",
          fontWeight: "500",
        }}
      >
        Perfil
      </Link>

      {isAdmin && (
        <Link
          to="/admin"
          style={{
            color: "#FFD700",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Admin
        </Link>
      )}

      <button
        onClick={logout}
        style={{
          background: "#FFD700",
          color: "#0F3D2E",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Sair
      </button>
    </div>
  </nav>
);
}
