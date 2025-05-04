
import React, { createContext, useContext } from "react";
import { useTournamentData } from "@/hooks/useTournamentData";

// Definição do tipo do contexto
type TournamentContextType = ReturnType<typeof useTournamentData>;

// Criar o contexto
const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Provider do torneio
export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tournamentData = useTournamentData();
  
  return (
    <TournamentContext.Provider value={tournamentData}>
      {children}
    </TournamentContext.Provider>
  );
};

// Hook personalizado para usar o contexto do torneio
export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament deve ser usado dentro de um TournamentProvider");
  }
  return context;
};
