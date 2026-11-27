import { describe, expect, it } from "vitest";
import { DURACAO_JOGO_MS, instanteTrava, jogoTravado, obterStatusJogo, STATUS_JOGO } from "./jogo";

const data = "2026-11-24T17:00:00-03:00";
const inicio = new Date(data).getTime();

describe("instanteTrava", () => {
  it("usa lockAt quando houver", () => {
    expect(instanteTrava({ data, lockAt: inicio - 60000 })).toBe(inicio - 60000);
  });
  it("cai para o início do jogo e devolve null sem data", () => {
    expect(instanteTrava({ data })).toBe(inicio);
    expect(instanteTrava({})).toBeNull();
  });
});

describe("jogoTravado", () => {
  it("aceita Date ou número", () => {
    expect(jogoTravado({ data }, inicio - 1)).toBe(false);
    expect(jogoTravado({ data }, new Date(inicio))).toBe(true);
    expect(jogoTravado({}, inicio)).toBe(false);
  });
});

describe("obterStatusJogo", () => {
  it("segue resultado, início e duração", () => {
    expect(obterStatusJogo({ data }, { casa: 1, fora: 0 }, inicio - 1)).toBe(STATUS_JOGO.ENCERRADO);
    expect(obterStatusJogo({ data }, null, new Date(inicio - 1))).toBe(STATUS_JOGO.ABERTO);
    expect(obterStatusJogo({ data }, null, inicio)).toBe(STATUS_JOGO.EM_ANDAMENTO);
    expect(obterStatusJogo({ data }, null, inicio + DURACAO_JOGO_MS)).toBe(STATUS_JOGO.ENCERRADO);
    expect(obterStatusJogo({}, null, inicio)).toBe(STATUS_JOGO.ABERTO);
  });
});
