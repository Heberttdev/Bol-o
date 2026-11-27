import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, Crown, Flag, Loader2, RefreshCw } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { carregarPlanosArquivamento, executarArquivamento } from "../services/temporadas";
import { plural, formatarPontos } from "../utils/texto";
import Card from "./ui/Card";
import Button from "./ui/Button";

function nomesDosCampeoes(temporada) {
  const ids = new Set(temporada?.campeoes || []);
  return (temporada?.ranking || []).filter((r) => ids.has(r.uid));
}

function CartaoCampeonato({ plano, ocupado, onFinalizar }) {
  const { resumo, temporada } = plano;
  const campeoes = nomesDosCampeoes(temporada);
  const pronto = resumo.semResultado === 0;
  return (
    <Card as="article" className="temporada-admin">
      <h3 className="linha-icone temporada-titulo">
        <Flag size={18} /> {temporada.nome}
      </h3>
      <p className="temporada-meta">
        {plural(resumo.totalJogos, "jogo", "jogos")} · {plural(resumo.totalResultados, "resultado lançado", "resultados lançados")} ·{" "}
        {plural(resumo.participantes, "participante", "participantes")}
      </p>
      {campeoes.length > 0 ? (
        <p className="temporada-campeao linha-icone">
          <Crown size={16} /> {pronto ? (campeoes.length > 1 ? "Campeões" : "Campeão") : "Líder"}:{" "}
          {campeoes.map((c) => c.nome).join(", ")} · {formatarPontos(campeoes[0].pontos)}
        </p>
      ) : (
        <p className="temporada-meta">Ninguém pontuou neste campeonato ainda.</p>
      )}
      {!pronto && (
        <p className="temporada-aviso">
          {plural(resumo.semResultado, "jogo ainda está sem resultado", "jogos ainda estão sem resultado")}. Lance todos antes de
          finalizar.
        </p>
      )}
      <Button
        variant="secondary"
        tom={pronto ? undefined : "perigo"}
        icone={ocupado ? <Loader2 size={16} className="spin" /> : <Archive size={16} />}
        disabled={ocupado}
        onClick={() => onFinalizar(plano)}
      >
        {ocupado ? "Finalizando..." : `Finalizar ${temporada.competicao}`}
      </Button>
    </Card>
  );
}

export default function AdminTemporadas({ exibirToast }) {
  const { enviarNotificacao } = useNotifications();
  const [planos, setPlanos] = useState(null);
  const [finalizando, setFinalizando] = useState(null);
  const toastRef = useRef(exibirToast);
  useEffect(() => {
    toastRef.current = exibirToast;
  }, [exibirToast]);

  const carregar = useCallback(() => {
    carregarPlanosArquivamento().then(
      (lista) => setPlanos(lista.filter((p) => p.id)),
      (erro) => {
        console.error("Erro ao carregar campeonatos:", erro);
        toastRef.current("Erro ao carregar campeonatos: " + erro.message, "error");
        setPlanos([]);
      }
    );
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function finalizar(plano) {
    if (finalizando) return;
    const { temporada, resumo } = plano;
    const campeoes = nomesDosCampeoes(temporada);
    const textoCampeao = campeoes.length
      ? `${campeoes.length > 1 ? "Campeões (empate)" : "Campeão"}: ${campeoes.map((c) => c.nome).join(", ")} com ${formatarPontos(campeoes[0].pontos)}.`
      : "Ninguém pontuou: o campeonato fica sem campeão.";
    const aviso = resumo.semResultado
      ? `\n\n⚠️ ${plural(resumo.semResultado, "jogo ainda está sem resultado e vai", "jogos ainda estão sem resultado e vão")} para o arquivo sem pontuar.`
      : "";
    const ok = window.confirm(
      `Finalizar ${temporada.nome}?\n\n${textoCampeao}\n\n` +
        `${plural(resumo.totalJogos, "jogo", "jogos")} e os palpites de ${plural(resumo.participantes, "participante", "participantes")} saem do ranking ativo e ficam em "Temporadas". Os outros campeonatos continuam. Todos recebem uma notificação com o resultado.${aviso}\n\nNão dá para desfazer pelo app. Continuar?`
    );
    if (!ok) return;
    setFinalizando(plano.id);
    try {
      await executarArquivamento(plano);
      if (campeoes.length) {
        await enviarNotificacao({
          titulo: `🏆 ${temporada.nome} encerrado`,
          corpo: `${textoCampeao} Veja a classificação final.`,
          tipo: "geral",
          link: "/temporadas",
        }).catch((erro) => console.error("Erro ao notificar campeão:", erro));
      }
      exibirToast(`🏆 ${temporada.nome} finalizado.`, "success");
      carregar();
    } catch (erro) {
      console.error(erro);
      exibirToast("Erro ao finalizar: " + erro.message, "error");
    } finally {
      setFinalizando(null);
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <h3 className="linha-icone">
          <Archive size={18} /> Finalizar campeonatos
        </h3>
        <Button variant="ghost" icone={<RefreshCw size={16} />} onClick={carregar} disabled={!!finalizando}>
          Atualizar
        </Button>
      </div>
      <p className="temporada-meta temporada-ajuda">
        Cada campeonato tem o próprio campeão, contado só com os jogos dele. Ao finalizar, ele sai do ranking geral e vai para a
        tela Temporadas. Finalize antes de importar a temporada seguinte.
      </p>

      {planos === null ? (
        <p className="linha-icone temporada-meta">
          <Loader2 size={16} className="spin" /> Carregando campeonatos...
        </p>
      ) : planos.length === 0 ? (
        <Card className="bolao-vazio">
          <Archive size={32} aria-hidden="true" />
          <p>Nenhum campeonato em andamento.</p>
        </Card>
      ) : (
        <div className="lista-boloes">
          {planos.map((p) => (
            <CartaoCampeonato key={p.id} plano={p} ocupado={finalizando === p.id} onFinalizar={finalizar} />
          ))}
        </div>
      )}
    </>
  );
}
