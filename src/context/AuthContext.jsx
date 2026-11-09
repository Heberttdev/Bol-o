import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, database } from "../services/firebase";
import { salvarPerfilPublico, fotoSegura } from "../utils/perfilPublico";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Nome/foto do próprio perfil (users/{uid}) — mesma leitura que já existia abaixo.
  const [perfil, setPerfil] = useState(null);

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
        if (!snap.exists()) return null;
        const dados = snap.val();
        setPerfil({
          nome: String(dados.nome || "").trim() || null,
          fotoUrl: fotoSegura(dados.photoURL) || fotoSegura(dados.fotoUrl),
        });
        return salvarPerfilPublico(user.uid, dados);
      })
      .catch(() => {});
  }, [user]);

  const perfilAtual = user ? perfil : null;

  return (
    <AuthContext.Provider value={{ user, loading, perfil: perfilAtual }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}