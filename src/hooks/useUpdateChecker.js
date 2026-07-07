import { useEffect, useState } from "react";

// Versão atual do app — atualize sempre que gerar um novo APK
// e criar uma release no GitHub com a mesma tag (ex: v1.0.1)
const VERSAO_ATUAL = "1.0.0";
const GITHUB_REPO = "Heberttdev/Bol-o";

function compararVersoes(atual, latest) {
  const a = atual.replace(/^v/, "").split(".").map(Number);
  const b = latest.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if ((b[i] || 0) > (a[i] || 0)) return true; // há versão mais nova
    if ((b[i] || 0) < (a[i] || 0)) return false;
  }
  return false; // igual
}

export function useUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState(null); // { versao, downloadUrl, notas }
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificar() {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
          { headers: { Accept: "application/vnd.github+json" } }
        );

        if (!res.ok) return;

        const data = await res.json();
        const tagLatest = data.tag_name; // ex: "v1.0.1"

        if (compararVersoes(VERSAO_ATUAL, tagLatest)) {
          // Pega o APK nos assets da release
          const apkAsset = data.assets?.find((a) =>
            a.name.endsWith(".apk")
          );

          setUpdateInfo({
            versao: tagLatest,
            downloadUrl: apkAsset?.browser_download_url || data.html_url,
            notas: data.body || "",
          });
        }
      } catch (err) {
        console.warn("Não foi possível verificar atualizações:", err);
      } finally {
        setVerificando(false);
      }
    }

    verificar();
  }, []);

  return { updateInfo, verificando };
}