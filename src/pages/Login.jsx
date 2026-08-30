import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, database } from "../services/firebase";
import { ref, get, set, update } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import {
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import { GoogleAuth } from "@daniele-rolli/capacitor-google-auth";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [entrarLoading, setEntrarLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleAuth.initialize({
      clientId:
        "33072795427-pl4npka5oqms44juodci4grfohqpo65n.apps.googleusercontent.com",
      scopes: ["profile", "email"],
      grantOfflineAccess: true,
    });
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setMensagem("");
    setEntrarLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate("/dashboard");
    } catch {
      setMensagem("Email ou senha inválidos");
    } finally {
      setEntrarLoading(false);
    }
  };

  const loginGoogle = async () => {
    setMensagem("");
    setGoogleLoading(true);
    try {
      const result = await GoogleAuth.signIn();

      const credential = GoogleAuthProvider.credential(
        result.authentication.idToken
      );

      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(userRef, {
          nome: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || null,
          role: "user",
          createdAt: Date.now(),
        });
      } else {
        await update(userRef, {
          photoURL: firebaseUser.photoURL || null,
        });
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("ERRO FIREBASE / GOOGLE AUTH:", error);
      const erroTexto = error?.code || error?.message || "Não foi possível conectar com o Google.";
      setMensagem(erroTexto);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card-bet">
        <div className="login-header">
          <img
            src="/logo-bolao.png"
            alt="Bolão Green"
            style={{ width: "120px", height: "120px", objectFit: "contain", marginBottom: "8px" }}
          />
          <p>Entre e comece a subir no ranking</p>
        </div>

        <form onSubmit={fazerLogin} className="login-form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            disabled={entrarLoading || googleLoading}
          />

          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            required
            disabled={entrarLoading || googleLoading}
          />

          <button type="submit" className="btn-login" disabled={entrarLoading || googleLoading}>
            {entrarLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <button onClick={loginGoogle} className="btn-google" disabled={entrarLoading || googleLoading}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          {googleLoading ? "Conectando..." : "Entrar com Google"}
        </button>

        <div className="login-footer">
          <Link to="/cadastro">Criar conta</Link>
        </div>

        {mensagem && <p className="login-error">{mensagem}</p>}
      </div>
    </div>
  );
}