import { describe, expect, it } from "vitest";
import {
  campeoesDaClassificacao,
  colisoesDeTemporada,
  competicaoDoJogo,
  competicoesEmAndamento,
  planejarArquivamento,
  planejarTodas,
} from "./temporada";

const jogos = {
  "seriea-r1-a-b": { id: "seriea-r1-a-b", fase: "Série A - Rodada 1", data: "2026-04-01T16:00:00-03:00" },
  "serieb-r1-c-d": { id: "serieb-r1-c-d", fase: "Série B - Rodada 1", data: "2026-04-02T16:00:00-03:00" },
  "seriea-r38-e-f": { id: "seriea-r38-e-f", fase: "Série A - Rodada 38", data: "2026-12-06T16:00:00-03:00" },
  "ucl-20260908-x-y": { id: "ucl-20260908-x-y", fase: "Liga dos Campeões - Rodada 1", data: "2026-09-08T16:00:00-03:00" },
  "ucl-20270129-z-w": { id: "ucl-20270129-z-w", fase: "Liga dos Campeões - Rodada 8", data: "2027-01-29T16:00:00-03:00" },
};
const resultados = {
  "seriea-r1-a-b": { casa: 2, fora: 1 },
  "serieb-r1-c-d": { casa: 0, fora: 0 },
  "20260816-legado-jogo": { casa: 1, fora: 0 },
  "ucl-20260908-x-y": { casa: 3, fora: 0 },
};
const bets = {
  ana: {
    "seriea-r1-a-b": { casa: 2, fora: 1 },
    "20260816-legado-jogo": { casa: 2, fora: 0 },
    "ucl-20260908-x-y": { casa: 3, fora: 0 },
  },
  beto: { "serieb-r1-c-d": { casa: 0, fora: 0 }, "seriea-r38-e-f": { casa: 1, fora: 1 } },
  caio: { "ucl-20260908-x-y": { casa: 1, fora: 0 } },
};
const perfis = { ana: { nome: "Ana" }, beto: { nome: "Beto", photoURL: "https://f/b.png" }, caio: { nome: "Caio" } };
const dados = { jogos, resultados, bets, perfis };

describe("competicaoDoJogo", () => {
  it("usa a fase e, sem jogo, o prefixo do ID", () => {
    expect(competicaoDoJogo("x", { fase: "Série B - Rodada 3" })).toBe("Série B");
    expect(competicaoDoJogo("seriea-r1-a-b")).toBe("Série A");
    expect(competicaoDoJogo("ucl-20260908-x-y")).toBe("Liga dos Campeões");
    expect(competicaoDoJogo("20261026-coritiba-grmio")).toBe("Série A");
    expect(competicaoDoJogo("qualquer")).toBeNull();
  });
});

describe("competicoesEmAndamento", () => {
  it("lista na ordem fixa", () => {
    expect(competicoesEmAndamento(dados)).toEqual(["Série A", "Série B", "Liga dos Campeões"]);
  });
});

describe("planejarArquivamento", () => {
  const serieA = planejarArquivamento({ ...dados, competicao: "Série A" });

  it("nomeia pelo campeonato e pelo ano", () => {
    expect(serieA.id).toBe("seriea-2026");
    expect(serieA.temporada.nome).toBe("Série A 2026");
    expect(serieA.resumo).toEqual({ totalJogos: 2, totalResultados: 2, semResultado: 1, participantes: 2 });
  });

  it("classifica só com os jogos do campeonato", () => {
    expect(serieA.temporada.ranking).toEqual([
      { uid: "ana", nome: "Ana", pontos: 15, exatos: 1, palpites: 2 },
      { uid: "beto", nome: "Beto", photoURL: "https://f/b.png", pontos: 0, exatos: 0, palpites: 1 },
    ]);
    expect(serieA.temporada.campeoes).toEqual(["ana"]);

    const serieB = planejarArquivamento({ ...dados, competicao: "Série B" });
    expect(serieB.temporada.ranking.map((r) => [r.uid, r.pontos])).toEqual([["beto", 10]]);
    expect(serieB.temporada.campeoes).toEqual(["beto"]);
  });

  it("remove do ativo só o campeonato encerrado", () => {
    expect(serieA.remocoes).toMatchObject({
      "jogos/seriea-r1-a-b": null,
      "resultados/20260816-legado-jogo": null,
      "bets/ana/seriea-r1-a-b": null,
      "palpitesPorJogo/seriea-r38-e-f": null,
    });
    const caminhos = Object.keys(serieA.remocoes);
    expect(caminhos.some((c) => c.includes("ucl-") || c.includes("serieb-"))).toBe(false);
    expect(serieA.arquivo.bets.ana).not.toHaveProperty("ucl-20260908-x-y");
    expect(serieA.arquivo.resultados["20260816-legado-jogo"]).toEqual({ casa: 1, fora: 0 });
  });

  it("temporada que vira o ano leva os dois anos", () => {
    const ucl = planejarArquivamento({ ...dados, competicao: "Liga dos Campeões" });
    expect(ucl.id).toBe("champions-2026-27");
    expect(ucl.temporada.nome).toBe("Liga dos Campeões 2026/27");
    expect(ucl.temporada.campeoes).toEqual(["ana"]);
  });

  it("sem jogos do campeonato não gera temporada", () => {
    const vazio = planejarArquivamento({ jogos: { "ucl-1": jogos["ucl-20260908-x-y"] }, competicao: "Série A" });
    expect(vazio.id).toBeNull();
    expect(vazio.temporada).toBeNull();
  });
});

describe("planejarTodas", () => {
  it("gera um plano por campeonato", () => {
    expect(planejarTodas(dados).map((p) => p.id)).toEqual(["seriea-2026", "serieb-2026", "champions-2026-27"]);
  });
});

describe("campeoesDaClassificacao", () => {
  it("empate em pontos e exatos divide o título", () => {
    const ranking = [
      { uid: "a", pontos: 20, exatos: 1 },
      { uid: "b", pontos: 20, exatos: 1 },
      { uid: "c", pontos: 20, exatos: 0 },
    ];
    expect(campeoesDaClassificacao(ranking).map((r) => r.uid)).toEqual(["a", "b"]);
  });

  it("ninguém pontuou: sem campeão", () => {
    expect(campeoesDaClassificacao([{ uid: "a", pontos: 0, exatos: 0 }])).toEqual([]);
  });
});

describe("colisoesDeTemporada", () => {
  it("aponta ID existente com data de outro ano", () => {
    const novos = [
      { id: "seriea-r1-a-b", data: "2027-04-01T16:00:00-03:00" },
      { id: "seriea-r1-novo", data: "2027-04-01T16:00:00-03:00" },
      { id: "serieb-r1-c-d", data: "2026-04-03T16:00:00-03:00" },
    ];
    expect(colisoesDeTemporada(jogos, novos).map((n) => n.id)).toEqual(["seriea-r1-a-b"]);
  });
});
