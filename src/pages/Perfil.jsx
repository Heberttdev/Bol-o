import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signOut, updateProfile } from "firebase/auth";
import { ref, get, update } from "firebase/database";
import { KeyRound, LogOut, ShieldCheck, User, Save } from "lucide-react";
import { auth, database } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";

export default function Perfil() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [perfilDb, setPerfilDb] = useState(null);
  const [role, setRole] = useState("user");
  const [nome, setNome] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!user) return;
    let ativo = true;
    get(ref(database, `users/${user.uid}`))
      .then((snap) => {
        if (!ativo || !snap.exists()) return;
        const dados = snap.val();
        setPerfilDb(dados);
        setRole(dados.role || "user");
        setNome(dados.nome || user.displayName || "");
        setFotoUrl(dados.photoURL || "");
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [user]);

  const sair = async () => {
    await signOut(auth);
    navigate("/");
  };

  const salvar = async (e) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    if (nomeLimpo.length < 2) {
      setAviso("O nome precisa ter pelo menos 2 letras.");
      return;
    }
    setSalvando(true);
    setAviso("");
    const novaFoto = fotoUrl.trim() || null;
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: nomeLimpo,
          photoURL: novaFoto,
        });
      }
      await update(ref(database, `users/${user.uid}`), {
        nome: nomeLimpo,
        photoURL: novaFoto,
      });
      setPerfilDb((prev) => ({ ...prev, nome: nomeLimpo, photoURL: novaFoto }));
      setAviso("Perfil atualizado!");
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      setAviso("Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "24px" }}>
        <div className="login-card-bet" style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "14px" }}>
            <Avatar nome={nome || perfilDb?.nome} fotoUrl={fotoUrl || null} size={76} />
          </div>

          <div className="login-header">
            <h1>{nome || "Jogador"}</h1>
            <p>{user?.email}</p>
          </div>

          <p style={{ display: "inline-flex", alignItems: "center", gap: "6px", margin: "0 0 18px", padding: "4px 16px", borderRadius: "999px", background: role === "admin" ? "rgba(255,215,0,0.15)" : "rgba(0,255,136,0.12)", color: role === "admin" ? "var(--gold)" : "var(--primary)", fontSize: "0.8rem", fontWeight: 600 }}>
            {role === "admin" ? <ShieldCheck size={14} /> : <User size={14} />}
            {role === "admin" ? "Administrador" : "Jogador"}
          </p>

          <form onSubmit={salvar} style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              maxLength={40}
              style={{
                marginTop: 4,
                padding: "11px 12px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--input-bg)",
                color: "var(--text)",
                outline: "none",
              }}
            />

            <label style={{ fontSize: "0.8rem", marginTop: 12, color: "var(--text-muted)", fontWeight: 500 }}>
              URL da foto (opcional)
            </label>
            <input
              type="url"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://..."
              style={{
                marginTop: 4,
                padding: "11px 12px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--input-bg)",
                color: "var(--text)",
                outline: "none",
              }}
            />

            <button
              type="submit"
              className="btn-login"
              disabled={salvando}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Save size={16} /> {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>

          {aviso && (
            <p style={{ marginTop: 10, fontSize: "0.85rem", fontWeight: 600, color: aviso.startsWith("Não") ? "var(--danger)" : "var(--primary)" }}>
              {aviso}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: 18 }}>
            <Link to="/alterar-senha" className="btn-login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "var(--input-bg)", color: "var(--text)", textDecoration: "none", border: "1px solid var(--border)" }}>
              <KeyRound size={16} /> Alterar senha
            </Link>
            <button className="btn-login" onClick={sair} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <LogOut size={16} /> Sair da conta
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}