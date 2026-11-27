import { describe, it, expect } from "vitest";
import { calcularPontuacao } from "./calcularPontuacao";

describe("calcularPontuacao", () => {
  it("placar exato vale 10", () => {
    expect(calcularPontuacao({ casa: 2, fora: 1 }, { casa: 2, fora: 1 })).toBe(10);
    expect(calcularPontuacao({ casa: 0, fora: 0 }, { casa: 0, fora: 0 })).toBe(10);
  });

  it("vencedor certo vale 5", () => {
    expect(calcularPontuacao({ casa: 3, fora: 0 }, { casa: 1, fora: 0 })).toBe(5);
    expect(calcularPontuacao({ casa: 0, fora: 2 }, { casa: 1, fora: 4 })).toBe(5);
  });

  it("empate certo com placar diferente vale 5", () => {
    expect(calcularPontuacao({ casa: 1, fora: 1 }, { casa: 2, fora: 2 })).toBe(5);
  });

  it("erro vale 0", () => {
    expect(calcularPontuacao({ casa: 2, fora: 0 }, { casa: 0, fora: 1 })).toBe(0);
    expect(calcularPontuacao({ casa: 1, fora: 1 }, { casa: 1, fora: 0 })).toBe(0);
  });

  it("sem palpite ou sem resultado vale 0", () => {
    expect(calcularPontuacao(null, { casa: 1, fora: 0 })).toBe(0);
    expect(calcularPontuacao({ casa: 1, fora: 0 }, undefined)).toBe(0);
  });
});
