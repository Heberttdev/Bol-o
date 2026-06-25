import { createContext, useContext, useState, useCallback } from "react";

// Contexto simples: cada página "avisa" quando terminou de carregar
// seus dados iniciais, pra splash saber quando pode sumir.

const ReadyContext = createContext();

export function ReadyProvider({ children }) {
  const [pronto, setPronto] = useState(false);

  // useCallback evita recriar a função em todo render
  const marcarComoPronto = useCallback(() => setPronto(true), []);

  return (
    <ReadyContext.Provider value={{ pronto, marcarComoPronto }}>
      {children}
    </ReadyContext.Provider>
  );
}

export function useReady() {
  return useContext(ReadyContext);
}