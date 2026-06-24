import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "../services/firebase";

export default function Cadastro() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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

      await set(ref(database, `users/${user.uid}`), {
        nome,
        email,
        role: "user",
        createdAt: Date.now(),
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