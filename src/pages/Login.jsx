import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, database } from "../services/firebase";
import { ref, get, set } from "firebase/database";
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

  // Inicializa o plugin uma vez
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
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate("/dashboard");
    } catch (error) {
      setMensagem("Email ou senha inválidos");
    }
  };

 const loginGoogle = async () => {
  try {
    // Login Google nativo
    const result = await GoogleAuth.signIn();

    console.log("GOOGLE:", result);

    // Cria credencial Firebase
    const credential = GoogleAuthProvider.credential(
      result.authentication.idToken
    );

    // Login Firebase
    const userCredential = await signInWithCredential(
      auth,
      credential
    );

    const firebaseUser = userCredential.user;

    console.log("FIREBASE:", firebaseUser);

    // Salva usuário no banco
    const userRef = ref(database, `users/${firebaseUser.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        nome: firebaseUser.displayName,
        email: firebaseUser.email,
        role: "user",
        createdAt: Date.now(),
      });
    }

    navigate("/dashboard");

  } catch (error) {
    console.error("ERRO FIREBASE:", error);

    alert(
      error.code ||
      error.message ||
      JSON.stringify(error)
    );
  }
};

  return (
    <div className="login-bg">
      <div className="login-card-bet">
        <div className="login-header">
          <h1>🏆 Bolão Chamar o Green</h1>
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
          />

          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            required
          />

          <button type="submit" className="btn-login">
            Entrar
          </button>
        </form>

        <button onClick={loginGoogle} className="btn-google">
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          Entrar com Google
        </button>

        <div className="login-footer">
          <Link to="/cadastro">Criar conta</Link>
        </div>

        {mensagem && <p className="login-error">{mensagem}</p>}
      </div>
    </div>
  );
}
