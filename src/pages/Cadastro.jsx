import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "../services/firebase";
import { fotoSegura, salvarPerfilPublico } from "../utils/perfilPublico";

export default function Cadastro() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [foto, setFoto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const cadastrar = async (e) => {
    e.preventDefault();

    const fotoLimpa = foto.trim();
    const fotoValida = fotoSegura(fotoLimpa);
    if (fotoLimpa && !fotoValida) {
      setMensagem("O link da foto precisa começar com https://");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        senha
      );

      const user = userCredential.user;

      if (fotoValida) {
        try {
          await updateProfile(user, { photoURL: fotoValida });
        } catch {
          // URL inválida não derruba o cadastro
        }
      }

      const dados = {
        nome: nome.trim().slice(0, 80),
        email,
        role: "user",
        createdAt: Date.now(),
        ...(fotoValida ? { photoURL: fotoValida } : {}),
      };
      await set(ref(database, `users/${user.uid}`), dados);
      await salvarPerfilPublico(user.uid, dados).catch(() => {});

      setMensagem("Cadastro realizado com sucesso!");

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      setMensagem(
        {
          "auth/email-already-in-use": "Este e-mail já está cadastrado.",
          "auth/invalid-email": "Informe um e-mail válido.",
          "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
        }[error?.code] || "Não foi possível criar a conta. Tente novamente."
      );
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

          <label htmlFor="cadastro-campo-1">Nome</label>
          <input id="cadastro-campo-1"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            required
          />

          <label htmlFor="cadastro-campo-2">Email</label>
          <input id="cadastro-campo-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />

          <label htmlFor="cadastro-campo-3">Senha</label>
          <input id="cadastro-campo-3"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            required
          />

          <label htmlFor="cadastro-campo-4">Foto (link) <span style={{ color: "var(--text-soft)", fontSize: "var(--fs-12)" }}>— opcional</span></label>
          <input id="cadastro-campo-4"
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