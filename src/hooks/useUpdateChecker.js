import { useEffect, useState } from "react";

// ❌ Remova esta linha fixa
// const VERSAO_ATUAL = "1.2";

// ✅ Use a variável do Vite
const GITHUB_REPO = "Heberttdev/Bol-o";

function compararVersoes(atual, latest) {
  const a = atual.replace(/^v/, "").split(".").map(Number);
  const b = latest.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if ((b[i] || 0) > (a[i] || 0)) return true;
    if ((b[i] || 0) < (a[i] || 0)) return false;
  }
  return false;
}

export function useUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificar() {
      try {
        // ✅ Usando a versão do package.json via Vite
        const versaoAtual = import.meta.env.VITE_APP_VERSION || "0.0.0";
        
        console.log(`Verificando atualizações. Versão atual: ${versaoAtual}`);

        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
          { headers: { Accept: "application/vnd.github+json" } }
        );

        if (!res.ok) return;

        const data = await res.json();
        const tagLatest = data.tag_name;

        if (compararVersoes(versaoAtual, tagLatest)) {
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