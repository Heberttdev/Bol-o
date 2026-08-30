import { useState } from "react";
import { HashRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ReadyProvider } from "./context/ReadyContext";
import { NotificationProvider } from "./context/NotificationContext";
import SplashGate from "./components/SplashGate";
import { useUpdateChecker } from "./hooks/useUpdateChecker";
import { UpdateModal } from "./components/UpdateModal";
import NetworkGate from "./components/NetworkGate";
import NotificationModal from "./components/NotificationModal";
import NotificationBanner from "./components/NotificationBanner";

function AppContent() {
  const { updateInfo } = useUpdateChecker();
  const [modalFechado, setModalFechado] = useState(false);

  return (
    <>
      <NotificationBanner />
      <NotificationModal />
      <AppRoutes />

      {updateInfo && !modalFechado && (
        <UpdateModal
          updateInfo={updateInfo}
          onFechar={() => setModalFechado(true)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <NetworkGate>
      <AuthProvider>
        <NotificationProvider>
          <ReadyProvider>
            <SplashGate>
              <HashRouter>
                <AppContent />
              </HashRouter>
            </SplashGate>
          </ReadyProvider>
        </NotificationProvider>
      </AuthProvider>
    </NetworkGate>
  );
}

export default App;