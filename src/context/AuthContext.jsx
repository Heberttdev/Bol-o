import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, database } from "../services/firebase";
import { salvarPerfilPublico } from "../utils/perfilPublico";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      .then((snap) => (snap.exists() ? salvarPerfilPublico(user.uid, snap.val()) : null))
      .catch(() => {});
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}