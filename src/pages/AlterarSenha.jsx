import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { auth } from "../services/firebase";
import Layout from "../components/Layout";

export default function AlterarSenha() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const contaGoogle =
    user?.providerData?.some((p) => p.providerId === "google.com");

  const alterar = async (e) => {
    e.preventDefault();
    setMensagem("");

    if (novaSenha.length < 6) {
      setMensagem("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setMensagem("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      if (!user?.email) throw { code: "auth/no-email" };

      const credential = EmailAuthProvider.credential(
        user.email,
        senhaAtual
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, novaSenha);

      setSucesso(true);
      setMensagem("Senha alterada com sucesso!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      setSucesso(false);
      const msg =
        {
          "auth/no-email": "Conta sem e-mail. Não é possível alterar a senha.",
          "auth/wrong-password": "Senha atual incorreta.",
          "auth/invalid-credential": "Senha atual incorreta.",
          "auth/weak-password":
            "A nova senha é muito fraca (mínimo 6 caracteres).",
          "auth/requires-recent-login":
            "Faça login novamente antes de alterar a senha.",
        }[error.code] ||
        error.message ||
        "Não foi possível alterar a senha.";
      setMensagem(msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "24px" }}>
        <div className="login-card-bet">
          <div className="login-header">
            <h1>🔒 Alterar Senha</h1>
            <p>Confirme sua senha atual para criar uma nova</p>
          </div>

          {contaGoogle ? (
            <p className="login-error">
              Esta conta foi criada com o Google — a senha é gerenciada pela própria conta Google.
            </p>
          ) : (
            <form onSubmit={alterar} className="login-form">
              <label>Senha atual</label>
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="••••••••"
                required
                disabled={carregando}
              />

              <label>Nova senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Nova senha"
                required
                disabled={carregando}
              />

              <label>Confirmar nova senha</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita a nova senha"
                required
                disabled={carregando}
              />

              <button type="submit" className="btn-login" disabled={carregando}>
                {carregando ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}

          <div className="login-footer" style={{ textAlign: "center" }}>
            <Link to="/dashboard">← Voltar ao início</Link>
          </div>

          {mensagem && (
            <p className={sucesso ? "login-success" : "login-error"}>{mensagem}</p>
          )}
        </div>
      </div>
    </Layout>
  );
}