import { describe, it, expect } from "vitest";
import { plural, formatarPosicao, formatarPontos } from "./texto";

describe("plural", () => {
  it("usa singular só para 1", () => {
    expect(plural(1, "placar exato", "placares exatos")).toBe("1 placar exato");
    expect(plural(26, "placar exato", "placares exatos")).toBe("26 placares exatos");
    expect(plural(0, "palpite", "palpites")).toBe("0 palpites");
  });
});

describe("formatarPosicao", () => {
  it("usa a notação 3º", () => {
    expect(formatarPosicao(3)).toBe("3º");
    expect(formatarPosicao("12")).toBe("12º");
  });

  it("sem posição válida mostra traço", () => {
    expect(formatarPosicao(null)).toBe("–");
    expect(formatarPosicao("-")).toBe("–");
    expect(formatarPosicao(0)).toBe("–");
  });
});

describe("formatarPontos", () => {
  it("1 pt, demais pts", () => {
    expect(formatarPontos(1)).toBe("1 pt");
    expect(formatarPontos(0)).toBe("0 pts");
    expect(formatarPontos(15)).toBe("15 pts");
  });
});
