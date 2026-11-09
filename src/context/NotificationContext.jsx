import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { ref, onValue, set, remove, update } from "firebase/database";
import { database } from "../services/firebase";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

const STORAGE_KEY_LIDAS = "bolao_notificacoes_lidas_v1";

function normalizarLink(link) {
  if (!link) return null;
  let r = String(link).trim();
  if (!r) return null;
  if (r.startsWith("#")) r = r.slice(1);
  if (!r.startsWith("/")) r = "/" + r;
  return r;
}

function chaveValida(id) {
  return typeof id === "string" && id.length > 0 && !/[.#$[\]/]/.test(id);
}

function carregarLidasLocais() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIDAS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function salvarLidasLocais(listaIds) {
  try {
    localStorage.setItem(STORAGE_KEY_LIDAS, JSON.stringify(listaIds));
  } catch (err) {
    console.warn("Erro ao salvar lidas no localStorage:", err);
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [globais, setGlobais] = useState([]);
  const [pessoais, setPessoais] = useState([]);
  const [lidas, setLidas] = useState(carregarLidasLocais);
  const [modalAberto, setModalAberto] = useState(false);
  const [toastNotificacao, setToastNotificacao] = useState(null);
  const lidasRef = useRef(lidas);

  const notificacoes = useMemo(
    () => [...globais, ...pessoais].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [globais, pessoais]
  );

  // 1. Registro e gerenciamento do Capacitor Push Notifications (Nativo)
  useEffect(() => {
    if (!user) return;

    let listeners = [];

    async function registrarPush() {
      if (!Capacitor.isNativePlatform()) {
        // Ambiente Web / PWA: suporte opcional à Notification API do navegador
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
        return;
      }

      try {
        // Registra os ouvintes ANTES do register() para não perder eventos
        // (token, erro, recebimento e clique) e para o replay em cold start.
        const regListener = await PushNotifications.addListener(
          "registration",
          async (token) => {
            if (token?.value && user?.uid) {
              try {
                await update(ref(database, `users/${user.uid}`), {
                  fcmToken: token.value,
                  fcmTokenUpdatedAt: Date.now(),
                  platform: Capacitor.getPlatform(),
                });
              } catch (err) {
                console.error("Erro ao salvar fcmToken no Firebase:", err);
              }
            }
          }
        );

        const errListener = await PushNotifications.addListener(
          "registrationError",
          (error) => {
            console.warn("Erro ao registrar Push Notifications:", error);
          }
        );

        const receiveListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            setToastNotificacao({
              titulo: notification.title || "Bolão Green",
              corpo: notification.body || "Você tem uma nova notificação!",
              link: normalizarLink(notification.data?.link),
            });
            setTimeout(() => setToastNotificacao(null), 5000);
          }
        );

        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            const data = action.notification?.data;
            const link = normalizarLink(data?.link);
            if (link) {
              window.location.hash = link;
            } else {
              setModalAberto(true);
            }
          }
        );

        listeners = [regListener, errListener, receiveListener, actionListener];

        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== "granted") {
          console.warn("Permissão de Push Notifications negada pelo usuário.");
          return;
        }

        // Cria o canal de notificação com som e vibração para Android
        await PushNotifications.createChannel({
          id: "bolao_notificacoes",
          name: "Notificações do Bolão Green",
          description: "Avisos de partidas, lembretes de palpites e resultados oficiais",
          importance: 5,
          visibility: 1,
          vibration: true,
          sound: "res_default",
        }).catch(() => {});

        // Registra o dispositivo para receber push tokens FCM
        await PushNotifications.register();
      } catch (err) {
        console.error("Falha ao inicializar PushNotifications:", err);
      }
    }

    registrarPush();

    return () => {
      listeners.forEach((l) => l.remove());
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      const timeoutId = setTimeout(() => {
        setGlobais([]);
        setPessoais([]);
      }, 0);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [user]);

  useEffect(() => {
    lidasRef.current = lidas;
  }, [lidas]);

  // 2. Escuta em tempo real as notificações globais e as direcionadas ao usuário
  useEffect(() => {
    if (!user) {
      return;
    }

    const fontes = [
      { caminho: "notificacoes", setter: setGlobais },
      { caminho: `notificacoesUsuario/${user.uid}`, setter: setPessoais },
    ];

    const unsubs = fontes.map(({ caminho, setter }) => {
      let idsAnteriores = null;
      return onValue(
        ref(database, caminho),
        (snapshot) => {
          const lista = Object.entries(snapshot.val() || {})
            .map(([id, n]) => ({ id, ...n, caminho: `${caminho}/${id}` }))
            .filter((n) => !n.para || n.para === user.uid);

          // Se chegou uma notificação nova após o carregamento inicial, exibe toast in-app
          if (idsAnteriores) {
            const novas = lista.filter((n) => !idsAnteriores.has(n.id) && !lidasRef.current.includes(n.id));
            if (novas.length > 0) {
              const maisRecente = novas.reduce((a, b) => ((b.createdAt || 0) > (a.createdAt || 0) ? b : a));
              setToastNotificacao({
                titulo: maisRecente.titulo,
                corpo: maisRecente.corpo,
                link: maisRecente.link,
              });
              setTimeout(() => setToastNotificacao(null), 5000);
            }
          }

          idsAnteriores = new Set(lista.map((n) => n.id));
          setter(lista);
        },
        (error) => {
          console.error(`Erro ao escutar /${caminho}:`, error);
        }
      );
    });

    return () => unsubs.forEach((u) => u());
  }, [user]);

  // 3. Sincroniza as lidas entre aparelhos (notificacoesLidas/{uid}); localStorage fica como cache
  useEffect(() => {
    if (!user) return undefined;
    const caminho = `notificacoesLidas/${user.uid}`;
    return onValue(
      ref(database, caminho),
      (snapshot) => {
        const remotas = Object.keys(snapshot.val() || {});
        const soLocais = lidasRef.current.filter((id) => chaveValida(id) && !remotas.includes(id));
        if (soLocais.length > 0) {
          update(ref(database, caminho), Object.fromEntries(soLocais.map((id) => [id, true]))).catch(() => {});
        }
        const todas = [...new Set([...remotas, ...lidasRef.current])];
        salvarLidasLocais(todas);
        setLidas(todas);
      },
      (error) => console.error("Erro ao sincronizar notificações lidas:", error)
    );
  }, [user]);

  const gravarLidasRemotas = useCallback(
    (ids) => {
      if (!user) return;
      const validos = ids.filter(chaveValida);
      if (validos.length === 0) return;
      update(ref(database, `notificacoesLidas/${user.uid}`), Object.fromEntries(validos.map((id) => [id, true]))).catch(() => {});
    },
    [user]
  );

  const marcarComoLida = useCallback((id) => {
    setLidas((prev) => {
      if (prev.includes(id)) return prev;
      const novo = [...prev, id];
      salvarLidasLocais(novo);
      return novo;
    });
    gravarLidasRemotas([id]);
  }, [gravarLidasRemotas]);

  const marcarTodasComoLidas = useCallback(() => {
    const todosIds = notificacoes.map((n) => n.id);
    const novo = [...new Set([...lidasRef.current, ...todosIds])];
    setLidas(novo);
    salvarLidasLocais(novo);
    gravarLidasRemotas(todosIds);
  }, [notificacoes, gravarLidasRemotas]);

  // Apenas Admin: envia nova notificação global (ou direcionada a um usuário via `para`)
  const enviarNotificacao = useCallback(async ({ titulo, corpo, tipo = "geral", link = "", para = null }) => {
    const id = "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const payload = {
      id,
      titulo,
      corpo,
      tipo,
      link,
      createdAt: Date.now(),
    };
    const caminho = para ? `notificacoesUsuario/${para}/${id}` : `notificacoes/${id}`;
    await set(ref(database, caminho), payload);
    return id;
  }, []);

  // Apenas Admin: remove notificação existente
  const removerNotificacao = useCallback(async (id) => {
    const item = notificacoes.find((n) => n.id === id);
    await remove(ref(database, item?.caminho || `notificacoes/${id}`));
  }, [notificacoes]);

  const naoLidasCount = notificacoes.filter((n) => !lidas.includes(n.id)).length;

  return (
    <NotificationContext.Provider
      value={{
        notificacoes,
        lidas,
        naoLidasCount,
        modalAberto,
        toastNotificacao,
        abrirModal: () => setModalAberto(true),
        fecharModal: () => setModalAberto(false),
        fecharToast: () => setToastNotificacao(null),
        marcarComoLida,
        marcarTodasComoLidas,
        enviarNotificacao,
        removerNotificacao,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications deve ser usado dentro de um NotificationProvider");
  }
  return context;
}
