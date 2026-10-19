import { describe, it, expect } from "vitest";
import { semanaDoJogo, rotuloSemana, montarEvolucao } from "./evolucao";

const agora = Date.parse("2026-10-19T12:00:00-03:00");

describe("semanaDoJogo", () => {
  it("semana vai de segunda a domingo no horário de Brasília", () => {
    expect(semanaDoJogo({ data: "2026-10-18T23:30:00-03:00" })).toBe("2026-10-12");
    expect(semanaDoJogo({ data: "2026-10-19T00:10:00-03:00" })).toBe("2026-10-19");
    expect(semanaDoJogo({ data: "2026-10-25T21:00:00-03:00" })).toBe("2026-10-19");
    expect(semanaDoJogo({ data: "2026-10-26T00:00:00-03:00" })).toBe("2026-10-26");
  });

  it("jogo sem data não tem semana", () => {
    expect(semanaDoJogo({ data: "" })).toBeNull();
    expect(semanaDoJogo({})).toBeNull();
  });
});

describe("rotuloSemana", () => {
  it("usa nomes amigáveis para semana atual e passada", () => {
    expect(rotuloSemana("2026-10-19", agora)).toBe("Esta semana");
    expect(rotuloSemana("2026-10-12", agora)).toBe("Semana passada");
  });

  it("mostra o intervalo para semanas antigas", () => {
    expect(rotuloSemana("2026-10-05", agora)).toBe("Semana 05–11/out");
    expect(rotuloSemana("2026-10-26", agora)).toBe("Semana 26/out–01/nov");
  });
});

describe("montarEvolucao", () => {
  const jogos = [
    { id: "a", fase: "Série A - Rodada 31", data: "2026-10-15T20:00:00-03:00" },
    { id: "b", fase: "Série B - Rodada 34", data: "2026-10-16T19:00:00-03:00" },
    { id: "c", fase: "Série A - Rodada 32", data: "2026-10-22T20:00:00-03:00" },
  ];
  const users = { u1: { nome: "Ana" }, u2: { nome: "Bia" } };
  const bets = {
    u1: { a: { casa: 1, fora: 0 }, b: { casa: 2, fora: 2 } },
    u2: { a: { casa: 0, fora: 1 } },
  };
  const resultados = { a: { casa: 1, fora: 0 }, b: { casa: 1, fora: 1 } };

  it("soma Série A e Série B da mesma semana", () => {
    const ev = montarEvolucao({ users, bets, resultados, jogos, uid: "u1" });
    expect(ev.faseAtual).toBe("2026-10-12");
    expect(ev.pontosFaseAtual).toBe(15);
    expect(ev.posAtual).toBe(1);
  });

  it("calcula a posição geral", () => {
    expect(montarEvolucao({ users, bets, resultados, jogos, uid: "u2" }).posicaoTotal).toBe(2);
  });
});
