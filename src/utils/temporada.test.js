import { describe, expect, it } from "vitest";
import { colisoesDeTemporada, ehJogoDoBrasileirao, planejarArquivamento } from "./temporada";

const jogos = {
  "seriea-r1-a-b": { id: "seriea-r1-a-b", fase: "Série A - Rodada 1", data: "2026-04-01T16:00:00-03:00" },
  "serieb-r1-c-d": { id: "serieb-r1-c-d", fase: "Série B - Rodada 1", data: "2026-04-02T16:00:00-03:00" },
  "seriea-r38-e-f": { id: "seriea-r38-e-f", fase: "Série A - Rodada 38", data: "2026-12-06T16:00:00-03:00" },
  "ucl-20260908-x-y": { id: "ucl-20260908-x-y", fase: "Liga dos Campeões - Rodada 1", data: "2026-09-08T16:00:00-03:00" },
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

describe("ehJogoDoBrasileirao", () => {
  it("reconhece Série A/B, legado com data e ignora Champions", () => {
    expect(ehJogoDoBrasileirao("x", { fase: "Série B - Rodada 3" })).toBe(true);
    expect(ehJogoDoBrasileirao("seriea-r1-a-b")).toBe(true);
    expect(ehJogoDoBrasileirao("20261026-coritiba-grmio")).toBe(true);
    expect(ehJogoDoBrasileirao("ucl-20260908-x-y")).toBe(false);
    expect(ehJogoDoBrasileirao("x", { fase: "Liga dos Campeões - Rodada 1" })).toBe(false);
  });
});

describe("planejarArquivamento", () => {
  const plano = planejarArquivamento({ jogos, resultados, bets, perfis });

  it("nomeia pela temporada e resume o que vai para o arquivo", () => {
    expect(plano.id).toBe("brasileirao-2026");
    expect(plano.temporada.nome).toBe("Brasileirão 2026");
    expect(plano.resumo).toEqual({ totalJogos: 3, totalResultados: 3, semResultado: 1, participantes: 2 });
  });

  it("classifica só com jogos do Brasileirão", () => {
    expect(plano.temporada.ranking).toEqual([
      { uid: "ana", nome: "Ana", pontos: 15, exatos: 1, palpites: 2 },
      { uid: "beto", nome: "Beto", photoURL: "https://f/b.png", pontos: 10, exatos: 1, palpites: 2 },
    ]);
  });

  it("remove do ativo só o Brasileirão e guarda cópia completa", () => {
    expect(plano.remocoes).toMatchObject({
      "jogos/seriea-r1-a-b": null,
      "resultados/20260816-legado-jogo": null,
      "bets/ana/seriea-r1-a-b": null,
      "palpitesPorJogo/seriea-r38-e-f": null,
    });
    const caminhos = Object.keys(plano.remocoes);
    expect(caminhos.some((c) => c.includes("ucl-"))).toBe(false);
    expect(plano.arquivo.bets.ana).not.toHaveProperty("ucl-20260908-x-y");
    expect(plano.arquivo.resultados["20260816-legado-jogo"]).toEqual({ casa: 1, fora: 0 });
  });

  it("sem jogos do Brasileirão não gera temporada", () => {
    const vazio = planejarArquivamento({ jogos: { "ucl-1": jogos["ucl-20260908-x-y"] } });
    expect(vazio.id).toBeNull();
    expect(vazio.temporada).toBeNull();
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
