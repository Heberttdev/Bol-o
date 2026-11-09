import { describe, it, expect } from "vitest";
import { calcularRankingBolao } from "./rankingBolaoEspecial";
import { montarPerfilPublico, fotoSegura } from "./perfilPublico";

describe("calcularRankingBolao", () => {
  it("soma pontos só dos jogos com resultado e ordena", () => {
    const bolao = {
      participantes: { u1: { nome: "Ana" }, u2: { nome: "Bia" }, u3: { nome: "Caio" } },
      respostas: { u1: "aceito", u2: "aceito" },
      palpites: {
        u1: { j1: { casa: 1, fora: 0 }, j2: { casa: 2, fora: 2 } },
        u2: { j1: { casa: 2, fora: 0 }, j2: { casa: 0, fora: 3 } },
      },
      resultados: { j1: { casa: 1, fora: 0 } },
    };
    const ranking = calcularRankingBolao(bolao);
    expect(ranking.map((r) => [r.uid, r.pontos])).toEqual([
      ["u1", 10],
      ["u2", 5],
      ["u3", 0],
    ]);
    expect(ranking[2].resposta).toBeNull();
  });

  it("empate em pontos desempata por nome", () => {
    const bolao = { participantes: { b: { nome: "Bruno" }, a: { nome: "Alice" } } };
    expect(calcularRankingBolao(bolao).map((r) => r.nome)).toEqual(["Alice", "Bruno"]);
  });
});

describe("perfilPublico", () => {
  it("só aceita foto https", () => {
    expect(fotoSegura("https://x.com/a.png")).toBe("https://x.com/a.png");
    expect(fotoSegura("http://x.com/a.png")).toBeNull();
    expect(fotoSegura("javascript:alert(1)")).toBeNull();
  });

  it("monta perfil só com nome e foto", () => {
    expect(montarPerfilPublico({ nome: "  Ana  ", email: "a@a.com", role: "admin", photoURL: "https://f/a.png" })).toEqual({
      nome: "Ana",
      photoURL: "https://f/a.png",
    });
    expect(montarPerfilPublico({ nome: "" })).toEqual({ nome: "Jogador" });
  });
});
