import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import Layout from "../components/Layout";

// Rota coringa (path="*") para usuários logados: mantém header e barra inferior.
export default function NaoEncontrada() {
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="nao-encontrada">
        <Compass size={40} aria-hidden="true" className="nao-encontrada-icone" />
        <h1 className="nao-encontrada-titulo">Página não encontrada</h1>
        <p className="nao-encontrada-texto">O endereço que você abriu não existe ou mudou de lugar.</p>
        <button type="button" className="nao-encontrada-btn" onClick={() => navigate("/dashboard", { replace: true })}>
          Voltar ao início
        </button>
      </section>
    </Layout>
  );
}
