import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "../services/firebase";

export default function Cadastro() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [foto, setFoto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const cadastrar = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        senha
      );

      const user = userCredential.user;

      if (foto.trim()) {
        try {
          await updateProfile(user, { photoURL: foto.trim() });
        } catch {
          // URL inválida não derruba o cadastro
        }
      }

      await set(ref(database, `users/${user.uid}`), {
        nome,
        email,
        role: "user",
        createdAt: Date.now(),
        ...(foto.trim() ? { photoURL: foto.trim() } : {}),
      });

      setMensagem("Cadastro realizado com sucesso!");

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      setMensagem(error.message);
    }
  };

  return (
    <div className="login-bg">

      <div className="login-card-bet">

        <div className="login-header">
          <h1>🏆 Criar Conta</h1>
          <p>Entre no jogo e comece a pontuar</p>
        </div>

        <form onSubmit={cadastrar} className="login-form">

          <label>Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            required
          />

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

          <label>Foto (link) <span style={{ color: "var(--text-soft)", fontSize: "0.75rem" }}>— opcional</span></label>
          <input
            type="url"
            value={foto}
            onChange={(e) => setFoto(e.target.value)}
            placeholder="https://exemplo.com/minha-foto.jpg"
          />
          {foto.trim() && (
            <img
              src={foto.trim()}
              alt="Prévia"
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", margin: "4px auto" }}
              onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
              onLoad={(e) => { e.currentTarget.style.visibility = "visible"; }}
            />
          )}

          <button type="submit" className="btn-login">
            Criar conta
          </button>

        </form>

        <div className="login-footer">
          <Link to="/">Já possui conta? Entrar</Link>
        </div>

        {mensagem && (
          <p
            className={
              mensagem.includes("sucesso")
                ? "login-success"
                : "login-error"
            }
          >
            {mensagem}
          </p>
        )}

      </div>

    </div>
  );
}