import { describe, expect, it } from "vitest";
import { urlDeEmbedPermitida } from "./embedStream";

describe("urlDeEmbedPermitida", () => {
  it("aceita https do host permitido e subdomínios", () => {
    expect(urlDeEmbedPermitida("https://esportesembed.cc/santos-x-gremio-4")).toBe("https://esportesembed.cc/santos-x-gremio-4");
    expect(urlDeEmbedPermitida("https://player.esportesembed.cc/x")).toBe("https://player.esportesembed.cc/x");
  });

  it("recusa outros hosts, http, credenciais e porta", () => {
    expect(urlDeEmbedPermitida("https://evil.com/esportesembed.cc")).toBeNull();
    expect(urlDeEmbedPermitida("https://esportesembed.cc.evil.com/x")).toBeNull();
    expect(urlDeEmbedPermitida("https://fakeesportesembed.cc/x")).toBeNull();
    expect(urlDeEmbedPermitida("http://esportesembed.cc/x")).toBeNull();
    expect(urlDeEmbedPermitida("https://u:p@esportesembed.cc/x")).toBeNull();
    expect(urlDeEmbedPermitida("https://esportesembed.cc:8443/x")).toBeNull();
    expect(urlDeEmbedPermitida("javascript:alert(1)")).toBeNull();
    expect(urlDeEmbedPermitida(undefined)).toBeNull();
  });
});
