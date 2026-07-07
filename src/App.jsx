import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ReadyProvider } from "./context/ReadyContext";
import SplashGate from "./components/SplashGate";
import { useUpdateChecker } from "./hooks/useUpdateChecker";
import { UpdateModal } from "./components/UpdateModal";

function AppContent() {
  
  const { updateInfo } = useUpdateChecker();
  const [modalFechado, setModalFechado] = useState(false);

  return (
    <>
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
    <AuthProvider>
      <ReadyProvider>
        <SplashGate>
          <AppContent />
        </SplashGate>
      </ReadyProvider>
    </AuthProvider>
  );
}

export default App;