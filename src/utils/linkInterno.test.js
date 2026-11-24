import { describe, expect, it } from "vitest";
import { linkInterno } from "./linkInterno";

describe("linkInterno", () => {
  it("normaliza rotas conhecidas", () => {
    expect(linkInterno("/jogos")).toBe("/jogos");
    expect(linkInterno("#/ranking")).toBe("/ranking");
    expect(linkInterno("ao-vivo")).toBe("/ao-vivo");
    expect(linkInterno("/jogos?jogo=abc-1")).toBe("/jogos?jogo=abc-1");
  });

  it("recusa externos, desconhecidos e vazios", () => {
    expect(linkInterno("https://evil.com")).toBeNull();
    expect(linkInterno("//evil.com")).toBeNull();
    expect(linkInterno("/admin")).toBeNull();
    expect(linkInterno("/jogos/../admin")).toBeNull();
    expect(linkInterno("javascript:alert(1)")).toBeNull();
    expect(linkInterno("")).toBeNull();
    expect(linkInterno(null)).toBeNull();
  });
});
