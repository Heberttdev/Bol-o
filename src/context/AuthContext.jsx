import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, database } from "../services/firebase";
import { salvarPerfilPublico, fotoSegura } from "../utils/perfilPublico";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [papel, setPapel] = useState(null);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).then(() => {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
      return unsub;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    get(ref(database, `users/${user.uid}`))
      .then((snap) => {
        setPapel({ uid: user.uid, role: snap.exists() && snap.val().role === "admin" ? "admin" : "user" });
        if (!snap.exists()) return null;
        const dados = snap.val();
        setPerfil({
          nome: String(dados.nome || "").trim() || null,
          fotoUrl: fotoSegura(dados.photoURL) || fotoSegura(dados.fotoUrl),
        });
        return salvarPerfilPublico(user.uid, dados);
      })
      .catch(() => setPapel({ uid: user.uid, role: "user" }));
  }, [user]);

  const perfilAtual = user ? perfil : null;
  const role = user && papel?.uid === user.uid ? papel.role : null;
  const isAdmin = role === "admin";
  const verificandoPapel = Boolean(user) && role === null;

  return (
    <AuthContext.Provider value={{ user, loading, perfil: perfilAtual, isAdmin, verificandoPapel }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}