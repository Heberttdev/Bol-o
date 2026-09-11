import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { KeyRound } from "lucide-react";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setMensagem("");
    setCarregando(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSucesso(true);
      setMensagem("Enviamos um link de recuperação para o seu e-mail.");
    } catch (error) {
      setSucesso(false);
      const msg =
        {
          "auth/user-not-found": "Não encontramos uma conta com esse e-mail.",
          "auth/invalid-email": "Informe um e-mail válido.",
          "auth/missing-email": "Informe seu e-mail.",
        }[error.code] ||
        "Não foi possível enviar. Tente novamente.";
      setMensagem(msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card-bet">
        <div className="login-header">
          <h1><KeyRound size={26} /> Recuperar Senha</h1>
          <p>Digite seu e-mail e enviamos um link para redefinir a senha</p>
        </div>

        <form onSubmit={enviar} className="login-form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            disabled={carregando}
          />
          <button type="submit" className="btn-login" disabled={carregando}>
            {carregando ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        <div className="login-footer" style={{ textAlign: "center" }}>
          <Link to="/">← Voltar ao login</Link>
        </div>

        {mensagem && (
          <p className={sucesso ? "login-success" : "login-error"}>{mensagem}</p>
        )}
      </div>
    </div>
  );
}