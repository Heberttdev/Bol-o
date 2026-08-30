import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { ref, onValue, set, remove, update } from "firebase/database";
import { database } from "../services/firebase";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

const STORAGE_KEY_LIDAS = "bolao_notificacoes_lidas_v1";

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
  const [notificacoes, setNotificacoes] = useState([]);
  const [lidas, setLidas] = useState(carregarLidasLocais);
  const [modalAberto, setModalAberto] = useState(false);
  const [toastNotificacao, setToastNotificacao] = useState(null);
  const initialLoadRef = useRef(true);

  // 1. Registro e gerenciamento do Capacitor Push Notifications (Nativo)
  useEffect(() => {
    if (!user) return;

    async function registrarPush() {
      if (!Capacitor.isNativePlatform()) {
        // Ambiente Web / PWA: suporte opcional à Notification API do navegador
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
        return;
      }

      try {
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

        // Ouvinte de Token FCM registrado com sucesso
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

        // Ouvinte de Erro no registro
        const errListener = await PushNotifications.addListener(
          "registrationError",
          (error) => {
            console.warn("Erro ao registrar Push Notifications:", error);
          }
        );

        // Ouvinte para notificação recebida com o app aberto (Foreground)
        const receiveListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            setToastNotificacao({
              titulo: notification.title || "Bolão Green",
              corpo: notification.body || "Você tem uma nova notificação!",
              link: notification.data?.link || null,
            });
            setTimeout(() => setToastNotificacao(null), 5000);
          }
        );

        // Ouvinte para clique na notificação nativa
        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            const data = action.notification?.data;
            if (data?.link) {
              window.location.hash = data.link;
            } else {
              setModalAberto(true);
            }
          }
        );

        return () => {
          regListener.remove();
          errListener.remove();
          receiveListener.remove();
          actionListener.remove();
        };
      } catch (err) {
        console.error("Falha ao inicializar PushNotifications:", err);
      }
    }

    registrarPush();
  }, [user]);

  // 2. Escuta em tempo real o nó /notificacoes no Firebase Realtime Database
  useEffect(() => {
    if (!user) {
      setNotificacoes([]);
      return;
    }

    const unsub = onValue(
      ref(database, "notificacoes"),
      (snapshot) => {
        if (snapshot.exists()) {
          const dados = snapshot.val();
          const lista = Object.entries(dados).map(([id, n]) => ({
            id,
            ...n,
          }));

          // Ordena pela data mais recente
          lista.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

          // Se chegou uma notificação nova após o carregamento inicial, exibe toast in-app
          if (!initialLoadRef.current && lista.length > 0) {
            const maisRecente = lista[0];
            const jaLida = lidas.includes(maisRecente.id);
            if (!jaLida) {
              setToastNotificacao({
                titulo: maisRecente.titulo,
                corpo: maisRecente.corpo,
                link: maisRecente.link,
              });
              setTimeout(() => setToastNotificacao(null), 5000);
            }
          }

          initialLoadRef.current = false;
          setNotificacoes(lista);
        } else {
          setNotificacoes([]);
          initialLoadRef.current = false;
        }
      },
      (error) => {
        console.error("Erro ao escutar /notificacoes:", error);
      }
    );

    return () => unsub();
  }, [user, lidas]);

  const marcarComoLida = useCallback((id) => {
    setLidas((prev) => {
      if (prev.includes(id)) return prev;
      const novo = [...prev, id];
      salvarLidasLocais(novo);
      return novo;
    });
  }, []);

  const marcarTodasComoLidas = useCallback(() => {
    const todosIds = notificacoes.map((n) => n.id);
    setLidas(todosIds);
    salvarLidasLocais(todosIds);
  }, [notificacoes]);

  // Apenas Admin: envia nova notificação global
  const enviarNotificacao = useCallback(async ({ titulo, corpo, tipo = "geral", link = "" }) => {
    const id = "notif_" + Date.now();
    await set(ref(database, `notificacoes/${id}`), {
      id,
      titulo,
      corpo,
      tipo,
      link,
      createdAt: Date.now(),
    });
    return id;
  }, []);

  // Apenas Admin: remove notificação existente
  const removerNotificacao = useCallback(async (id) => {
    await remove(ref(database, `notificacoes/${id}`));
  }, []);

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
