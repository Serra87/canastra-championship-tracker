
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTournament } from "@/context/TournamentContext";
import { Match, MatchStatus, Team } from "@/types/tournament";

const LiveScoreboard: React.FC = () => {
  const { tournament } = useTournament();
  
  // Find current round
  const currentRound = tournament.rounds.find(r => r.roundNumber === tournament.currentRound);
  
  // Get active matches
  const activeMatches = currentRound?.matches.filter(m => 
    m.status === MatchStatus.IN_PROGRESS || m.status === MatchStatus.WAITING
  ) || [];
  
  // Get completed matches for the current round
  const completedMatches = currentRound?.matches.filter(m => 
    m.status === MatchStatus.FINISHED
  ) || [];

  // Helper to get team by id
  const getTeam = (teamId: string): Team | undefined => {
    return tournament.teams.find(team => team.id === teamId);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mt-8 mb-2">TORNEIO DE CANASTRA 2025</h1>
        <p className="text-xl">
          {currentRound ? `RODADA ${currentRound.roundNumber}` : "Torneio não iniciado"}
        </p>
      </div>
      
      {currentRound && (
        <div className="space-y-8">
          {/* Active Matches Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">PARTIDAS EM ANDAMENTO</h2>
            
            {activeMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeMatches.map(match => {
                  const teamOne = getTeam(match.teamOneId);
                  const teamTwo = getTeam(match.teamTwoId);
                  
                  if (!teamOne || !teamTwo) return null;
                  
                  return (
                    <MatchScoreCard 
                      key={match.id}
                      match={match}
                      teamOne={teamOne}
                      teamTwo={teamTwo}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/10">
                <p className="text-lg text-muted-foreground">Nenhuma partida em andamento</p>
              </div>
            )}
          </div>
          
          {/* Recent Results Section */}
          {completedMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center mb-6">RESULTADOS RECENTES</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedMatches.map(match => {
                  const teamOne = getTeam(match.teamOneId);
                  const teamTwo = getTeam(match.teamTwoId);
                  
                  if (!teamOne || !teamTwo) return null;
                  
                  return (
                    <MatchResultCard 
                      key={match.id}
                      match={match}
                      teamOne={teamOne}
                      teamTwo={teamTwo}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!currentRound && (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-6xl text-muted-foreground">🃏</div>
          <h2 className="text-2xl mt-4">O torneio começará em breve</h2>
          <p className="text-muted-foreground mt-2">Aguarde o início da primeira rodada</p>
        </div>
      )}
    </div>
  );
};

interface MatchCardProps {
  match: Match;
  teamOne: Team;
  teamTwo: Team;
}

const MatchScoreCard: React.FC<MatchCardProps> = ({ match, teamOne, teamTwo }) => {
  const isInProgress = match.status === MatchStatus.IN_PROGRESS;
  
  return (
    <Card className="overflow-hidden card-shadow">
      <CardHeader className="bg-muted/20 pb-2 flex justify-between items-center">
        <Badge variant={isInProgress ? "secondary" : "outline"}>
          {isInProgress ? "Em Andamento" : "Aguardando"}
        </Badge>
        <div className="text-xs text-muted-foreground">
          Mesa {match.id.slice(-2)}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-5 gap-2 items-center">
          {/* Team One */}
          <div className="col-span-2 text-center">
            <div className="font-semibold">{teamOne.name}</div>
            <div className="mt-1">
              <Badge variant="outline">
                {teamOne.lives} vida{teamOne.lives !== 1 && "s"}
              </Badge>
            </div>
          </div>

          {/* Score */}
          <div className="text-center font-bold text-xl">
            {isInProgress ? (
              <span>{match.teamOneScore} - {match.teamTwoScore}</span>
            ) : (
              <span className="text-muted-foreground">VS</span>
            )}
          </div>

          {/* Team Two */}
          <div className="col-span-2 text-center">
            <div className="font-semibold">{teamTwo.name}</div>
            <div className="mt-1">
              <Badge variant="outline">
                {teamTwo.lives} vida{teamTwo.lives !== 1 && "s"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MatchResultCard: React.FC<MatchCardProps> = ({ match, teamOne, teamTwo }) => {
  const winner = match.winner === teamOne.id ? teamOne : teamTwo;
  const loser = match.winner !== teamOne.id ? teamOne : teamTwo;
  
  return (
    <Card className="overflow-hidden border-green-300 bg-green-50/30 card-shadow">
      <CardContent className="pt-6 pb-6">
        <div className="text-center mb-2">
          <Badge variant="default" className="bg-green-600">Finalizada</Badge>
        </div>
        
        <div className="text-center font-bold text-xl mb-3">
          {match.teamOneScore} - {match.teamTwoScore}
        </div>
        
        <div className="space-y-2 text-center">
          <div>
            <Badge variant="default" className="mb-1">Vencedor</Badge>
            <div className="font-semibold">{winner.name}</div>
          </div>
          
          <div className="text-sm text-muted-foreground">vs</div>
          
          <div>
            <Badge variant="outline" className="mb-1">Perdedor</Badge>
            <div className="font-semibold">{loser.name}</div>
            <div className="text-xs text-red-500 mt-1">
              (-1 vida)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveScoreboard;
