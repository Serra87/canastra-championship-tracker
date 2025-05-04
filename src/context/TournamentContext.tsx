
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Tournament, 
  Team, 
  Round, 
  Match, 
  MatchStatus, 
  TeamId, 
  RoundId, 
  MatchId 
} from "@/types/tournament";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/sonner";

// Define context shape
interface TournamentContextType {
  tournament: Tournament;
  isLoading: boolean;
  
  // Team operations
  addTeam: (team: Omit<Team, "id" | "lives" | "eliminated" | "reregistered">) => Team;
  updateTeam: (team: Team) => void;
  deleteTeam: (teamId: TeamId) => void;
  reregisterTeam: (teamId: TeamId) => void;
  
  // Round operations
  createRound: () => Round;
  completeRound: (roundId: RoundId) => void;
  
  // Match operations
  createMatch: (teamOneId: TeamId, teamTwoId: TeamId, roundId: RoundId) => Match;
  updateMatchStatus: (matchId: MatchId, status: MatchStatus) => void;
  updateMatchScore: (matchId: MatchId, teamOneScore: number, teamTwoScore: number) => void;
  finishMatch: (matchId: MatchId, teamOneScore: number, teamTwoScore: number) => void;
  reverseMatchResult: (matchId: MatchId) => void;
}

// Initialize empty tournament
const initialTournament: Tournament = {
  id: uuidv4(),
  name: "Torneio de Canastra 2025",
  teams: [],
  rounds: [],
  currentRound: 0
};

// Create context
const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Get tournament from local storage
const getTournamentFromStorage = (): Tournament => {
  const savedTournament = localStorage.getItem("canastra-tournament");
  if (savedTournament) {
    return JSON.parse(savedTournament);
  }
  return initialTournament;
};

// Save tournament to local storage
const saveTournamentToStorage = (tournament: Tournament) => {
  localStorage.setItem("canastra-tournament", JSON.stringify(tournament));
};

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournament, setTournament] = useState<Tournament>(initialTournament);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load tournament data on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedTournament = getTournamentFromStorage();
        setTournament(savedTournament);
      } catch (error) {
        console.error("Failed to load tournament data:", error);
        toast.error("Falha ao carregar dados do torneio");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save tournament data when it changes
  useEffect(() => {
    if (!isLoading) {
      saveTournamentToStorage(tournament);
    }
  }, [tournament, isLoading]);

  // Team operations
  const addTeam = (teamData: Omit<Team, "id" | "lives" | "eliminated" | "reregistered">): Team => {
    const newTeam: Team = {
      id: uuidv4(),
      ...teamData,
      lives: 2,
      eliminated: false,
      reregistered: false
    };

    setTournament(prev => ({
      ...prev,
      teams: [...prev.teams, newTeam]
    }));

    toast.success("Dupla adicionada com sucesso");
    return newTeam;
  };

  const updateTeam = (updatedTeam: Team) => {
    setTournament(prev => ({
      ...prev,
      teams: prev.teams.map(team => 
        team.id === updatedTeam.id ? updatedTeam : team
      )
    }));
    toast.success("Dupla atualizada com sucesso");
  };

  const deleteTeam = (teamId: TeamId) => {
    setTournament(prev => ({
      ...prev,
      teams: prev.teams.filter(team => team.id !== teamId)
    }));
    toast.success("Dupla removida com sucesso");
  };

  const reregisterTeam = (teamId: TeamId) => {
    if (tournament.currentRound >= 5) {
      toast.error("Não é possível reinscrever após a 5ª rodada");
      return;
    }

    setTournament(prev => ({
      ...prev,
      teams: prev.teams.map(team => 
        team.id === teamId ? { ...team, lives: 1, eliminated: false, reregistered: true } : team
      )
    }));
    toast.success("Dupla reinscrita com sucesso");
  };

  // Round operations
  const createRound = (): Round => {
    const newRoundNumber = tournament.currentRound + 1;
    const newRound: Round = {
      id: uuidv4(),
      roundNumber: newRoundNumber,
      matches: [],
      completed: false,
      createdAt: new Date()
    };

    setTournament(prev => ({
      ...prev,
      rounds: [...prev.rounds, newRound],
      currentRound: newRoundNumber
    }));

    toast.success(`Rodada ${newRoundNumber} criada`);
    return newRound;
  };

  const completeRound = (roundId: RoundId) => {
    setTournament(prev => ({
      ...prev,
      rounds: prev.rounds.map(round => 
        round.id === roundId ? { ...round, completed: true } : round
      )
    }));
    toast.success("Rodada finalizada");
  };

  // Match operations
  const createMatch = (teamOneId: TeamId, teamTwoId: TeamId, roundId: RoundId): Match => {
    const match: Match = {
      id: uuidv4(),
      roundId,
      teamOneId,
      teamTwoId,
      teamOneScore: 0,
      teamTwoScore: 0,
      status: MatchStatus.WAITING
    };

    setTournament(prev => ({
      ...prev,
      rounds: prev.rounds.map(round => {
        if (round.id === roundId) {
          return {
            ...round,
            matches: [...round.matches, match]
          };
        }
        return round;
      })
    }));

    // Get team names for toast
    const teamOne = tournament.teams.find(t => t.id === teamOneId);
    const teamTwo = tournament.teams.find(t => t.id === teamTwoId);
    toast.success(`Partida criada`, {
      description: `${teamOne?.name} vs ${teamTwo?.name}`
    });

    return match;
  };

  const updateMatchStatus = (matchId: MatchId, status: MatchStatus) => {
    setTournament(prev => ({
      ...prev,
      rounds: prev.rounds.map(round => ({
        ...round,
        matches: round.matches.map(match => {
          if (match.id === matchId) {
            const updatedMatch = { ...match, status };
            
            // If changing to IN_PROGRESS, set the start time
            if (status === MatchStatus.IN_PROGRESS) {
              updatedMatch.startTime = new Date();
            }
            
            return updatedMatch;
          }
          return match;
        })
      }))
    }));
    
    const statusMessages = {
      [MatchStatus.WAITING]: "Partida aguardando início",
      [MatchStatus.IN_PROGRESS]: "Partida iniciada",
      [MatchStatus.FINISHED]: "Partida finalizada"
    };
    
    toast.success(statusMessages[status]);
  };

  const updateMatchScore = (matchId: MatchId, teamOneScore: number, teamTwoScore: number) => {
    setTournament(prev => ({
      ...prev,
      rounds: prev.rounds.map(round => ({
        ...round,
        matches: round.matches.map(match => {
          if (match.id === matchId) {
            return { 
              ...match, 
              teamOneScore, 
              teamTwoScore 
            };
          }
          return match;
        })
      }))
    }));
  };

  const finishMatch = (matchId: MatchId, teamOneScore: number, teamTwoScore: number) => {
    let match: Match | undefined;
    let winnerTeam: Team | undefined;
    let loserTeam: Team | undefined;
    
    // Find the match first to work with
    tournament.rounds.forEach(round => {
      const foundMatch = round.matches.find(m => m.id === matchId);
      if (foundMatch) {
        match = foundMatch;
      }
    });
    
    if (!match) return;
    
    const winnerId = teamOneScore >= 4000 ? match.teamOneId : 
                     teamTwoScore >= 4000 ? match.teamTwoId : 
                     teamOneScore > teamTwoScore ? match.teamOneId : match.teamTwoId;
                     
    const loserId = winnerId === match.teamOneId ? match.teamTwoId : match.teamOneId;

    // Update the tournament state
    setTournament(prev => {
      // First, update the match
      const updatedRounds = prev.rounds.map(round => ({
        ...round,
        matches: round.matches.map(m => {
          if (m.id === matchId) {
            return {
              ...m,
              teamOneScore,
              teamTwoScore,
              winner: winnerId,
              loser: loserId,
              status: MatchStatus.FINISHED,
              endTime: new Date()
            };
          }
          return m;
        })
      }));

      // Then, update the teams (reduce loser's lives)
      const updatedTeams = prev.teams.map(team => {
        if (team.id === loserId) {
          const newLives = team.lives - 1;
          return {
            ...team,
            lives: newLives,
            eliminated: newLives <= 0
          };
        }
        return team;
      });

      return {
        ...prev,
        teams: updatedTeams,
        rounds: updatedRounds
      };
    });

    // Find teams for toast message
    winnerTeam = tournament.teams.find(t => t.id === winnerId);
    loserTeam = tournament.teams.find(t => t.id === loserId);
    
    if (winnerTeam && loserTeam) {
      toast.success(`Partida finalizada`, {
        description: `Vencedor: ${winnerTeam.name}`
      });
      
      // Check if team is now eliminated
      const loserLives = loserTeam.lives - 1;
      if (loserLives <= 0) {
        toast.error(`Dupla ${loserTeam.name} foi eliminada!`);
      }
    }
  };

  const reverseMatchResult = (matchId: MatchId) => {
    let match: Match | undefined;
    
    // Find the match first
    tournament.rounds.forEach(round => {
      const foundMatch = round.matches.find(m => m.id === matchId);
      if (foundMatch && foundMatch.status === MatchStatus.FINISHED) {
        match = foundMatch;
      }
    });
    
    if (!match || !match.winner || !match.loser) {
      toast.error("Não é possível reverter uma partida não finalizada");
      return;
    }
    
    // Reverse the match result and update lives
    setTournament(prev => {
      // First restore the loser's life
      const updatedTeams = prev.teams.map(team => {
        if (team.id === match?.loser) {
          return {
            ...team,
            lives: team.lives + 1,
            eliminated: false
          };
        }
        return team;
      });

      // Then update the match
      const updatedRounds = prev.rounds.map(round => ({
        ...round,
        matches: round.matches.map(m => {
          if (m.id === matchId) {
            return {
              ...m,
              winner: undefined,
              loser: undefined,
              status: MatchStatus.IN_PROGRESS,
              endTime: undefined
            };
          }
          return m;
        })
      }));

      return {
        ...prev,
        teams: updatedTeams,
        rounds: updatedRounds
      };
    });
    
    toast.success("Resultado da partida revertido");
  };

  const contextValue: TournamentContextType = {
    tournament,
    isLoading,
    addTeam,
    updateTeam,
    deleteTeam,
    reregisterTeam,
    createRound,
    completeRound,
    createMatch,
    updateMatchStatus,
    updateMatchScore,
    finishMatch,
    reverseMatchResult
  };

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
};

// Custom hook to use the tournament context
export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};

// Add a dependency for UUID
<lov-add-dependency>uuid@latest</lov-add-dependency>
<lov-add-dependency>@types/uuid@latest</lov-add-dependency>

