import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ReadyProvider } from "./context/ReadyContext";
import SplashGate from "./components/SplashGate";

function App() {
  return (
    <AuthProvider>
      <ReadyProvider>
        <SplashGate>
          <AppRoutes />
        </SplashGate>
      </ReadyProvider>
    </AuthProvider>
  );
}

export default App;