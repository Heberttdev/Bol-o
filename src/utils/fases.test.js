import { describe, it, expect } from "vitest";
import { competicaoDaFase, nomeCurtoDaFase, ordenarFases, fasesAtuaisPorCompeticao } from "./fases";

describe("fases", () => {
  it("separa competição da rodada", () => {
    expect(competicaoDaFase("Série A - Rodada 31")).toBe("Série A");
    expect(competicaoDaFase("Liga dos Campeões - Rodada 2")).toBe("Liga dos Campeões");
    expect(competicaoDaFase("Fase Final")).toBe("Fase Final");
    expect(competicaoDaFase("")).toBe("Outros");
  });

  it("encurta o nome da rodada", () => {
    expect(nomeCurtoDaFase("Série B - Rodada 34")).toBe("Rodada 34");
    expect(nomeCurtoDaFase("Fase Final")).toBe("Fase Final");
  });

  it("ordena fases pela data do primeiro jogo", () => {
    const jogos = [
      { fase: "Série A - Rodada 2", data: "2026-10-10T16:00:00-03:00" },
      { fase: "Série A - Rodada 1", data: "2026-10-03T16:00:00-03:00" },
      { fase: "Série A - Rodada 2", data: "2026-10-09T16:00:00-03:00" },
    ];
    expect(ordenarFases(jogos)).toEqual(["Série A - Rodada 1", "Série A - Rodada 2"]);
  });

  it("acha a rodada atual de cada competição", () => {
    const agora = new Date("2026-10-19T12:00:00-03:00");
    const jogos = [
      { fase: "Série A - Rodada 31", data: "2026-10-18T16:00:00-03:00" },
      { fase: "Série A - Rodada 32", data: "2026-10-22T20:00:00-03:00" },
      { fase: "Série B - Rodada 35", data: "2026-10-21T19:00:00-03:00" },
    ];
    expect(fasesAtuaisPorCompeticao(jogos, agora)).toEqual({
      "Série A": "Série A - Rodada 32",
      "Série B": "Série B - Rodada 35",
    });
  });
});
