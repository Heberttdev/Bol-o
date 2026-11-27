import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, CheckCircle2, Crown, Flag, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { carregarPlanosArquivamento, finalizarCampeonato, limparDoRanking } from "../services/temporadas";
import { plural, formatarPontos } from "../utils/texto";
import Card from "./ui/Card";
import Button from "./ui/Button";

function campeoesDe(temporada) {
  const ranking = Array.isArray(temporada?.ranking) ? temporada.ranking : Object.values(temporada?.ranking || {});
  const ids = new Set(Array.isArray(temporada?.campeoes) ? temporada.campeoes : Object.values(temporada?.campeoes || {}));
  return ranking.filter((r) => ids.has(r.uid));
}

function textoCampeoes(campeoes) {
  if (!campeoes.length) return "Ninguém pontuou: o campeonato fica sem campeão.";
  const rotulo = campeoes.length > 1 ? "Campeões (empate)" : "Campeão";
  return `${rotulo}: ${campeoes.map((c) => c.nome).join(", ")} com ${formatarPontos(campeoes[0].pontos)}.`;
}

function LinhaCampeao({ campeoes, rotulo }) {
  if (!campeoes.length) return <p className="temporada-meta">Ninguém pontuou neste campeonato ainda.</p>;
  return (
    <p className="temporada-campeao linha-icone">
      <Crown size={16} /> {rotulo}: {campeoes.map((c) => c.nome).join(", ")} · {formatarPontos(campeoes[0].pontos)}
    </p>
  );
}

function CartaoCampeonato({ plano, ocupado, onFinalizar, onLimpar }) {
  const { resumo, temporada, finalizada } = plano;
  const pronto = resumo.semResultado === 0;
  const icone = (padrao) => (ocupado ? <Loader2 size={16} className="spin" /> : padrao);

  if (finalizada) {
    const campeoes = campeoesDe(finalizada);
    return (
      <Card as="article" className="temporada-admin">
        <h3 className="linha-icone temporada-titulo">
          <CheckCircle2 size={18} /> {finalizada.nome}
        </h3>
        <p className="temporada-meta">
          Finalizado em {new Date(finalizada.arquivadoEm).toLocaleDateString("pt-BR")} · os pontos continuam no Ranking Geral
        </p>
        <LinhaCampeao campeoes={campeoes} rotulo={campeoes.length > 1 ? "Campeões" : "Campeão"} />
        <Button variant="ghost" tom="perigo" icone={icone(<Trash2 size={16} />)} disabled={ocupado} onClick={() => onLimpar(plano)}>
          {ocupado ? "Removendo..." : "Tirar do ranking (virada de temporada)"}
        </Button>
      </Card>
    );
  }

  const campeoes = campeoesDe(temporada);
  return (
    <Card as="article" className="temporada-admin">
      <h3 className="linha-icone temporada-titulo">
        <Flag size={18} /> {temporada.nome}
      </h3>
      <p className="temporada-meta">
        {plural(resumo.totalJogos, "jogo", "jogos")} · {plural(resumo.totalResultados, "resultado lançado", "resultados lançados")} ·{" "}
        {plural(resumo.participantes, "participante", "participantes")}
      </p>
      <LinhaCampeao campeoes={campeoes} rotulo={pronto ? (campeoes.length > 1 ? "Campeões" : "Campeão") : "Líder"} />
      {!pronto && (
        <p className="temporada-aviso">
          {plural(resumo.semResultado, "jogo ainda está sem resultado", "jogos ainda estão sem resultado")}. Lance todos antes de
          finalizar.
        </p>
      )}
      <Button
        variant="secondary"
        tom={pronto ? undefined : "perigo"}
        icone={icone(<Archive size={16} />)}
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
  const [ocupado, setOcupado] = useState(null);
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

  async function executar(plano, acao, sucesso) {
    if (ocupado) return;
    setOcupado(plano.id);
    try {
      await acao();
      exibirToast(sucesso, "success");
      carregar();
    } catch (erro) {
      console.error(erro);
      exibirToast("Erro: " + erro.message, "error");
    } finally {
      setOcupado(null);
    }
  }

  function finalizar(plano) {
    const { temporada, resumo } = plano;
    const campeoes = campeoesDe(temporada);
    const texto = textoCampeoes(campeoes);
    const aviso = resumo.semResultado
      ? `\n\n⚠️ ${plural(resumo.semResultado, "jogo ainda está sem resultado e não conta", "jogos ainda estão sem resultado e não contam")} para a classificação final.`
      : "";
    const ok = window.confirm(
      `Finalizar ${temporada.nome}?\n\n${texto}\n\n` +
        `A classificação final vai para "Temporadas" e todos recebem uma notificação com o resultado. Os pontos continuam no Ranking Geral até a virada de temporada.${aviso}\n\nContinuar?`
    );
    if (!ok) return;
    executar(
      plano,
      async () => {
        await finalizarCampeonato(plano);
        if (campeoes.length) {
          await enviarNotificacao({
            titulo: `🏆 ${temporada.nome} encerrado`,
            corpo: `${texto} Veja a classificação final.`,
            tipo: "geral",
            link: "/temporadas",
          }).catch((erro) => console.error("Erro ao notificar campeão:", erro));
        }
      },
      `🏆 ${temporada.nome} finalizado.`
    );
  }

  function limpar(plano) {
    const { resumo } = plano;
    const nome = plano.finalizada?.nome || plano.temporada.nome;
    const ok = window.confirm(
      `Tirar ${nome} do ranking?\n\n` +
        `${plural(resumo.totalJogos, "jogo", "jogos")} e os palpites de ${plural(resumo.participantes, "participante", "participantes")} saem do Ranking Geral. A classificação final continua em "Temporadas" e uma cópia completa fica guardada no banco.\n\nFaça isso só na virada de temporada, antes de importar os jogos novos. Não dá para desfazer pelo app. Continuar?`
    );
    if (!ok) return;
    executar(plano, () => limparDoRanking(plano), `🗄️ ${nome} removido do ranking ativo.`);
  }

  return (
    <>
      <div className="admin-toolbar">
        <h3 className="linha-icone">
          <Archive size={18} /> Finalizar campeonatos
        </h3>
        <Button variant="ghost" icone={<RefreshCw size={16} />} onClick={carregar} disabled={!!ocupado}>
          Atualizar
        </Button>
      </div>
      <p className="temporada-meta temporada-ajuda">
        Cada campeonato tem o próprio campeão, contado só com os jogos dele. Finalizar registra o campeão em Temporadas e os pontos
        continuam no Ranking Geral. Na virada do ano, antes de importar a temporada nova, use "Tirar do ranking".
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
            <CartaoCampeonato key={p.id} plano={p} ocupado={ocupado === p.id} onFinalizar={finalizar} onLimpar={limpar} />
          ))}
        </div>
      )}
    </>
  );
}
